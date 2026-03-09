const SNAP_API_BASE = "https://adsapi.snapchat.com/v1";

export interface SnapchatConfig {
  accessToken: string;
  adAccountId: string;
}

export class SnapchatClient {
  private config: SnapchatConfig;

  constructor(config: SnapchatConfig) {
    this.config = config;
  }

  private async request<T>(endpoint: string, method = "GET", body?: Record<string, unknown>): Promise<T> {
    const res = await fetch(`${SNAP_API_BASE}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Snapchat API Error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async getCampaigns() {
    return this.request(`/adaccounts/${this.config.adAccountId}/campaigns`);
  }

  async createCampaign(params: { name: string; status: string; startTime: string; endTime?: string; dailyBudgetMicro: number }) {
    return this.request(`/adaccounts/${this.config.adAccountId}/campaigns`, "POST", {
      campaigns: [{
        name: params.name,
        status: params.status,
        start_time: params.startTime,
        end_time: params.endTime,
        daily_budget_micro: params.dailyBudgetMicro,
      }],
    });
  }

  async getCampaignStats(campaignId: string) {
    return this.request(`/campaigns/${campaignId}/stats?granularity=TOTAL&fields=impressions,swipes,spend,conversion_purchases`);
  }

  async updateCampaignStatus(campaignId: string, status: "ACTIVE" | "PAUSED") {
    return this.request(`/campaigns/${campaignId}`, "PUT", {
      campaigns: [{ id: campaignId, status }],
    });
  }
}
