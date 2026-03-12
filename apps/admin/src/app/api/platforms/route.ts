import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServiceKeys, getApiKey } from "@/lib/api-keys";
import { discoverPages } from "@/lib/meta-api";
import { validateApiKey } from "@/lib/youtube-api";
import { refreshAccessToken, discoverAccounts } from "@/lib/google-ads-api";

export const dynamic = "force-dynamic";

interface PlatformStatus {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  connected: boolean;
  accountName?: string;
  stats?: Record<string, any>;
  error?: string;
}

async function checkMeta(keys: Record<string, string>): Promise<PlatformStatus[]> {
  const platforms: PlatformStatus[] = [];
  const token = keys.access_token;

  if (!token) {
    platforms.push(
      { id: "facebook", name: "Facebook", nameAr: "فيسبوك", icon: "facebook", connected: false },
      { id: "instagram", name: "Instagram", nameAr: "إنستغرام", icon: "instagram", connected: false }
    );
    return platforms;
  }

  try {
    const pages = await discoverPages(token);

    let hasIg = false;
    let igFollowers = 0;
    let igUsername = "";

    for (const p of pages) {
      if (p.instagram) {
        hasIg = true;
        igFollowers += p.instagram.followers || 0;
        if (!igUsername) igUsername = p.instagram.username;
      }
    }

    platforms.push({
      id: "facebook",
      name: "Facebook",
      nameAr: "فيسبوك",
      icon: "facebook",
      connected: true,
      accountName: pages[0]?.name || "متصل",
      stats: {
        pages: pages.length,
        followers: pages.reduce((s, p) => s + p.followers, 0),
      },
    });

    platforms.push({
      id: "instagram",
      name: "Instagram",
      nameAr: "إنستغرام",
      icon: "instagram",
      connected: hasIg,
      accountName: igUsername ? `@${igUsername}` : undefined,
      stats: hasIg ? { followers: igFollowers } : undefined,
    });
  } catch (e: any) {
    console.error("[platforms] Meta check error:", e.message);
    platforms.push(
      { id: "facebook", name: "Facebook", nameAr: "فيسبوك", icon: "facebook", connected: false, error: e.message },
      { id: "instagram", name: "Instagram", nameAr: "إنستغرام", icon: "instagram", connected: false, error: e.message }
    );
  }

  return platforms;
}

async function checkGoogle(): Promise<PlatformStatus[]> {
  const platforms: PlatformStatus[] = [];

  const apiKey = await getApiKey("google", "api_key");
  if (apiKey) {
    try {
      const ytValid = await validateApiKey(apiKey);
      platforms.push({
        id: "youtube",
        name: "YouTube",
        nameAr: "يوتيوب",
        icon: "youtube",
        connected: ytValid,
        accountName: ytValid ? "API متصل" : undefined,
      });
    } catch (e: any) {
      platforms.push({ id: "youtube", name: "YouTube", nameAr: "يوتيوب", icon: "youtube", connected: false, error: e.message });
    }
  } else {
    platforms.push({ id: "youtube", name: "YouTube", nameAr: "يوتيوب", icon: "youtube", connected: false });
  }

  try {
    const adsKeys = await getServiceKeys("google_ads");
    const { developer_token, client_id, client_secret, refresh_token } = adsKeys;
    if (developer_token && client_id && client_secret && refresh_token) {
      const accessToken = await refreshAccessToken(client_id, client_secret, refresh_token);
      if (accessToken) {
        const mccId = adsKeys.mcc_id;
        const accounts = await discoverAccounts(developer_token, accessToken, mccId, adsKeys.managed_accounts);
        const clientAccounts = accounts.filter((a) => !a.manager);
        platforms.push({
          id: "google_ads",
          name: "Google Ads",
          nameAr: "إعلانات جوجل",
          icon: "google",
          connected: clientAccounts.length > 0,
          accountName: `${clientAccounts.length} حساب إعلاني`,
          stats: { accounts: clientAccounts.length },
        });
      } else {
        platforms.push({
          id: "google_ads",
          name: "Google Ads",
          nameAr: "إعلانات جوجل",
          icon: "google",
          connected: false,
          error: "فشل تجديد رمز الوصول",
        });
      }
    } else if (developer_token) {
      platforms.push({
        id: "google_ads",
        name: "Google Ads",
        nameAr: "إعلانات جوجل",
        icon: "google",
        connected: false,
        accountName: "Developer Token فقط — يلزم OAuth",
      });
    } else {
      platforms.push({
        id: "google_ads",
        name: "Google Ads",
        nameAr: "إعلانات جوجل",
        icon: "google",
        connected: false,
      });
    }
  } catch (e: any) {
    console.error("[platforms] Google Ads check error:", e.message);
    platforms.push({
      id: "google_ads",
      name: "Google Ads",
      nameAr: "إعلانات جوجل",
      icon: "google",
      connected: false,
      error: e.message,
    });
  }

  return platforms;
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const allPlatforms: PlatformStatus[] = [];

    let metaKeys: Record<string, string> = {};
    try { metaKeys = await getServiceKeys("meta"); } catch {}
    allPlatforms.push(...await checkMeta(metaKeys));

    try { allPlatforms.push(...await checkGoogle()); } catch {}

    allPlatforms.push(
      { id: "tiktok", name: "TikTok", nameAr: "تيك توك", icon: "tiktok", connected: false },
      { id: "x", name: "X (Twitter)", nameAr: "إكس (تويتر)", icon: "x", connected: false },
      { id: "snapchat", name: "Snapchat", nameAr: "سناب شات", icon: "snapchat", connected: false },
      { id: "linkedin", name: "LinkedIn", nameAr: "لينكدإن", icon: "linkedin", connected: false },
    );

    return NextResponse.json({
      platforms: allPlatforms,
      connectedCount: allPlatforms.filter((p) => p.connected).length,
      totalCount: allPlatforms.length,
    });
  } catch (error: any) {
    console.error("Platforms error:", error);
    return NextResponse.json({ platforms: [], connectedCount: 0, totalCount: 0, error: error.message });
  }
}
