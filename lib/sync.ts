import { getDb } from "./db";
import { getOAuth2Client, fetchAllChannelVideos, fetchAnalyticsData } from "./youtube";
import { calculateEvergreenScores, recordSnapshots } from "./evergreen";
import { detectBrand, detectTopic } from "./auto-detect";
import { google } from "googleapis";

export async function runSync() {
  const sql = getDb();
  const logRes = await sql`
    INSERT INTO sync_log (started_at, status) VALUES (NOW(), 'running') RETURNING id
  `;
  const logId = logRes[0].id;

  try {
    const auth = await getOAuth2Client();
    
    // Verify we have tokens
    const tokens = await sql`SELECT * FROM oauth_tokens WHERE id = 1`;
    if (!tokens.length || !tokens[0].refresh_token) {
      throw new Error("No OAuth tokens found. Please connect your YouTube account first.");
    }

    // Fetch all videos from Data API
    const videos = await fetchAllChannelVideos(auth as InstanceType<typeof google.auth.OAuth2>);

    // Fetch analytics data
    const videoIds = videos.map((v) => v.id);
    let analyticsData: Record<string, { estimatedMinutesWatched: number; averageViewDuration: number; isShort: boolean }> = {};
    
    try {
      analyticsData = await fetchAnalyticsData(auth as InstanceType<typeof google.auth.OAuth2>, videoIds);
    } catch (error) {
      console.error("Analytics API error (continuing with basic data):", error);
    }

    // Get existing videos to preserve manual topic/brand assignments
    const existingVideos = await sql`SELECT id, topic, brand, topic_auto, brand_auto FROM videos`;
    const existingMap = new Map(existingVideos.map((v) => [v.id, v]));

    // Record daily view snapshots for evergreen tracking
    await recordSnapshots(
      sql,
      videos.map((v) => ({ id: v.id, viewCount: v.viewCount }))
    );

    // Calculate snapshot-based evergreen scores
    const normalizedScores = await calculateEvergreenScores(
      sql,
      videos.map((v) => ({
        id: v.id,
        view_count: v.viewCount,
        published_at: v.publishedAt,
      }))
    );

    // Upsert videos
    for (const video of videos) {
      const analytics = analyticsData[video.id];
      const existing = existingMap.get(video.id);
      const evergreenScore = normalizedScores.get(video.id) || 0;

      // Determine short status: analytics API takes priority, fallback to duration
      const isShort = analytics?.isShort || video.durationSeconds <= 60;

      // Auto-detect topic and brand only if not manually set
      const topic = existing?.topic_auto === false ? existing.topic : detectTopic(video.title);
      const brand = existing?.brand_auto === false ? existing.brand : detectBrand(video.title);
      const topicAuto = existing?.topic_auto === false ? false : true;
      const brandAuto = existing?.brand_auto === false ? false : true;

      await sql`
        INSERT INTO videos (
          id, title, description, published_at, thumbnail_url,
          duration_seconds, is_short, view_count, like_count, comment_count,
          estimated_minutes_watched, average_view_duration,
          topic, brand, topic_auto, brand_auto,
          evergreen_score, created_at, updated_at
        ) VALUES (
          ${video.id}, ${video.title}, ${video.description || ""},
          ${video.publishedAt}, ${video.thumbnailUrl},
          ${video.durationSeconds}, ${isShort},
          ${video.viewCount}, ${video.likeCount}, ${video.commentCount},
          ${analytics?.estimatedMinutesWatched || 0},
          ${analytics?.averageViewDuration || 0},
          ${topic}, ${brand}, ${topicAuto}, ${brandAuto},
          ${evergreenScore}, NOW(), NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          thumbnail_url = EXCLUDED.thumbnail_url,
          duration_seconds = EXCLUDED.duration_seconds,
          is_short = EXCLUDED.is_short,
          view_count = EXCLUDED.view_count,
          like_count = EXCLUDED.like_count,
          comment_count = EXCLUDED.comment_count,
          estimated_minutes_watched = EXCLUDED.estimated_minutes_watched,
          average_view_duration = EXCLUDED.average_view_duration,
          topic = ${topic},
          brand = ${brand},
          topic_auto = ${topicAuto},
          brand_auto = ${brandAuto},
          evergreen_score = EXCLUDED.evergreen_score,
          updated_at = NOW()
      `;
    }

    await sql`
      UPDATE sync_log SET
        finished_at = NOW(),
        videos_synced = ${videos.length},
        status = 'success'
      WHERE id = ${logId}
    `;

    return { success: true, videosSynced: videos.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await sql`
      UPDATE sync_log SET
        finished_at = NOW(),
        status = 'error',
        error_message = ${message}
      WHERE id = ${logId}
    `;
    throw error;
  }
}
