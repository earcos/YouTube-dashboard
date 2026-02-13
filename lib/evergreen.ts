export function calculateEvergreenScore(
  viewCount: number,
  publishedAt: string | Date
): number {
  const now = new Date();
  const published = new Date(publishedAt);
  const daysSincePublished = Math.max(
    1,
    (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Views per day
  const viewsPerDay = viewCount / daysSincePublished;

  // Age factor: videos need at least 90 days to get full score
  const ageFactor = Math.min(daysSincePublished / 90, 1);

  // Consistency bonus: videos older than 180 days get 1.5x
  const consistencyBonus = daysSincePublished > 180 ? 1.5 : 1;

  // Raw score
  const rawScore = viewsPerDay * ageFactor * consistencyBonus;

  return rawScore;
}

export function normalizeEvergreenScores(
  videos: { id: string; rawScore: number }[]
): Map<string, number> {
  const maxScore = Math.max(...videos.map((v) => v.rawScore), 1);
  const normalized = new Map<string, number>();

  for (const video of videos) {
    normalized.set(video.id, Math.round((video.rawScore / maxScore) * 100));
  }

  return normalized;
}
