import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServiceKeys } from "@/lib/api-keys";
import {
  refreshAccessToken,
  discoverAccounts,
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
      return NextResponse.json({
        connected: false,
        accounts: [],
        message: "بيانات اعتماد Google Ads غير مكتملة",
      });
    }

    const accessToken = await refreshAccessToken(client_id, client_secret, refresh_token);
    if (!accessToken) {
      return NextResponse.json({
        connected: false,
        accounts: [],
        error: "فشل تجديد رمز الوصول — قد تحتاج لإعادة ربط الحساب",
      });
    }

    const mccId = keys.mcc_id;
    const accounts = await discoverAccounts(developer_token, accessToken, mccId, keys.managed_accounts);

    return NextResponse.json({
      connected: true,
      accounts,
      summary: {
        total: accounts.length,
        managers: accounts.filter((a) => a.manager).length,
        clients: accounts.filter((a) => !a.manager).length,
        testAccounts: accounts.filter((a) => a.testAccount).length,
      },
    });
  } catch (error: any) {
    console.error("[google-ads/accounts] Error:", error);
    return NextResponse.json({
      connected: false,
      accounts: [],
      error: error.message,
    });
  }
}
