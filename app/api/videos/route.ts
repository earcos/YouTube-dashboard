import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const sql = getDb();
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type"); // "longform" | "short" | null (all)
  const topic = searchParams.get("topic");
  const brand = searchParams.get("brand");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sortBy") || "view_count";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;
  const evergreen = searchParams.get("evergreen") === "true";

  try {
    // Build dynamic query with safe parameters
    let videos;
    let countResult;

    if (evergreen && type === "longform") {
      videos = await sql`
        SELECT v.*,
          COALESCE(
            (SELECT (s2.view_count - s1.view_count)::real / GREATEST(1, s2.snapshot_date - s1.snapshot_date)
             FROM view_snapshots s1, view_snapshots s2
             WHERE s1.video_id = v.id AND s2.video_id = v.id
               AND s1.snapshot_date = (SELECT MIN(snapshot_date) FROM view_snapshots WHERE video_id = v.id AND snapshot_date >= CURRENT_DATE - INTERVAL '30 days')
               AND s2.snapshot_date = (SELECT MAX(snapshot_date) FROM view_snapshots WHERE video_id = v.id AND snapshot_date >= CURRENT_DATE - INTERVAL '30 days')
               AND s1.snapshot_date < s2.snapshot_date
            ), v.view_count::real / GREATEST(1, EXTRACT(EPOCH FROM (NOW() - v.published_at)) / 86400)
          ) as recent_views_per_day
        FROM videos v
        WHERE v.published_at < NOW() - INTERVAL '90 days' AND v.is_short = false
        ORDER BY v.evergreen_score DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM videos WHERE published_at < NOW() - INTERVAL '90 days' AND is_short = false`;
    } else if (evergreen && type === "short") {
      videos = await sql`
        SELECT v.*,
          COALESCE(
            (SELECT (s2.view_count - s1.view_count)::real / GREATEST(1, s2.snapshot_date - s1.snapshot_date)
             FROM view_snapshots s1, view_snapshots s2
             WHERE s1.video_id = v.id AND s2.video_id = v.id
               AND s1.snapshot_date = (SELECT MIN(snapshot_date) FROM view_snapshots WHERE video_id = v.id AND snapshot_date >= CURRENT_DATE - INTERVAL '30 days')
               AND s2.snapshot_date = (SELECT MAX(snapshot_date) FROM view_snapshots WHERE video_id = v.id AND snapshot_date >= CURRENT_DATE - INTERVAL '30 days')
               AND s1.snapshot_date < s2.snapshot_date
            ), v.view_count::real / GREATEST(1, EXTRACT(EPOCH FROM (NOW() - v.published_at)) / 86400)
          ) as recent_views_per_day
        FROM videos v
        WHERE v.published_at < NOW() - INTERVAL '90 days' AND v.is_short = true
        ORDER BY v.evergreen_score DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM videos WHERE published_at < NOW() - INTERVAL '90 days' AND is_short = true`;
    } else if (evergreen) {
      videos = await sql`
        SELECT v.*,
          COALESCE(
            (SELECT (s2.view_count - s1.view_count)::real / GREATEST(1, s2.snapshot_date - s1.snapshot_date)
             FROM view_snapshots s1, view_snapshots s2
             WHERE s1.video_id = v.id AND s2.video_id = v.id
               AND s1.snapshot_date = (SELECT MIN(snapshot_date) FROM view_snapshots WHERE video_id = v.id AND snapshot_date >= CURRENT_DATE - INTERVAL '30 days')
               AND s2.snapshot_date = (SELECT MAX(snapshot_date) FROM view_snapshots WHERE video_id = v.id AND snapshot_date >= CURRENT_DATE - INTERVAL '30 days')
               AND s1.snapshot_date < s2.snapshot_date
            ), v.view_count::real / GREATEST(1, EXTRACT(EPOCH FROM (NOW() - v.published_at)) / 86400)
          ) as recent_views_per_day
        FROM videos v
        WHERE v.published_at < NOW() - INTERVAL '90 days'
        ORDER BY v.evergreen_score DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM videos WHERE published_at < NOW() - INTERVAL '90 days'`;
    } else if (type === "short") {
      if (search) {
        videos = await sql`
          SELECT * FROM videos WHERE is_short = true AND title ILIKE ${"%" + search + "%"}
          ORDER BY
            CASE WHEN ${sortBy} = 'view_count' AND ${sortOrder} = 'desc' THEN view_count END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'view_count' AND ${sortOrder} = 'asc' THEN view_count END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'published_at' AND ${sortOrder} = 'desc' THEN published_at END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'published_at' AND ${sortOrder} = 'asc' THEN published_at END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'evergreen_score' AND ${sortOrder} = 'desc' THEN evergreen_score END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'evergreen_score' AND ${sortOrder} = 'asc' THEN evergreen_score END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'like_count' AND ${sortOrder} = 'desc' THEN like_count END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'like_count' AND ${sortOrder} = 'asc' THEN like_count END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'estimated_minutes_watched' AND ${sortOrder} = 'desc' THEN estimated_minutes_watched END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'estimated_minutes_watched' AND ${sortOrder} = 'asc' THEN estimated_minutes_watched END ASC NULLS LAST,
            view_count DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        countResult = await sql`SELECT COUNT(*) as total FROM videos WHERE is_short = true AND title ILIKE ${"%" + search + "%"}`;
      } else {
        videos = await sql`
          SELECT * FROM videos WHERE is_short = true
          ORDER BY
            CASE WHEN ${sortBy} = 'view_count' AND ${sortOrder} = 'desc' THEN view_count END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'view_count' AND ${sortOrder} = 'asc' THEN view_count END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'published_at' AND ${sortOrder} = 'desc' THEN published_at END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'published_at' AND ${sortOrder} = 'asc' THEN published_at END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'evergreen_score' AND ${sortOrder} = 'desc' THEN evergreen_score END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'evergreen_score' AND ${sortOrder} = 'asc' THEN evergreen_score END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'like_count' AND ${sortOrder} = 'desc' THEN like_count END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'like_count' AND ${sortOrder} = 'asc' THEN like_count END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'estimated_minutes_watched' AND ${sortOrder} = 'desc' THEN estimated_minutes_watched END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'estimated_minutes_watched' AND ${sortOrder} = 'asc' THEN estimated_minutes_watched END ASC NULLS LAST,
            view_count DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        countResult = await sql`SELECT COUNT(*) as total FROM videos WHERE is_short = true`;
      }
    } else if (type === "longform") {
      if (search) {
        videos = await sql`
          SELECT * FROM videos WHERE is_short = false AND title ILIKE ${"%" + search + "%"}
          ORDER BY
            CASE WHEN ${sortBy} = 'view_count' AND ${sortOrder} = 'desc' THEN view_count END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'view_count' AND ${sortOrder} = 'asc' THEN view_count END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'published_at' AND ${sortOrder} = 'desc' THEN published_at END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'published_at' AND ${sortOrder} = 'asc' THEN published_at END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'evergreen_score' AND ${sortOrder} = 'desc' THEN evergreen_score END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'evergreen_score' AND ${sortOrder} = 'asc' THEN evergreen_score END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'like_count' AND ${sortOrder} = 'desc' THEN like_count END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'like_count' AND ${sortOrder} = 'asc' THEN like_count END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'estimated_minutes_watched' AND ${sortOrder} = 'desc' THEN estimated_minutes_watched END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'estimated_minutes_watched' AND ${sortOrder} = 'asc' THEN estimated_minutes_watched END ASC NULLS LAST,
            view_count DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        countResult = await sql`SELECT COUNT(*) as total FROM videos WHERE is_short = false AND title ILIKE ${"%" + search + "%"}`;
      } else {
        videos = await sql`
          SELECT * FROM videos WHERE is_short = false
          ORDER BY
            CASE WHEN ${sortBy} = 'view_count' AND ${sortOrder} = 'desc' THEN view_count END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'view_count' AND ${sortOrder} = 'asc' THEN view_count END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'published_at' AND ${sortOrder} = 'desc' THEN published_at END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'published_at' AND ${sortOrder} = 'asc' THEN published_at END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'evergreen_score' AND ${sortOrder} = 'desc' THEN evergreen_score END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'evergreen_score' AND ${sortOrder} = 'asc' THEN evergreen_score END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'like_count' AND ${sortOrder} = 'desc' THEN like_count END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'like_count' AND ${sortOrder} = 'asc' THEN like_count END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'estimated_minutes_watched' AND ${sortOrder} = 'desc' THEN estimated_minutes_watched END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'estimated_minutes_watched' AND ${sortOrder} = 'asc' THEN estimated_minutes_watched END ASC NULLS LAST,
            view_count DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        countResult = await sql`SELECT COUNT(*) as total FROM videos WHERE is_short = false`;
      }
    } else if (topic) {
      videos = await sql`
        SELECT * FROM videos WHERE topic = ${topic}
        ORDER BY view_count DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM videos WHERE topic = ${topic}`;
    } else if (brand) {
      videos = await sql`
        SELECT * FROM videos WHERE brand = ${brand}
        ORDER BY view_count DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT COUNT(*) as total FROM videos WHERE brand = ${brand}`;
    } else {
      if (search) {
        videos = await sql`
          SELECT * FROM videos WHERE title ILIKE ${"%" + search + "%"}
          ORDER BY
            CASE WHEN ${sortBy} = 'view_count' AND ${sortOrder} = 'desc' THEN view_count END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'view_count' AND ${sortOrder} = 'asc' THEN view_count END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'published_at' AND ${sortOrder} = 'desc' THEN published_at END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'published_at' AND ${sortOrder} = 'asc' THEN published_at END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'evergreen_score' AND ${sortOrder} = 'desc' THEN evergreen_score END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'evergreen_score' AND ${sortOrder} = 'asc' THEN evergreen_score END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'like_count' AND ${sortOrder} = 'desc' THEN like_count END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'like_count' AND ${sortOrder} = 'asc' THEN like_count END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'estimated_minutes_watched' AND ${sortOrder} = 'desc' THEN estimated_minutes_watched END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'estimated_minutes_watched' AND ${sortOrder} = 'asc' THEN estimated_minutes_watched END ASC NULLS LAST,
            view_count DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        countResult = await sql`SELECT COUNT(*) as total FROM videos WHERE title ILIKE ${"%" + search + "%"}`;
      } else {
        videos = await sql`
          SELECT * FROM videos
          ORDER BY
            CASE WHEN ${sortBy} = 'view_count' AND ${sortOrder} = 'desc' THEN view_count END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'view_count' AND ${sortOrder} = 'asc' THEN view_count END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'published_at' AND ${sortOrder} = 'desc' THEN published_at END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'published_at' AND ${sortOrder} = 'asc' THEN published_at END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'evergreen_score' AND ${sortOrder} = 'desc' THEN evergreen_score END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'evergreen_score' AND ${sortOrder} = 'asc' THEN evergreen_score END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'like_count' AND ${sortOrder} = 'desc' THEN like_count END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'like_count' AND ${sortOrder} = 'asc' THEN like_count END ASC NULLS LAST,
            CASE WHEN ${sortBy} = 'estimated_minutes_watched' AND ${sortOrder} = 'desc' THEN estimated_minutes_watched END DESC NULLS LAST,
            CASE WHEN ${sortBy} = 'estimated_minutes_watched' AND ${sortOrder} = 'asc' THEN estimated_minutes_watched END ASC NULLS LAST,
            view_count DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        countResult = await sql`SELECT COUNT(*) as total FROM videos`;
      }
    }

    return NextResponse.json({
      videos,
      total: parseInt(countResult[0].total),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult[0].total) / limit),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
