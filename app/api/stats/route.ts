import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const [overview] = await sql`
      SELECT
        COUNT(*)::int as total_videos,
        COUNT(*) FILTER (WHERE is_short = false)::int as longform_count,
        COUNT(*) FILTER (WHERE is_short = true)::int as shorts_count,
        COALESCE(SUM(view_count), 0)::bigint as total_views,
        COALESCE(SUM(like_count), 0)::bigint as total_likes,
        COALESCE(SUM(comment_count), 0)::bigint as total_comments,
        COALESCE(SUM(estimated_minutes_watched), 0)::real as total_watch_time_minutes
      FROM videos
    `;

    const topics = await sql`
      SELECT
        topic,
        COUNT(*)::int as video_count,
        COALESCE(SUM(view_count), 0)::bigint as total_views,
        COALESCE(SUM(estimated_minutes_watched), 0)::real as total_watch_time,
        COALESCE(AVG(view_count), 0)::int as avg_views,
        COALESCE(AVG(evergreen_score), 0)::real as avg_evergreen
      FROM videos
      WHERE topic IS NOT NULL
      GROUP BY topic
      ORDER BY total_views DESC
    `;

    const brands = await sql`
      SELECT
        brand,
        COUNT(*)::int as video_count,
        COALESCE(SUM(view_count), 0)::bigint as total_views,
        COALESCE(SUM(estimated_minutes_watched), 0)::real as total_watch_time,
        COALESCE(AVG(view_count), 0)::int as avg_views,
        COALESCE(AVG(evergreen_score), 0)::real as avg_evergreen
      FROM videos
      WHERE brand IS NOT NULL
      GROUP BY brand
      ORDER BY total_views DESC
    `;

    const lastSync = await sql`
      SELECT * FROM sync_log ORDER BY started_at DESC LIMIT 1
    `;

    const isConnected = await sql`
      SELECT COUNT(*) as c FROM oauth_tokens WHERE refresh_token IS NOT NULL
    `;

    return NextResponse.json({
      overview: {
        totalVideos: overview.total_videos,
        longformCount: overview.longform_count,
        shortsCount: overview.shorts_count,
        totalViews: Number(overview.total_views),
        totalLikes: Number(overview.total_likes),
        totalComments: Number(overview.total_comments),
        totalWatchTimeMinutes: overview.total_watch_time_minutes,
      },
      topics,
      brands,
      lastSync: lastSync[0] || null,
      isConnected: parseInt(isConnected[0].c) > 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
