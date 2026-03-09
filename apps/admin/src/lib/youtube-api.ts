const YT_API = "https://www.googleapis.com/youtube/v3";

async function ytGet<T = any>(endpoint: string, params: Record<string, string>, apiKey: string): Promise<T | null> {
  const qs = new URLSearchParams({ ...params, key: apiKey }).toString();
  const res = await fetch(`${YT_API}/${endpoint}?${qs}`, { cache: "no-store" });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`[youtube-api] ${endpoint} -> ${res.status}:`, errText.substring(0, 300));
    return null;
  }
  return res.json();
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  publishedAt: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
}

/**
 * Validates the API key by fetching a known public channel.
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  const res = await ytGet("channels", { part: "id", id: "UC_x5XG1OV2P6uZZ5FSM9Ttw" }, apiKey);
  return res !== null;
}

/**
 * Search for channels by name or get channel by ID.
 */
export async function searchChannels(apiKey: string, query: string): Promise<YouTubeChannel[]> {
  const searchRes = await ytGet<{ items: any[] }>("search", {
    part: "snippet",
    type: "channel",
    q: query,
    maxResults: "10",
  }, apiKey);

  if (!searchRes?.items?.length) return [];

  const channelIds = searchRes.items.map((i: any) => i.snippet?.channelId || i.id?.channelId).filter(Boolean).join(",");
  if (!channelIds) return [];

  return getChannelsByIds(apiKey, channelIds);
}

/**
 * Get channel details by IDs (comma-separated).
 */
export async function getChannelsByIds(apiKey: string, channelIds: string): Promise<YouTubeChannel[]> {
  const res = await ytGet<{ items: any[] }>("channels", {
    part: "snippet,statistics,brandingSettings",
    id: channelIds,
  }, apiKey);

  if (!res?.items) return [];

  return res.items.map((ch: any) => ({
    id: ch.id,
    title: ch.snippet?.title || "",
    description: ch.snippet?.description || "",
    thumbnail: ch.snippet?.thumbnails?.medium?.url || ch.snippet?.thumbnails?.default?.url || "",
    subscriberCount: Number(ch.statistics?.subscriberCount || 0),
    videoCount: Number(ch.statistics?.videoCount || 0),
    viewCount: Number(ch.statistics?.viewCount || 0),
    publishedAt: ch.snippet?.publishedAt || "",
  }));
}

/**
 * Get latest videos from a channel.
 */
export async function getChannelVideos(apiKey: string, channelId: string, maxResults = 20): Promise<YouTubeVideo[]> {
  const searchRes = await ytGet<{ items: any[] }>("search", {
    part: "snippet",
    channelId,
    order: "date",
    type: "video",
    maxResults: String(maxResults),
  }, apiKey);

  if (!searchRes?.items?.length) return [];

  const videoIds = searchRes.items.map((i: any) => i.id?.videoId).filter(Boolean).join(",");
  if (!videoIds) return [];

  const videosRes = await ytGet<{ items: any[] }>("videos", {
    part: "snippet,statistics,contentDetails",
    id: videoIds,
  }, apiKey);

  if (!videosRes?.items) return [];

  return videosRes.items.map((v: any) => ({
    id: v.id,
    title: v.snippet?.title || "",
    description: v.snippet?.description || "",
    thumbnail: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || "",
    publishedAt: v.snippet?.publishedAt || "",
    channelTitle: v.snippet?.channelTitle || "",
    viewCount: Number(v.statistics?.viewCount || 0),
    likeCount: Number(v.statistics?.likeCount || 0),
    commentCount: Number(v.statistics?.commentCount || 0),
    duration: v.contentDetails?.duration || "",
  }));
}

/**
 * Parse ISO 8601 duration (PT1H2M3S) to readable format.
 */
export function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}:` : "";
  const m = match[2] || "0";
  const s = (match[3] || "0").padStart(2, "0");
  return `${h}${h ? m.padStart(2, "0") : m}:${s}`;
}
