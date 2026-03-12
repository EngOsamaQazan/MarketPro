import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServiceKeys } from "@/lib/api-keys";
import {
  refreshAccessToken,
  discoverAccounts,
  getCampaigns,
} from "@/lib/google-ads-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const keys = await getServiceKeys("google_ads");
    const { developer_token, client_id, client_secret, refresh_token } = keys;

    if (!developer_token || !client_id || !client_secret || !refresh_token) {
      return NextResponse.json({ connected: false, campaigns: [] });
    }

    const accessToken = await refreshAccessToken(client_id, client_secret, refresh_token);
    if (!accessToken) {
      return NextResponse.json({ connected: false, campaigns: [], error: "فشل تجديد رمز الوصول" });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customer_id");
    const dateRange = searchParams.get("date_range") || "LAST_30_DAYS";
    const mccId = keys.mcc_id;

    let allCampaigns: any[] = [];

    if (customerId) {
      const campaigns = await getCampaigns(customerId, developer_token, accessToken, mccId || customerId, dateRange);
      allCampaigns = campaigns.map((c) => ({
        ...c,
        platform: "google_ads",
        adAccountId: customerId,
        health: computeHealth(c),
      }));
    } else {
      const accounts = await discoverAccounts(developer_token, accessToken, mccId, keys.managed_accounts);
      const clientAccounts = accounts.filter((a) => !a.manager);

      for (const account of clientAccounts) {
        try {
          const campaigns = await getCampaigns(
            account.id,
            developer_token,
            accessToken,
            mccId || account.id,
            dateRange
          );
          allCampaigns.push(
            ...campaigns.map((c) => ({
              ...c,
              platform: "google_ads",
              adAccountId: account.id,
              adAccountName: account.descriptiveName,
              health: computeHealth(c),
            }))
          );
        } catch (e: any) {
          console.error(`[google-ads/campaigns] Error for account ${account.id}:`, e.message);
        }
      }
    }

    return NextResponse.json({
      connected: true,
      campaigns: allCampaigns,
      summary: {
        total: allCampaigns.length,
        active: allCampaigns.filter((c) => c.status === "enabled").length,
        paused: allCampaigns.filter((c) => c.status === "paused").length,
        totalClicks: allCampaigns.reduce((s, c) => s + c.metrics.clicks, 0),
        totalImpressions: allCampaigns.reduce((s, c) => s + c.metrics.impressions, 0),
        totalSpend: Math.round(allCampaigns.reduce((s, c) => s + c.metrics.cost, 0) * 100) / 100,
        totalConversions: allCampaigns.reduce((s, c) => s + c.metrics.conversions, 0),
      },
    });
  } catch (error: any) {
    console.error("[google-ads/campaigns] Error:", error);
    return NextResponse.json({ connected: false, campaigns: [], error: error.message });
  }
}

function computeHealth(campaign: any): "healthy" | "warning" | "critical" {
  const { metrics } = campaign;
  if (metrics.cost > 0 && metrics.clicks === 0) return "critical";
  if (metrics.ctr < 1 && metrics.impressions > 1000) return "warning";
  if (metrics.cost > 0 && metrics.conversions === 0 && metrics.cost > campaign.budget * 5) return "critical";
  return "healthy";
}
