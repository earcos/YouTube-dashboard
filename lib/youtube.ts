import { google } from "googleapis";
import { getDb } from "./db";

export async function getOAuth2Client() {
  const sql = getDb();
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"}/api/auth/callback`
  );

  const tokens = await sql`SELECT * FROM oauth_tokens WHERE id = 1`;
  if (tokens.length > 0 && tokens[0].refresh_token) {
    oauth2Client.setCredentials({
      access_token: tokens[0].access_token,
      refresh_token: tokens[0].refresh_token,
      expiry_date: Number(tokens[0].expiry_date),
    });

    oauth2Client.on("tokens", async (newTokens) => {
      await sql`
        UPDATE oauth_tokens SET
          access_token = ${newTokens.access_token || tokens[0].access_token},
          expiry_date = ${newTokens.expiry_date || tokens[0].expiry_date},
          updated_at = NOW()
        WHERE id = 1
      `;
    });
  }

  return oauth2Client;
}

export function getRedirectUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  return `${baseUrl}/api/auth/callback`;
}

function parseDuration(iso8601: string): number {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  return hours * 3600 + minutes * 60 + seconds;
}

export async function fetchAllChannelVideos(auth: InstanceType<typeof google.auth.OAuth2>) {
  const youtube = google.youtube({ version: "v3", auth });
  const channelId = process.env.YOUTUBE_CHANNEL_ID!;

  // Get uploads playlist ID
  const channelRes = await youtube.channels.list({
    id: [channelId],
    part: ["contentDetails"],
  });

  const uploadsPlaylistId =
    channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) throw new Error("Could not find uploads playlist");

  // Fetch all video IDs from playlist
  const videoIds: string[] = [];
  let nextPageToken: string | undefined;

  do {
    const playlistRes = await youtube.playlistItems.list({
      playlistId: uploadsPlaylistId,
      part: ["contentDetails"],
      maxResults: 50,
      pageToken: nextPageToken,
    });

    for (const item of playlistRes.data.items || []) {
      if (item.contentDetails?.videoId) {
        videoIds.push(item.contentDetails.videoId);
      }
    }
    nextPageToken = playlistRes.data.nextPageToken || undefined;
  } while (nextPageToken);

  // Fetch video details in batches of 50
  const allVideos: VideoData[] = [];

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const videosRes = await youtube.videos.list({
      id: batch,
      part: ["snippet", "contentDetails", "statistics"],
    });

    for (const video of videosRes.data.items || []) {
      const duration = parseDuration(video.contentDetails?.duration || "PT0S");
      allVideos.push({
        id: video.id!,
        title: video.snippet?.title || "",
        description: video.snippet?.description || "",
        publishedAt: video.snippet?.publishedAt || "",
        thumbnailUrl:
          video.snippet?.thumbnails?.high?.url ||
          video.snippet?.thumbnails?.default?.url ||
          "",
        durationSeconds: duration,
        isShort: duration <= 60,
        viewCount: parseInt(video.statistics?.viewCount || "0"),
        likeCount: parseInt(video.statistics?.likeCount || "0"),
        commentCount: parseInt(video.statistics?.commentCount || "0"),
      });
    }
  }

  return allVideos;
}

export async function fetchAnalyticsData(auth: InstanceType<typeof google.auth.OAuth2>, videoIds: string[]) {
  const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth });
  const analyticsMap: Record<string, { estimatedMinutesWatched: number; averageViewDuration: number; isShort: boolean }> = {};

  // Batch video IDs (up to 200 per request)
  for (let i = 0; i < videoIds.length; i += 200) {
    const batch = videoIds.slice(i, i + 200);
    const filterStr = `video==${batch.join(",")}`;

    try {
      const res = await youtubeAnalytics.reports.query({
        ids: "channel==MINE",
        startDate: "2005-01-01",
        endDate: new Date().toISOString().split("T")[0],
        metrics: "views,estimatedMinutesWatched,averageViewDuration",
        dimensions: "video,creatorContentType",
        filters: filterStr,
      });

      for (const row of res.data.rows || []) {
        const videoId = row[0] as string;
        const contentType = row[1] as string;
        const estMinWatched = row[3] as number;
        const avgViewDur = row[4] as number;

        if (!analyticsMap[videoId]) {
          analyticsMap[videoId] = {
            estimatedMinutesWatched: 0,
            averageViewDuration: 0,
            isShort: false,
          };
        }
        analyticsMap[videoId].estimatedMinutesWatched += estMinWatched;
        analyticsMap[videoId].averageViewDuration = avgViewDur;
        if (contentType === "SHORTS") {
          analyticsMap[videoId].isShort = true;
        }
      }
    } catch (error) {
      console.error("Analytics API error for batch:", error);
    }
  }

  return analyticsMap;
}

export interface VideoData {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  durationSeconds: number;
  isShort: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  estimatedMinutesWatched?: number;
  averageViewDuration?: number;
}
