import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServiceKeys } from "@/lib/api-keys";
import { getOAuthUrl } from "@/lib/google-ads-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const keys = await getServiceKeys("google_ads");
    const clientId = keys.client_id;

    if (!clientId) {
      return NextResponse.json(
        { error: "يرجى إضافة OAuth Client ID أولاً من صفحة الإعدادات" },
        { status: 400 }
      );
    }

    const host = request.headers.get("host") || "app.aqssat.co";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/google-ads/oauth/callback`;

    const authUrl = getOAuthUrl(clientId, redirectUri, user.id);

    return NextResponse.json({ authUrl, redirectUri });
  } catch (error: any) {
    console.error("[google-ads/oauth] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
