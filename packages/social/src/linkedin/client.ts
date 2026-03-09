const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

export interface LinkedInConfig {
  accessToken: string;
  organizationId: string;
}

export class LinkedInClient {
  private config: LinkedInConfig;

  constructor(config: LinkedInConfig) {
    this.config = config;
  }

  private async request<T>(endpoint: string, method = "GET", body?: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${LINKEDIN_API_BASE}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`LinkedIn API Error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async createPost(text: string) {
    return this.request("/ugcPosts", "POST", {
      author: `urn:li:organization:${this.config.organizationId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    });
  }

  async getOrganizationStats() {
    return this.request(
      `/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${this.config.organizationId}`
    );
  }

  async getFollowerCount() {
    return this.request(
      `/networkSizes/urn:li:organization:${this.config.organizationId}?edgeType=CompanyFollowedByMember`
    );
  }
}
