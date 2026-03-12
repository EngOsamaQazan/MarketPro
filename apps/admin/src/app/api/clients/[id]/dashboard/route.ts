import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { id } = await params;

    const [
      companyRes,
      accountsRes,
      plansRes,
      contentRes,
      campaignsRes,
      reportsRes,
      invoicesRes,
    ] = await Promise.all([
      auth.supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .single(),
      auth.supabase
        .from("social_accounts")
        .select("id, platform, account_name, account_id, followers_count, is_connected, last_synced_at")
        .eq("company_id", id)
        .eq("is_connected", true),
      auth.supabase
        .from("marketing_plans")
        .select("id, title, month, status, total_budget, created_at")
        .eq("company_id", id)
        .order("month", { ascending: false })
        .limit(6),
      auth.supabase
        .from("content_calendar")
        .select("id, platform, content_type, status, scheduled_date, engagement_data, published_post_id")
        .eq("company_id", id)
        .order("scheduled_date", { ascending: false })
        .limit(30),
      auth.supabase
        .from("ad_campaigns")
        .select("id, name, platform, status, objective, daily_budget, total_budget, spent_amount, start_date, end_date, performance_data")
        .eq("company_id", id)
        .order("created_at", { ascending: false })
        .limit(10),
      auth.supabase
        .from("monthly_reports")
        .select("id, month, status, pdf_url, report_data")
        .eq("company_id", id)
        .order("month", { ascending: false })
        .limit(6),
      auth.supabase
        .from("invoices")
        .select("id, month, amount, status, due_date")
        .eq("company_id", id)
        .order("month", { ascending: false })
        .limit(6),
    ]);

    if (companyRes.error || !companyRes.data) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    const content = contentRes.data || [];
    const campaigns = campaignsRes.data || [];

    const stats = {
      total_posts: content.length,
      published_posts: content.filter((c: any) => c.status === "published").length,
      scheduled_posts: content.filter((c: any) => c.status === "scheduled").length,
      draft_posts: content.filter((c: any) => c.status === "draft").length,
      active_campaigns: campaigns.filter((c: any) => c.status === "active").length,
      total_spent: campaigns.reduce((sum: number, c: any) => sum + (c.spent_amount || 0), 0),
      total_budget: campaigns.reduce((sum: number, c: any) => sum + (c.total_budget || 0), 0),
      connected_accounts: (accountsRes.data || []).length,
      total_followers: (accountsRes.data || []).reduce(
        (sum: number, a: any) => sum + (a.followers_count || 0),
        0
      ),
    };

    return NextResponse.json({
      company: companyRes.data,
      accounts: accountsRes.data || [],
      plans: plansRes.data || [],
      content,
      campaigns,
      reports: reportsRes.data || [],
      invoices: invoicesRes.data || [],
      stats,
    });
  } catch (error: any) {
    console.error("[client-dashboard] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
