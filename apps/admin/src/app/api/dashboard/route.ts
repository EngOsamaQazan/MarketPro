import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const clientId = req.nextUrl.searchParams.get("client_id");

    const addClientFilter = (query: any) => {
      return clientId ? query.eq("company_id", clientId) : query;
    };

    const [
      companiesRes,
      contentRes,
      campaignsRes,
      plansRes,
      reportsRes,
      accountsRes,
      recentActivityRes,
    ] = await Promise.all([
      auth.supabase
        .from("companies")
        .select("id, name, status, monthly_budget, industry")
        .order("created_at", { ascending: false }),
      addClientFilter(
        auth.supabase
          .from("content_calendar")
          .select("id, status, platform, scheduled_date, engagement_data")
          .gte("scheduled_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0])
      ),
      addClientFilter(
        auth.supabase
          .from("ad_campaigns")
          .select("id, name, status, platform, spent_amount, total_budget, performance_data")
      ),
      addClientFilter(
        auth.supabase
          .from("marketing_plans")
          .select("id, title, status, month")
          .gte("month", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0])
      ),
      addClientFilter(
        auth.supabase
          .from("monthly_reports")
          .select("id, status, month")
          .order("month", { ascending: false })
          .limit(3)
      ),
      addClientFilter(
        auth.supabase
          .from("social_accounts")
          .select("id, platform, followers_count, is_connected")
          .eq("is_connected", true)
      ),
      auth.supabase
        .from("ai_activity_log")
        .select("id, action_type, company_id, tokens_used, cost_estimate, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const companies = companiesRes.data || [];
    const content = contentRes.data || [];
    const campaigns = campaignsRes.data || [];
    const plans = plansRes.data || [];
    const accounts = accountsRes.data || [];

    const stats = {
      total_clients: companies.length,
      active_clients: companies.filter((c: any) => c.status === "active").length,
      total_monthly_revenue: companies.reduce((s: number, c: any) => s + (c.monthly_budget || 0), 0),
      total_posts_this_month: content.length,
      published_posts: content.filter((c: any) => c.status === "published").length,
      scheduled_posts: content.filter((c: any) => c.status === "scheduled").length,
      active_campaigns: campaigns.filter((c: any) => c.status === "active").length,
      total_ad_spend: campaigns.reduce((s: number, c: any) => s + (c.spent_amount || 0), 0),
      total_ad_budget: campaigns.reduce((s: number, c: any) => s + (c.total_budget || 0), 0),
      active_plans: plans.filter((p: any) => ["in_progress", "approved"].includes(p.status)).length,
      connected_accounts: accounts.length,
      total_followers: accounts.reduce((s: number, a: any) => s + (a.followers_count || 0), 0),
    };

    const platformBreakdown: Record<string, { posts: number; campaigns: number; accounts: number; followers: number }> = {};
    for (const c of content) {
      const p = (c as any).platform;
      if (!platformBreakdown[p]) platformBreakdown[p] = { posts: 0, campaigns: 0, accounts: 0, followers: 0 };
      platformBreakdown[p].posts++;
    }
    for (const c of campaigns) {
      const p = (c as any).platform;
      if (!platformBreakdown[p]) platformBreakdown[p] = { posts: 0, campaigns: 0, accounts: 0, followers: 0 };
      platformBreakdown[p].campaigns++;
    }
    for (const a of accounts) {
      const p = (a as any).platform;
      if (!platformBreakdown[p]) platformBreakdown[p] = { posts: 0, campaigns: 0, accounts: 0, followers: 0 };
      platformBreakdown[p].accounts++;
      platformBreakdown[p].followers += (a as any).followers_count || 0;
    }

    return NextResponse.json({
      stats,
      platform_breakdown: platformBreakdown,
      recent_activity: recentActivityRes.data || [],
      companies: clientId ? [] : companies.slice(0, 10),
    });
  } catch (error: any) {
    console.error("[dashboard] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
