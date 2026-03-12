import { NextRequest, NextResponse } from "next/server";
import { getServiceKeys, getSupabaseAdmin } from "@/lib/api-keys";

export const dynamic = "force-dynamic";

interface OAuthState {
  company_id: string;
  platform: string;
  organization_id?: string;
}

function parseState(raw: string): OAuthState | null {
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString());
  } catch {
    return null;
  }
}

async function exchangeMetaToken(
  code: string,
  keys: Record<string, string>,
  redirectUri: string
) {
  const tokenRes = await fetch(
    `https://graph.facebook.com/v24.0/oauth/access_token` +
      `?client_id=${keys.app_id}` +
      `&client_secret=${keys.app_secret}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${code}`
  );
  if (!tokenRes.ok) {
    const err = await tokenRes.json();
    throw new Error(err.error?.message || "فشل تبادل رمز Meta");
  }
  const { access_token } = await tokenRes.json();

  const longLivedRes = await fetch(
    `https://graph.facebook.com/v24.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${keys.app_id}` +
      `&client_secret=${keys.app_secret}` +
      `&fb_exchange_token=${access_token}`
  );
  if (!longLivedRes.ok) {
    const err = await longLivedRes.json();
    throw new Error(err.error?.message || "فشل الحصول على رمز طويل الأمد");
  }
  const longLived = await longLivedRes.json();

  const pagesRes = await fetch(
    `https://graph.facebook.com/v24.0/me/accounts?access_token=${longLived.access_token}`
  );
  if (!pagesRes.ok) {
    const err = await pagesRes.json();
    throw new Error(err.error?.message || "فشل جلب الصفحات");
  }
  const { data: pages } = await pagesRes.json();

  return {
    user_token: longLived.access_token,
    expires_in: longLived.expires_in,
    pages: (pages || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      access_token: p.access_token,
      category: p.category,
    })),
  };
}

async function exchangeTikTokToken(
  code: string,
  keys: Record<string, string>,
  redirectUri: string
) {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: keys.client_key,
      client_secret: keys.client_secret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || "فشل تبادل رمز TikTok");
  return data;
}

async function exchangeSnapchatToken(
  code: string,
  keys: Record<string, string>,
  redirectUri: string
) {
  const res = await fetch("https://accounts.snapchat.com/login/oauth2/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: keys.client_id,
      client_secret: keys.client_secret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || "فشل تبادل رمز Snapchat");
  return data;
}

async function exchangeTwitterToken(
  code: string,
  keys: Record<string, string>,
  redirectUri: string
) {
  const basicAuth = Buffer.from(`${keys.client_id}:${keys.client_secret}`).toString("base64");
  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: "challenge",
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || "فشل تبادل رمز Twitter");
  return data;
}

async function exchangeLinkedInToken(
  code: string,
  keys: Record<string, string>,
  redirectUri: string
) {
  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: keys.client_id,
      client_secret: keys.client_secret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || "فشل تبادل رمز LinkedIn");
  return data;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    console.error("[social-accounts/callback] OAuth error:", errorParam);
    return NextResponse.redirect(new URL("/clients?error=oauth_denied", request.url));
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(new URL("/clients?error=missing_params", request.url));
  }

  const state = parseState(stateRaw);
  if (!state?.company_id || !state?.platform) {
    return NextResponse.redirect(new URL("/clients?error=invalid_state", request.url));
  }

  const { company_id, platform, organization_id } = state;

  try {
    const keys = await getServiceKeys(platform);
    const admin = getSupabaseAdmin();

    const host = request.headers.get("host") || "app.aqssat.co";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/social-accounts/callback`;

    if (platform === "meta") {
      const meta = await exchangeMetaToken(code, keys, redirectUri);
      const expiresAt = meta.expires_in
        ? new Date(Date.now() + meta.expires_in * 1000).toISOString()
        : null;

      if (meta.pages.length > 0) {
        const rows = meta.pages.map((page: any) => ({
          company_id,
          platform: "meta",
          account_id: page.id,
          account_name: page.name,
          access_token: page.access_token,
          refresh_token: meta.user_token,
          token_expires_at: expiresAt,
          permissions: ["pages_show_list", "pages_read_engagement", "pages_read_user_content", "pages_manage_metadata", "ads_read", "business_management"],
          is_connected: true,
          last_synced_at: new Date().toISOString(),
          organization_id: organization_id || null,
        }));

        const { error } = await admin
          .from("social_accounts")
          .upsert(rows, { onConflict: "company_id,platform,account_id" });

        if (error) throw error;
      } else {
        const { error } = await admin.from("social_accounts").upsert(
          {
            company_id,
            platform: "meta",
            account_id: "user",
            account_name: "Meta User Account",
            access_token: meta.user_token,
            token_expires_at: expiresAt,
            is_connected: true,
            last_synced_at: new Date().toISOString(),
            organization_id: organization_id || null,
          },
          { onConflict: "company_id,platform,account_id" }
        );
        if (error) throw error;
      }
    } else {
      let tokenData: any;

      switch (platform) {
        case "tiktok":
          tokenData = await exchangeTikTokToken(code, keys, redirectUri);
          break;
        case "snapchat":
          tokenData = await exchangeSnapchatToken(code, keys, redirectUri);
          break;
        case "twitter":
          tokenData = await exchangeTwitterToken(code, keys, redirectUri);
          break;
        case "linkedin":
          tokenData = await exchangeLinkedInToken(code, keys, redirectUri);
          break;
        default:
          return NextResponse.redirect(
            new URL(`/dashboard/clients/${company_id}?error=unsupported_platform`, request.url)
          );
      }

      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

      const { error } = await admin.from("social_accounts").upsert(
        {
          company_id,
          platform,
          account_id: tokenData.open_id || tokenData.sub || "primary",
          account_name: tokenData.display_name || tokenData.name || platform,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          token_expires_at: expiresAt,
          is_connected: true,
          last_synced_at: new Date().toISOString(),
          organization_id: organization_id || null,
        },
        { onConflict: "company_id,platform,account_id" }
      );

      if (error) throw error;
    }

    return NextResponse.redirect(
      new URL(`/dashboard/clients/${company_id}?connected=true`, request.url)
    );
  } catch (error: any) {
    console.error(`[social-accounts/callback] ${platform} error:`, error);
    return NextResponse.redirect(
      new URL(`/dashboard/clients/${company_id}?error=callback_failed`, request.url)
    );
  }
}
