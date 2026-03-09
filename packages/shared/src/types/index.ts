export type UserRole = "admin" | "manager" | "client";

export type CompanyStatus = "active" | "paused" | "ended";

export type PackageType = "basic" | "pro" | "enterprise";

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "snapchat"
  | "x"
  | "linkedin"
  | "youtube";

export type ContentType =
  | "post"
  | "story"
  | "reel"
  | "video"
  | "carousel"
  | "article";

export type ContentStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "scheduled"
  | "published"
  | "failed";

export type CampaignObjective =
  | "awareness"
  | "traffic"
  | "engagement"
  | "leads"
  | "sales";

export type CampaignStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "failed";

export type PlanStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "in_progress"
  | "completed";

export type ReportStatus = "generating" | "ready" | "sent";

export type NotificationType =
  | "plan_ready"
  | "report_ready"
  | "approval_needed"
  | "alert"
  | "message";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  phone: string | null;
  company_id: string | null;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  name_en: string | null;
  industry: string;
  country: string;
  city: string;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  target_audience: string | null;
  monthly_budget: number;
  package_type: PackageType;
  status: CompanyStatus;
  assigned_manager_id: string | null;
  contract_start_date: string;
  contract_end_date: string | null;
  created_at: string;
}

export interface SocialAccount {
  id: string;
  company_id: string;
  platform: SocialPlatform;
  account_id: string;
  account_name: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  permissions: string[];
  followers_count: number;
  is_connected: boolean;
  last_synced_at: string | null;
}

export interface MarketingPlan {
  id: string;
  company_id: string;
  month: string;
  title: string;
  status: PlanStatus;
  objectives: string[];
  target_platforms: SocialPlatform[];
  total_budget: number;
  budget_breakdown: Record<string, number>;
  kpis: Record<string, { target: number; unit: string }>;
  ai_analysis: Record<string, unknown>;
  pdf_url: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string;
  created_at: string;
}

export interface ContentCalendarItem {
  id: string;
  company_id: string;
  plan_id: string | null;
  platform: SocialPlatform;
  scheduled_date: string;
  scheduled_time: string;
  content_type: ContentType;
  text_content: string;
  media_urls: string[];
  hashtags: string[];
  status: ContentStatus;
  approval_status: "pending" | "approved" | "rejected";
  approval_note: string | null;
  published_post_id: string | null;
  engagement_data: Record<string, number> | null;
  ai_generated: boolean;
  created_by: string;
  created_at: string;
}

export interface AdCampaign {
  id: string;
  company_id: string;
  plan_id: string | null;
  platform: SocialPlatform;
  platform_campaign_id: string | null;
  name: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  daily_budget: number;
  total_budget: number;
  spent_amount: number;
  start_date: string;
  end_date: string | null;
  target_audience: Record<string, unknown>;
  performance_data: CampaignPerformance | null;
  ai_optimizations: AiOptimization[];
  auto_optimize: boolean;
  created_by: string;
  created_at: string;
}

export interface CampaignPerformance {
  reach: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpa: number;
  conversions: number;
  roas: number;
  spend: number;
}

export interface AiOptimization {
  date: string;
  action: string;
  reason: string;
  result: string | null;
}

export interface MonthlyReport {
  id: string;
  company_id: string;
  plan_id: string | null;
  month: string;
  report_data: ReportData;
  pdf_url: string | null;
  status: ReportStatus;
  sent_at: string | null;
  viewed_by_client: boolean;
  created_at: string;
}

export interface ReportData {
  summary: string;
  achievements: string[];
  platform_stats: Record<SocialPlatform, PlatformStats>;
  campaign_results: CampaignResult[];
  content_performance: ContentPerformanceItem[];
  budget_analysis: BudgetAnalysis;
  kpi_results: Record<string, { target: number; actual: number; unit: string }>;
  comparison_with_previous: Record<string, { current: number; previous: number; change_percent: number }>;
  ai_insights: string[];
  next_month_recommendations: string[];
}

export interface PlatformStats {
  followers: number;
  followers_change: number;
  reach: number;
  impressions: number;
  engagement_rate: number;
  posts_published: number;
  top_post_id: string | null;
}

export interface CampaignResult {
  campaign_name: string;
  platform: SocialPlatform;
  objective: string;
  spend: number;
  results: number;
  cost_per_result: number;
  roas: number | null;
}

export interface ContentPerformanceItem {
  content_id: string;
  platform: SocialPlatform;
  type: ContentType;
  reach: number;
  engagement: number;
  engagement_rate: number;
}

export interface BudgetAnalysis {
  total_planned: number;
  total_spent: number;
  utilization_rate: number;
  by_platform: Record<string, { planned: number; spent: number }>;
  roi_estimate: number;
}

export interface Notification {
  id: string;
  user_id: string;
  company_id: string | null;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface PlatformStatistic {
  id: string;
  country_code: string;
  country_name: string;
  platform: SocialPlatform;
  users_count: number;
  penetration_rate: number;
  rank_in_country: number;
  peak_hours: string[];
  demographics: Record<string, unknown>;
  source: string;
  report_date: string;
  updated_at: string;
}
