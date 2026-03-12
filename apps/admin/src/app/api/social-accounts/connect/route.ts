import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getServiceKeys } from "@/lib/api-keys";

export const dynamic = "force-dynamic";

const PLATFORM_SCOPES: Record<string, string> = {
  meta: "pages_show_list,pages_read_engagement,ads_read,business_management",
  tiktok: "user.info.basic,video.list,video.publish",
  snapchat: "snapchat-marketing-api",
  twitter: "tweet.read tweet.write users.read offline.access",
  linkedin: "r_organization_social w_organization_social r_ads w_ads",
};

function buildOAuthUrl(
  platform: string,
  keys: Record<string, string>,
  redirectUri: string,
  state: string
): string | null {
  switch (platform) {
    case "meta":
      return (
        `https://www.facebook.com/v24.0/dialog/oauth` +
        `?client_id=${keys.app_id}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${PLATFORM_SCOPES.meta}` +
        `&state=${state}`
      );

    case "tiktok":
      return (
        `https://www.tiktok.com/v2/auth/authorize/` +
        `?client_key=${keys.client_key}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${PLATFORM_SCOPES.tiktok}` +
        `&response_type=code` +
        `&state=${state}`
      );

    case "snapchat":
      return (
        `https://accounts.snapchat.com/login/oauth2/authorize` +
        `?client_id=${keys.client_id}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${PLATFORM_SCOPES.snapchat}` +
        `&state=${state}`
      );

    case "twitter":
      return (
        `https://twitter.com/i/oauth2/authorize` +
        `?client_id=${keys.client_id}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(PLATFORM_SCOPES.twitter)}` +
        `&state=${state}` +
        `&code_challenge=challenge&code_challenge_method=plain`
      );

    case "linkedin":
      return (
        `https://www.linkedin.com/oauth/v2/authorization` +
        `?client_id=${keys.client_id}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(PLATFORM_SCOPES.linkedin)}` +
        `&state=${state}`
      );

    default:
      return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { company_id, platform, redirect_uri } = await request.json();

    if (!company_id || !platform) {
      return NextResponse.json(
        { error: "الحقول المطلوبة: company_id, platform" },
        { status: 400 }
      );
    }

    const keys = await getServiceKeys(platform);
    const hasCredentials =
      platform === "meta" ? !!keys.app_id : !!keys.client_id || !!keys.client_key;

    if (!hasCredentials) {
      return NextResponse.json(
        { error: `بيانات اعتماد ${platform} غير مُعدّة. أضفها من صفحة الإعدادات.` },
        { status: 400 }
      );
    }

    const host = request.headers.get("host") || "app.aqssat.co";
    const protocol = host.includes("localhost") ? "http" : "https";
    const callbackUri =
      redirect_uri || `${protocol}://${host}/api/social-accounts/callback`;

    const state = Buffer.from(
      JSON.stringify({ company_id, platform, organization_id: auth.orgId })
    ).toString("base64url");

    const oauthUrl = buildOAuthUrl(platform, keys, callbackUri, state);
    if (!oauthUrl) {
      return NextResponse.json(
        { error: `المنصة "${platform}" غير مدعومة حالياً` },
        { status: 400 }
      );
    }

    return NextResponse.json({ oauth_url: oauthUrl });
  } catch (error: any) {
    console.error("[social-accounts/connect] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
