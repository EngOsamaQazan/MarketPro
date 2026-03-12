import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireOrgAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const [orgRes, plansRes, usageRes] = await Promise.all([
      auth.supabase
        .from("organizations")
        .select("id, name, plan, plan_expires_at, limits")
        .eq("id", auth.orgId)
        .single(),
      auth.supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order"),
      auth.supabase
        .from("usage_logs")
        .select("metric, count")
        .eq("organization_id", auth.orgId)
        .eq("period", new Date().toISOString().slice(0, 7)),
    ]);

    const currentUsage: Record<string, number> = {};
    for (const u of usageRes.data || []) {
      currentUsage[u.metric] = (currentUsage[u.metric] || 0) + u.count;
    }

    const { count: clientCount } = await auth.supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", auth.orgId);

    const { count: memberCount } = await auth.supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", auth.orgId);

    return NextResponse.json({
      organization: orgRes.data,
      plans: plansRes.data || [],
      usage: {
        clients: clientCount || 0,
        posts_this_month: currentUsage.posts || 0,
        campaigns: currentUsage.campaigns || 0,
        ai_credits: currentUsage.ai_credits || 0,
        team_members: memberCount || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireOrgAdmin();
    if (auth.error) return auth.error;

    const { plan_id } = await req.json();

    if (!plan_id) {
      return NextResponse.json({ error: "معرف الباقة مطلوب" }, { status: 400 });
    }

    const { data: plan } = await auth.supabase
      .from("subscription_plans")
      .select("id, limits")
      .eq("id", plan_id)
      .single();

    if (!plan) {
      return NextResponse.json({ error: "الباقة غير موجودة" }, { status: 404 });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { error } = await auth.supabase
      .from("organizations")
      .update({
        plan: plan_id,
        limits: plan.limits,
        plan_expires_at: expiresAt.toISOString(),
      })
      .eq("id", auth.orgId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "تم تحديث الاشتراك بنجاح" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
