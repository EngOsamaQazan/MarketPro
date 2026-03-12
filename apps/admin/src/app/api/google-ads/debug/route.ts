import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServiceKeys } from "@/lib/api-keys";
import { refreshAccessToken, discoverAccounts } from "@/lib/google-ads-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const keys = await getServiceKeys("google_ads");
    const accessToken = await refreshAccessToken(keys.client_id, keys.client_secret, keys.refresh_token);
    if (!accessToken) return NextResponse.json({ error: "token refresh failed" });

    const accounts = await discoverAccounts(keys.developer_token, accessToken, keys.mcc_id);

    return NextResponse.json({
      mcc_id: keys.mcc_id,
      total: accounts.length,
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.descriptiveName,
        manager: a.manager,
        testAccount: a.testAccount,
        currency: a.currencyCode,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
