import type { NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Snapshot-based evergreen scoring algorithm.
 *
 * Instead of estimating from total views / age, this uses actual daily view
 * snapshots to measure whether a video sustains healthy traffic over time.
 *
 * Score components:
 *   1. Recent velocity  – avg views/day over last 30 days (from snapshots)
 *   2. Retention ratio   – recent velocity / lifetime velocity (0-1+)
 *      A video that still gets the same daily views as its lifetime average
 *      has a ratio of 1.0. Viral-then-dead videos drop toward 0.
 *   3. Age maturity      – linear ramp 0→1 over first 90 days so brand-new
 *      videos don't appear as "evergreen" prematurely.
 *   4. Longevity bonus   – extra weight for videos sustaining traffic 6mo+.
 *
 * Final raw score = recentVelocity * retentionRatio * ageMaturity * longevityBonus
 */

export interface SnapshotRow {
  video_id: string;
  snapshot_date: string;
  view_count: number;
}

export interface VideoForEvergreen {
  id: string;
  view_count: number;
  published_at: string | Date;
}

/**
 * Record a view snapshot for each video (called during sync).
 * Uses ON CONFLICT to upsert — safe to call multiple times per day.
 */
export async function recordSnapshots(
  sql: NeonQueryFunction<false, false>,
  videos: { id: string; viewCount: number }[]
) {
  // Batch insert in chunks of 50 to avoid overly long queries
  const chunkSize = 50;
  for (let i = 0; i < videos.length; i += chunkSize) {
    const chunk = videos.slice(i, i + chunkSize);
    for (const v of chunk) {
      await sql`
        INSERT INTO view_snapshots (video_id, snapshot_date, view_count)
        VALUES (${v.id}, CURRENT_DATE, ${v.viewCount})
        ON CONFLICT (video_id, snapshot_date) DO UPDATE
        SET view_count = EXCLUDED.view_count
      `;
    }
  }
}

/**
 * Calculate evergreen scores for all videos using snapshot data.
 * Returns a Map<videoId, score 0-100>.
 */
export async function calculateEvergreenScores(
  sql: NeonQueryFunction<false, false>,
  videos: VideoForEvergreen[]
): Promise<Map<string, number>> {
  if (videos.length === 0) return new Map();

  const videoIds = videos.map((v) => v.id);

  // Fetch snapshots from last 30 days and from 30-60 days ago for comparison
  const snapshots = await sql`
    SELECT video_id, snapshot_date, view_count
    FROM view_snapshots
    WHERE video_id = ANY(${videoIds})
      AND snapshot_date >= CURRENT_DATE - INTERVAL '60 days'
    ORDER BY video_id, snapshot_date ASC
  `;

  // Group snapshots by video
  const snapshotMap = new Map<string, SnapshotRow[]>();
  for (const s of snapshots) {
    const list = snapshotMap.get(s.video_id) || [];
    list.push(s);
    snapshotMap.set(s.video_id, list);
  }

  const rawScores: { id: string; score: number }[] = [];

  for (const video of videos) {
    const now = new Date();
    const published = new Date(video.published_at);
    const daysSincePublished = Math.max(
      1,
      (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24)
    );

    const videoSnapshots = snapshotMap.get(video.id) || [];

    // --- Compute recent velocity from snapshots ---
    let recentVelocity: number;
    if (videoSnapshots.length >= 2) {
      // Sort by date and compute views gained over the snapshot window
      const sorted = [...videoSnapshots].sort(
        (a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
      );

      // Split into recent (last 30 days) and older snapshots
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentSnapshots = sorted.filter(
        (s) => new Date(s.snapshot_date) >= thirtyDaysAgo
      );

      if (recentSnapshots.length >= 2) {
        const first = recentSnapshots[0];
        const last = recentSnapshots[recentSnapshots.length - 1];
        const daysBetween = Math.max(
          1,
          (new Date(last.snapshot_date).getTime() - new Date(first.snapshot_date).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const viewsGained = last.view_count - first.view_count;
        recentVelocity = Math.max(0, viewsGained / daysBetween);
      } else {
        // Not enough recent snapshots, fall back to lifetime average
        recentVelocity = video.view_count / daysSincePublished;
      }
    } else {
      // No snapshot history yet, fall back to lifetime average
      recentVelocity = video.view_count / daysSincePublished;
    }

    // --- Lifetime velocity ---
    const lifetimeVelocity = video.view_count / daysSincePublished;

    // --- Retention ratio: how much of the original velocity is retained ---
    // Capped at 1.2 to slightly reward videos gaining momentum, but not too much
    const retentionRatio =
      lifetimeVelocity > 0
        ? Math.min(recentVelocity / lifetimeVelocity, 1.2)
        : 0;

    // --- Age maturity: ramp 0→1 over 90 days ---
    const ageMaturity = Math.min(daysSincePublished / 90, 1);

    // --- Longevity bonus: 1.0 base, up to 1.4 for videos 180+ days old ---
    const longevityBonus = daysSincePublished > 180 ? 1.4 : 1.0;

    // --- Final raw score ---
    const rawScore = recentVelocity * retentionRatio * ageMaturity * longevityBonus;

    rawScores.push({ id: video.id, score: rawScore });
  }

  // Normalize to 0-100
  const maxScore = Math.max(...rawScores.map((v) => v.score), 0.001);
  const result = new Map<string, number>();
  for (const v of rawScores) {
    result.set(v.id, Math.round((v.score / maxScore) * 100));
  }

  return result;
}
