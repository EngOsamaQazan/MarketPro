import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServiceKeys } from "@/lib/api-keys";
import { discoverAdAccounts, metaGet } from "@/lib/meta-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const keys = await getServiceKeys("meta");
    const token = keys.access_token;
    if (!token) return NextResponse.json({ connected: false, campaigns: [] });

    const adAccounts = await discoverAdAccounts(token);
    const allCampaigns: any[] = [];

    for (const acc of adAccounts) {
      const accId = acc.id.replace("act_", "");
      const campaignsRes = await metaGet<{ data: any[] }>(
        `/act_${accId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time,created_time,updated_time,insights.date_preset(last_30d){reach,impressions,clicks,ctr,cpc,cpm,spend,frequency,actions,cost_per_action_type}&limit=100`,
        token
      );

      for (const c of campaignsRes?.data || []) {
        const ins = c.insights?.data?.[0] || {};
        const spend = Number(ins.spend || 0);
        const reach = Number(ins.reach || 0);
        const clicks = Number(ins.clicks || 0);
        const impressions = Number(ins.impressions || 0);
        const frequency = Number(ins.frequency || 0);

        const actions = ins.actions || [];
        const conversions = actions.reduce((s: number, a: any) => {
          if (["lead", "purchase", "complete_registration", "contact_total"].some((t) => a.action_type?.includes(t)))
            return s + Number(a.value || 0);
          return s;
        }, 0);

        const costPerAction = ins.cost_per_action_type || [];
        const cpa = costPerAction.find((c: any) => c.action_type === "lead" || c.action_type === "purchase");

        const dailyBudget = Number(c.daily_budget || 0) / 100;
        const totalBudget = Number(c.lifetime_budget || 0) / 100;

        let health: "healthy" | "warning" | "critical" = "healthy";
        if (frequency > 3.5) health = "warning";
        if (Number(ins.ctr || 0) < 0.5 && impressions > 1000) health = "warning";
        if (spend > 0 && conversions === 0 && spend > dailyBudget * 5) health = "critical";

        allCampaigns.push({
          id: c.id,
          name: c.name,
          status: c.status?.toLowerCase(),
          objective: c.objective,
          platform: "facebook",
          adAccountId: acc.id,
          adAccountName: acc.name,
          dailyBudget,
          totalBudget: totalBudget || dailyBudget * 30,
          budgetRemaining: Number(c.budget_remaining || 0) / 100,
          spentAmount: spend,
          startDate: c.start_time,
          endDate: c.stop_time,
          createdAt: c.created_time,
          health,
          metrics: {
            reach, impressions, clicks,
            ctr: Number(ins.ctr || 0),
            cpc: Number(ins.cpc || 0),
            cpm: Number(ins.cpm || 0),
            spend, frequency, conversions,
            cpa: cpa ? Number(cpa.value || 0) : 0,
            roas: 0,
          },
        });
      }
    }

    return NextResponse.json({
      connected: true,
      campaigns: allCampaigns,
      summary: {
        total: allCampaigns.length,
        active: allCampaigns.filter((c) => c.status === "active").length,
        paused: allCampaigns.filter((c) => c.status === "paused").length,
        totalReach: allCampaigns.reduce((s, c) => s + c.metrics.reach, 0),
        totalClicks: allCampaigns.reduce((s, c) => s + c.metrics.clicks, 0),
        totalSpend: Math.round(allCampaigns.reduce((s, c) => s + c.metrics.spend, 0) * 100) / 100,
        totalConversions: allCampaigns.reduce((s, c) => s + c.metrics.conversions, 0),
      },
    });
  } catch (error: any) {
    console.error("Meta campaigns error:", error);
    return NextResponse.json({ connected: false, campaigns: [], error: error.message });
  }
}
