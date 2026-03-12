import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServiceKeys } from "@/lib/api-keys";

export const dynamic = "force-dynamic";

const META_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "ads_read",
  "business_management",
].join(",");

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const keys = await getServiceKeys("meta");
    const appId = keys.app_id;

    if (!appId) {
      return NextResponse.json(
        { error: "يرجى إضافة App ID أولاً من صفحة الإعدادات" },
        { status: 400 }
      );
    }

    const host = request.headers.get("host") || "app.aqssat.co";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/meta/oauth/callback`;

    const authUrl =
      `https://www.facebook.com/v24.0/dialog/oauth` +
      `?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${META_SCOPES}` +
      `&response_type=code` +
      `&state=${user.id}`;

    return NextResponse.json({ authUrl, redirectUri });
  } catch (error: any) {
    console.error("[meta/oauth] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
