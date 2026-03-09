const YT_API_BASE = "https://www.googleapis.com/youtube/v3";

export interface YouTubeConfig {
  accessToken: string;
  channelId: string;
}

export class YouTubeClient {
  private config: YouTubeConfig;

  constructor(config: YouTubeConfig) {
    this.config = config;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${YT_API_BASE}${endpoint}&access_token=${this.config.accessToken}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`YouTube API Error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async getChannelStats() {
    return this.request(
      `/channels?part=statistics,snippet&id=${this.config.channelId}`
    );
  }

  async getRecentVideos(maxResults = 10) {
    return this.request(
      `/search?part=snippet&channelId=${this.config.channelId}&order=date&maxResults=${maxResults}&type=video`
    );
  }

  async getVideoStats(videoIds: string[]) {
    return this.request(
      `/videos?part=statistics,snippet&id=${videoIds.join(",")}`
    );
  }

  async getAnalytics(startDate: string, endDate: string) {
    const res = await fetch(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${this.config.channelId}&startDate=${startDate}&endDate=${endDate}&metrics=views,estimatedMinutesWatched,averageViewDuration,subscribersGained&dimensions=day&access_token=${this.config.accessToken}`
    );
    if (!res.ok) throw new Error(`YouTube Analytics Error: ${res.status}`);
    return res.json();
  }
}
