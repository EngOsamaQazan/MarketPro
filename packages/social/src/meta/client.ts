import type { CampaignPerformance } from "@satwa/shared";

const META_API_VERSION = "v24.0";
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

export interface MetaApiConfig {
  accessToken: string;
  pageId?: string;
  adAccountId?: string;
}

export class MetaClient {
  private config: MetaApiConfig;

  constructor(config: MetaApiConfig) {
    this.config = config;
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "DELETE" = "GET",
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = new URL(`${META_API_BASE}${endpoint}`);
    url.searchParams.set("access_token", this.config.accessToken);

    const options: RequestInit = { method };
    if (body && method === "POST") {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Meta API Error: ${JSON.stringify(error)}`);
    }
    return response.json() as Promise<T>;
  }

  // ========== PAGE MANAGEMENT ==========

  async getPageInfo() {
    return this.request<{
      id: string;
      name: string;
      followers_count: number;
      fan_count: number;
    }>(`/${this.config.pageId}?fields=id,name,followers_count,fan_count`);
  }

  async createPost(params: { message: string; link?: string; media_url?: string }) {
    if (params.media_url) {
      return this.request(`/${this.config.pageId}/photos`, "POST", {
        url: params.media_url,
        caption: params.message,
      });
    }
    return this.request(`/${this.config.pageId}/feed`, "POST", {
      message: params.message,
      link: params.link,
    });
  }

  async getPageInsights(period: "day" | "week" | "month" = "month") {
    return this.request(
      `/${this.config.pageId}/insights?metric=page_impressions,page_engaged_users,page_fans,page_views_total&period=${period}`
    );
  }

  // ========== CAMPAIGN MANAGEMENT ==========

  async createCampaign(params: {
    name: string;
    objective: string;
    status: "ACTIVE" | "PAUSED";
    daily_budget?: number;
    lifetime_budget?: number;
  }) {
    return this.request(`/act_${this.config.adAccountId}/campaigns`, "POST", {
      name: params.name,
      objective: params.objective.toUpperCase(),
      status: params.status,
      special_ad_categories: [],
    });
  }

  async getCampaignInsights(campaignId: string): Promise<CampaignPerformance> {
    const data = await this.request<{ data: Array<Record<string, string>> }>(
      `/${campaignId}/insights?fields=reach,impressions,clicks,ctr,cpc,cpm,actions,spend&date_preset=last_30d`
    );

    const insights = data.data[0] || {};
    return {
      reach: Number(insights.reach) || 0,
      impressions: Number(insights.impressions) || 0,
      clicks: Number(insights.clicks) || 0,
      ctr: Number(insights.ctr) || 0,
      cpc: Number(insights.cpc) || 0,
      cpm: Number(insights.cpm) || 0,
      cpa: 0,
      conversions: 0,
      roas: 0,
      spend: Number(insights.spend) || 0,
    };
  }

  async updateCampaignStatus(campaignId: string, status: "ACTIVE" | "PAUSED" | "DELETED") {
    return this.request(`/${campaignId}`, "POST", { status });
  }

  async updateCampaignBudget(campaignId: string, dailyBudget: number) {
    return this.request(`/${campaignId}`, "POST", {
      daily_budget: Math.round(dailyBudget * 100),
    });
  }

  // ========== AD SET MANAGEMENT ==========

  async createAdSet(params: {
    campaignId: string;
    name: string;
    dailyBudget: number;
    targeting: {
      ageMin?: number;
      ageMax?: number;
      genders?: number[];
      countries?: string[];
      cities?: Array<{ key: string }>;
      interests?: Array<{ id: string; name: string }>;
    };
    startTime: string;
    endTime?: string;
  }) {
    return this.request(`/act_${this.config.adAccountId}/adsets`, "POST", {
      campaign_id: params.campaignId,
      name: params.name,
      daily_budget: Math.round(params.dailyBudget * 100),
      billing_event: "IMPRESSIONS",
      optimization_goal: "REACH",
      targeting: {
        age_min: params.targeting.ageMin || 18,
        age_max: params.targeting.ageMax || 65,
        genders: params.targeting.genders,
        geo_locations: {
          countries: params.targeting.countries,
          cities: params.targeting.cities,
        },
        interests: params.targeting.interests,
      },
      start_time: params.startTime,
      end_time: params.endTime,
      status: "ACTIVE",
    });
  }

  // ========== AD CREATIVE ==========

  async createAd(params: {
    adSetId: string;
    name: string;
    headline: string;
    body: string;
    imageUrl?: string;
    videoId?: string;
    linkUrl: string;
    callToAction: string;
  }) {
    const creative = await this.request(
      `/act_${this.config.adAccountId}/adcreatives`,
      "POST",
      {
        name: `${params.name}_creative`,
        object_story_spec: {
          page_id: this.config.pageId,
          link_data: {
            image_url: params.imageUrl,
            link: params.linkUrl,
            message: params.body,
            name: params.headline,
            call_to_action: { type: params.callToAction },
          },
        },
      }
    );

    return this.request(`/act_${this.config.adAccountId}/ads`, "POST", {
      name: params.name,
      adset_id: params.adSetId,
      creative: { creative_id: (creative as { id: string }).id },
      status: "ACTIVE",
    });
  }

  // ========== INSTAGRAM ==========

  async createInstagramPost(params: {
    igUserId: string;
    imageUrl?: string;
    videoUrl?: string;
    caption: string;
    mediaType?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  }) {
    const containerData: Record<string, unknown> = {
      caption: params.caption,
    };

    if (params.mediaType === "VIDEO" || params.videoUrl) {
      containerData.video_url = params.videoUrl;
      containerData.media_type = "REELS";
    } else {
      containerData.image_url = params.imageUrl;
    }

    const container = await this.request<{ id: string }>(
      `/${params.igUserId}/media`,
      "POST",
      containerData
    );

    return this.request(`/${params.igUserId}/media_publish`, "POST", {
      creation_id: container.id,
    });
  }

  async getInstagramInsights(igUserId: string) {
    return this.request(
      `/${igUserId}/insights?metric=impressions,reach,follower_count,profile_views&period=day&since=${this.getDateNDaysAgo(30)}&until=${this.getToday()}`
    );
  }

  private getDateNDaysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
  }

  private getToday(): string {
    return new Date().toISOString().split("T")[0];
  }
}
