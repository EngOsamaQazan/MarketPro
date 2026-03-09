const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

export interface TikTokConfig {
  clientKey: string;
  clientSecret: string;
  accessToken: string;
}

export class TikTokClient {
  private config: TikTokConfig;

  constructor(config: TikTokConfig) {
    this.config = config;
  }

  private async request<T>(endpoint: string, method = "GET", body?: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${TIKTOK_API_BASE}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`TikTok API Error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async getUserInfo() {
    return this.request("/user/info/?fields=display_name,follower_count,following_count,likes_count,video_count");
  }

  async uploadVideo(params: { videoUrl: string; title: string; privacyLevel?: string }) {
    const initRes = await this.request<{ data: { publish_id: string } }>(
      "/post/publish/video/init/",
      "POST",
      {
        post_info: {
          title: params.title,
          privacy_level: params.privacyLevel || "PUBLIC_TO_EVERYONE",
          disable_comment: false,
          disable_duet: false,
          disable_stitch: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: params.videoUrl,
        },
      }
    );
    return initRes;
  }

  async getVideoInsights(videoIds: string[]) {
    return this.request("/video/query/", "POST", {
      filters: { video_ids: videoIds },
      fields: ["id", "title", "view_count", "like_count", "comment_count", "share_count"],
    });
  }
}
