import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServiceKeys } from "@/lib/api-keys";
import { discoverPages, discoverAdAccounts, metaGet } from "@/lib/meta-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const keys = await getServiceKeys("meta");
    const token = keys.access_token;
    if (!token) {
      return NextResponse.json({ connected: false });
    }

    const [pages, adAccounts] = await Promise.all([
      discoverPages(token),
      discoverAdAccounts(token),
    ]);

    let totalReach = 0, totalImpressions = 0, totalClicks = 0, totalSpend = 0;
    let totalCampaigns = 0, activeCampaigns = 0;
    const campaignsList: any[] = [];

    for (const acc of adAccounts) {
      const accId = acc.id.replace("act_", "");
      const campaignsRes = await metaGet<{ data: any[] }>(
        `/act_${accId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,insights.date_preset(last_30d){reach,impressions,clicks,ctr,cpc,spend,actions}&limit=50`,
        token
      );

      for (const c of campaignsRes?.data || []) {
        totalCampaigns++;
        if (c.status === "ACTIVE") activeCampaigns++;

        const ins = c.insights?.data?.[0] || {};
        const reach = Number(ins.reach || 0);
        const impressions = Number(ins.impressions || 0);
        const clicks = Number(ins.clicks || 0);
        const spend = Number(ins.spend || 0);

        totalReach += reach;
        totalImpressions += impressions;
        totalClicks += clicks;
        totalSpend += spend;

        campaignsList.push({
          id: c.id,
          name: c.name,
          status: c.status,
          objective: c.objective,
          metrics: { reach, impressions, clicks, ctr: Number(ins.ctr || 0), cpc: Number(ins.cpc || 0), spend },
        });
      }
    }

    const totalFollowers = pages.reduce((s, p) => s + p.followers, 0);
    const totalIgFollowers = pages.reduce((s, p) => s + (p.instagram?.followers || 0), 0);

    return NextResponse.json({
      connected: true,
      stats: {
        totalPages: pages.length,
        totalFollowers,
        totalIgFollowers,
        totalAdAccounts: adAccounts.length,
        totalCampaigns,
        activeCampaigns,
        totalReach,
        totalImpressions,
        totalClicks,
        totalSpend: Math.round(totalSpend * 100) / 100,
        avgCtr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
      },
      pages: pages.map((p) => ({
        id: p.id,
        name: p.name,
        followers: p.followers,
        picture: p.picture,
        igUsername: p.instagram?.username,
        igFollowers: p.instagram?.followers || 0,
      })),
      topCampaigns: campaignsList.sort((a, b) => b.metrics.reach - a.metrics.reach).slice(0, 5),
    });
  } catch (error: any) {
    console.error("Meta overview error:", error);
    return NextResponse.json({ connected: false, error: error.message });
  }
}
