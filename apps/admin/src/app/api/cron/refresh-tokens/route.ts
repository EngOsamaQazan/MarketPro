import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServiceKeys } from "@/lib/api-keys";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: accounts, error } = await supabase
      .from("social_accounts")
      .select("*, companies(name)")
      .eq("is_connected", true)
      .not("refresh_token", "is", null)
      .lte("token_expires_at", sevenDaysFromNow.toISOString());

    if (error) throw error;

    if (!accounts?.length) {
      return NextResponse.json({ message: "لا توجد رموز تحتاج تجديد", refreshed: 0, failed: 0 });
    }

    let refreshed = 0;
    let failed = 0;
    const details: Array<{ platform: string; company: string; status: string; error?: string }> = [];

    for (const account of accounts) {
      try {
        const result = await refreshToken(account);

        const expiresAt = result.expires_in
          ? new Date(Date.now() + result.expires_in * 1000).toISOString()
          : null;

        await supabase
          .from("social_accounts")
          .update({
            access_token: result.access_token,
            refresh_token: result.refresh_token || account.refresh_token,
            token_expires_at: expiresAt,
            last_synced_at: new Date().toISOString(),
          })
          .eq("id", account.id);

        refreshed++;
        details.push({
          platform: account.platform,
          company: account.companies?.name || account.company_id,
          status: "refreshed",
        });
      } catch (err: any) {
        failed++;
        console.error(`[refresh-tokens] Failed for ${account.platform} (${account.id}):`, err.message);

        await supabase
          .from("social_accounts")
          .update({ is_connected: false })
          .eq("id", account.id);

        await notifyManager(supabase, account, err.message);

        details.push({
          platform: account.platform,
          company: account.companies?.name || account.company_id,
          status: "failed",
          error: err.message,
        });
      }
    }

    return NextResponse.json({ success: true, refreshed, failed, details });
  } catch (error: any) {
    console.error("[refresh-tokens] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function refreshToken(account: any): Promise<TokenResponse> {
  switch (account.platform) {
    case "meta":
      return refreshMeta(account);
    case "tiktok":
      return refreshTikTok(account);
    case "linkedin":
      return refreshLinkedIn(account);
    case "twitter":
      return refreshTwitter(account);
    case "snapchat":
      return refreshSnapchat(account);
    default:
      throw new Error(`المنصة غير مدعومة: ${account.platform}`);
  }
}

async function refreshMeta(account: any): Promise<TokenResponse> {
  const keys = await getServiceKeys("meta");
  if (!keys.app_id || !keys.app_secret) {
    throw new Error("بيانات Meta API غير مكتملة");
  }

  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: keys.app_id,
    client_secret: keys.app_secret,
    fb_exchange_token: account.access_token,
  });

  const res = await fetch(
    `https://graph.facebook.com/v24.0/oauth/access_token?${params}`
  );

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
  };
}

async function refreshTikTok(account: any): Promise<TokenResponse> {
  const keys = await getServiceKeys("tiktok");
  if (!keys.client_key || !keys.client_secret) {
    throw new Error("بيانات TikTok API غير مكتملة");
  }

  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: keys.client_key,
      client_secret: keys.client_secret,
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });

  const data = await res.json();
  if (data.error || data.message === "error") {
    throw new Error(data.error_description || data.message || "TikTok refresh failed");
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

async function refreshLinkedIn(account: any): Promise<TokenResponse> {
  const keys = await getServiceKeys("linkedin");
  if (!keys.client_id || !keys.client_secret) {
    throw new Error("بيانات LinkedIn API غير مكتملة");
  }

  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
      client_id: keys.client_id,
      client_secret: keys.client_secret,
    }),
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

async function refreshTwitter(account: any): Promise<TokenResponse> {
  const keys = await getServiceKeys("twitter");
  if (!keys.client_id || !keys.client_secret) {
    throw new Error("بيانات Twitter API غير مكتملة");
  }

  const credentials = Buffer.from(`${keys.client_id}:${keys.client_secret}`).toString("base64");

  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

async function refreshSnapchat(account: any): Promise<TokenResponse> {
  const keys = await getServiceKeys("snapchat");
  if (!keys.client_id || !keys.client_secret) {
    throw new Error("بيانات Snapchat API غير مكتملة");
  }

  const res = await fetch("https://accounts.snapchat.com/login/oauth2/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
      client_id: keys.client_id,
      client_secret: keys.client_secret,
    }),
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

async function notifyManager(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  account: any,
  errorMessage: string
) {
  const { data: managers } = await supabase
    .from("profiles")
    .select("id")
    .eq("company_id", account.company_id)
    .in("role", ["admin", "manager"]);

  if (!managers?.length) return;

  const platformNames: Record<string, string> = {
    meta: "ميتا (فيسبوك/إنستغرام)",
    tiktok: "تيك توك",
    linkedin: "لينكد إن",
    twitter: "تويتر (X)",
    snapchat: "سناب شات",
  };

  const rows = managers.map((m: any) => ({
    user_id: m.id,
    company_id: account.company_id,
    type: "token_refresh_failed",
    title: "فشل تجديد رمز الوصول",
    body: `فشل تجديد رمز ${platformNames[account.platform] || account.platform} لـ${account.companies?.name || "الشركة"}. يرجى إعادة ربط الحساب.`,
    data: { account_id: account.id, platform: account.platform, error: errorMessage },
    action_url: `/settings?tab=platforms&company=${account.company_id}`,
  }));

  await supabase.from("notifications").insert(rows);
}
