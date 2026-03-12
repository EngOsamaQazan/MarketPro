import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServiceKeys } from "@/lib/api-keys";
import {
  refreshAccessToken,
  discoverAccounts,
  getOverview,
  type GoogleAdsOverview,
} from "@/lib/google-ads-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const keys = await getServiceKeys("google_ads");
    const { developer_token, client_id, client_secret, refresh_token } = keys;

    if (!developer_token || !client_id || !client_secret || !refresh_token) {
      return NextResponse.json({ connected: false });
    }

    const accessToken = await refreshAccessToken(client_id, client_secret, refresh_token);
    if (!accessToken) {
      return NextResponse.json({ connected: false, error: "فشل تجديد رمز الوصول" });
    }

    const mccId = keys.mcc_id;
    const accounts = await discoverAccounts(developer_token, accessToken, mccId, keys.managed_accounts);
    const clientAccounts = accounts.filter((a) => !a.manager);

    const aggregated: GoogleAdsOverview = {
      totalCampaigns: 0,
      activeCampaigns: 0,
      pausedCampaigns: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalCost: 0,
      totalConversions: 0,
      avgCtr: 0,
      avgCpc: 0,
    };

    for (const account of clientAccounts) {
      try {
        const overview = await getOverview(account.id, developer_token, accessToken, mccId || account.id);
        aggregated.totalCampaigns += overview.totalCampaigns;
        aggregated.activeCampaigns += overview.activeCampaigns;
        aggregated.pausedCampaigns += overview.pausedCampaigns;
        aggregated.totalImpressions += overview.totalImpressions;
        aggregated.totalClicks += overview.totalClicks;
        aggregated.totalCost += overview.totalCost;
        aggregated.totalConversions += overview.totalConversions;
      } catch (e: any) {
        console.error(`[google-ads/overview] Error for account ${account.id}:`, e.message);
      }
    }

    aggregated.totalCost = Math.round(aggregated.totalCost * 100) / 100;
    aggregated.avgCtr = aggregated.totalImpressions > 0
      ? Math.round((aggregated.totalClicks / aggregated.totalImpressions) * 10000) / 100
      : 0;
    aggregated.avgCpc = aggregated.totalClicks > 0
      ? Math.round((aggregated.totalCost / aggregated.totalClicks) * 100) / 100
      : 0;

    return NextResponse.json({
      connected: true,
      stats: aggregated,
      accounts: clientAccounts.map((a) => ({
        id: a.id,
        name: a.descriptiveName,
        currency: a.currencyCode,
        testAccount: a.testAccount,
      })),
      totalAccounts: clientAccounts.length,
    });
  } catch (error: any) {
    console.error("[google-ads/overview] Error:", error);
    return NextResponse.json({ connected: false, error: error.message });
  }
}
