const X_API_BASE = "https://api.x.com/2";

export interface XConfig {
  bearerToken: string;
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

export class XClient {
  private config: XConfig;

  constructor(config: XConfig) {
    this.config = config;
  }

  private async request<T>(endpoint: string, method = "GET", body?: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${X_API_BASE}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.config.bearerToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`X API Error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async createTweet(text: string) {
    return this.request("/tweets", "POST", { text });
  }

  async deleteTweet(tweetId: string) {
    return this.request(`/tweets/${tweetId}`, "DELETE");
  }

  async getUserMetrics(userId: string) {
    return this.request(
      `/users/${userId}?user.fields=public_metrics,description,profile_image_url`
    );
  }

  async getTweetMetrics(tweetId: string) {
    return this.request(
      `/tweets/${tweetId}?tweet.fields=public_metrics,created_at`
    );
  }

  async searchRecentTweets(query: string, maxResults = 10) {
    return this.request(
      `/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${maxResults}&tweet.fields=public_metrics,created_at`
    );
  }
}
