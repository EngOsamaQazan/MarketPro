import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServiceKeys, getSupabaseAdmin } from "@/lib/api-keys";

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
      console.error("[meta/oauth/callback] OAuth error:", error);
      return NextResponse.redirect(
        new URL("/settings?error=meta_oauth_denied", request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/settings?error=meta_no_code", request.url)
      );
    }

    const keys = await getServiceKeys("meta");
    const { app_id, app_secret } = keys;

    if (!app_id || !app_secret) {
      return NextResponse.redirect(
        new URL("/settings?error=meta_missing_credentials", request.url)
      );
    }

    const host = request.headers.get("host") || "app.aqssat.co";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/meta/oauth/callback`;

    // Step 1: Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v24.0/oauth/access_token` +
        `?client_id=${app_id}` +
        `&client_secret=${app_secret}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&code=${code}`
    );

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      console.error("[meta/oauth/callback] Token exchange failed:", err);
      return NextResponse.redirect(
        new URL("/settings?error=meta_token_exchange_failed", request.url)
      );
    }

    const { access_token: shortLivedToken } = await tokenRes.json();

    // Step 2: Exchange for long-lived token (60 days)
    const longLivedRes = await fetch(
      `https://graph.facebook.com/v24.0/oauth/access_token` +
        `?grant_type=fb_exchange_token` +
        `&client_id=${app_id}` +
        `&client_secret=${app_secret}` +
        `&fb_exchange_token=${shortLivedToken}`
    );

    if (!longLivedRes.ok) {
      const err = await longLivedRes.json().catch(() => ({}));
      console.error("[meta/oauth/callback] Long-lived token failed:", err);
      return NextResponse.redirect(
        new URL("/settings?error=meta_long_lived_failed", request.url)
      );
    }

    const longLived = await longLivedRes.json();
    const longLivedToken = longLived.access_token;
    const expiresIn = longLived.expires_in || 5184000; // 60 days default

    // Step 3: Get user info to confirm identity
    const meRes = await fetch(
      `https://graph.facebook.com/v24.0/me?fields=id,name&access_token=${longLivedToken}`
    );
    const meData = meRes.ok ? await meRes.json() : { id: "unknown", name: "Facebook User" };

    // Step 4: Discover all pages and businesses
    const pagesRes = await fetch(
      `https://graph.facebook.com/v24.0/me/accounts?fields=id,name,category,followers_count,access_token,instagram_business_account{id,username,followers_count}&limit=100&access_token=${longLivedToken}`
    );
    const pagesData = pagesRes.ok ? await pagesRes.json() : { data: [] };

    const businessesRes = await fetch(
      `https://graph.facebook.com/v24.0/me/businesses?fields=id,name&limit=50&access_token=${longLivedToken}`
    );
    const businessesData = businessesRes.ok ? await businessesRes.json() : { data: [] };

    const adAccountsRes = await fetch(
      `https://graph.facebook.com/v24.0/me/adaccounts?fields=id,name,account_status,currency&limit=50&access_token=${longLivedToken}`
    );
    const adAccountsData = adAccountsRes.ok ? await adAccountsRes.json() : { data: [] };

    // Step 5: Save long-lived token as the system access_token in api_keys
    const admin = getSupabaseAdmin();

    await admin.from("api_keys").upsert(
      {
        service: "meta",
        key_name: "access_token",
        key_value: longLivedToken,
        is_active: true,
        created_by: user.id,
      },
      { onConflict: "service,key_name" }
    );

    // Save token expiry info
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    await admin.from("api_keys").upsert(
      {
        service: "meta",
        key_name: "token_expires_at",
        key_value: expiresAt,
        is_active: true,
        created_by: user.id,
      },
      { onConflict: "service,key_name" }
    );

    // Save connected user name
    await admin.from("api_keys").upsert(
      {
        service: "meta",
        key_name: "connected_user",
        key_value: JSON.stringify({
          id: meData.id,
          name: meData.name,
          pages: pagesData.data?.length || 0,
          businesses: businessesData.data?.length || 0,
          ad_accounts: adAccountsData.data?.length || 0,
          connected_at: new Date().toISOString(),
        }),
        is_active: true,
        created_by: user.id,
      },
      { onConflict: "service,key_name" }
    );

    console.log(
      `[meta/oauth/callback] Connected as ${meData.name} (${meData.id}): ` +
        `${pagesData.data?.length || 0} pages, ` +
        `${businessesData.data?.length || 0} businesses, ` +
        `${adAccountsData.data?.length || 0} ad accounts`
    );

    return NextResponse.redirect(
      new URL("/settings?success=meta_connected", request.url)
    );
  } catch (error: any) {
    console.error("[meta/oauth/callback] Error:", error);
    return NextResponse.redirect(
      new URL("/settings?error=meta_callback_error", request.url)
    );
  }
}
