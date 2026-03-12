import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServiceKeys } from "@/lib/api-keys";
import { exchangeCodeForTokens } from "@/lib/google-ads-api";
import { getSupabaseAdmin } from "@/lib/api-keys";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(new URL("/login", request.url));

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("[google-ads/callback] OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/settings?error=google_ads_oauth_denied`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL(`/settings?error=google_ads_no_code`, request.url)
      );
    }

    const keys = await getServiceKeys("google_ads");
    const { client_id, client_secret } = keys;

    if (!client_id || !client_secret) {
      return NextResponse.redirect(
        new URL(`/settings?error=google_ads_missing_credentials`, request.url)
      );
    }

    const host = request.headers.get("host") || "app.aqssat.co";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/google-ads/oauth/callback`;

    const tokens = await exchangeCodeForTokens(code, client_id, client_secret, redirectUri);

    if (!tokens?.refresh_token) {
      console.error("[google-ads/callback] No refresh token received");
      return NextResponse.redirect(
        new URL(`/settings?error=google_ads_no_refresh_token`, request.url)
      );
    }

    const admin = getSupabaseAdmin();

    await admin.from("api_keys").upsert(
      {
        service: "google_ads",
        key_name: "refresh_token",
        key_value: tokens.refresh_token,
        is_active: true,
        created_by: user.id,
      },
      { onConflict: "service,key_name" }
    );

    return NextResponse.redirect(
      new URL(`/settings?success=google_ads_connected`, request.url)
    );
  } catch (error: any) {
    console.error("[google-ads/callback] Error:", error);
    return NextResponse.redirect(
      new URL(`/settings?error=google_ads_callback_error`, request.url)
    );
  }
}
