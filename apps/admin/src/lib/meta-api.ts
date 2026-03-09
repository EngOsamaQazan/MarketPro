const META_API = "https://graph.facebook.com/v24.0";

export async function metaGet<T = any>(endpoint: string, token: string): Promise<T | null> {
  const sep = endpoint.includes("?") ? "&" : "?";
  const res = await fetch(`${META_API}${endpoint}${sep}access_token=${token}`, { cache: "no-store" });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`[meta-api] ${endpoint} -> ${res.status}:`, errText.substring(0, 300));
    return null;
  }
  return res.json();
}

export interface MetaPage {
  id: string;
  name: string;
  category?: string;
  followers: number;
  picture?: string;
  access_token?: string;
  instagram?: {
    id: string;
    name?: string;
    username: string;
    picture?: string;
    followers: number;
  } | null;
}

export interface MetaAdAccount {
  id: string;
  name: string;
  status: number;
  currency: string;
  balance: number;
  totalSpent: number;
}

/**
 * Discovers pages accessible to the token.
 * Supports both System User tokens (via Business API) and User tokens (via /me/accounts).
 */
export async function discoverPages(token: string): Promise<MetaPage[]> {
  const fields = "id,name,category,followers_count,fan_count,picture{url},access_token,instagram_business_account{id,name,username,profile_picture_url,followers_count}";

  // Strategy 1: /me/accounts (works for both user tokens and some system user tokens)
  const directPages = await metaGet<{ data: any[] }>(`/me/accounts?fields=${fields}&limit=100`, token);
  if (directPages?.data && directPages.data.length > 0) {
    console.log(`[meta-api] Found ${directPages.data.length} pages via /me/accounts`);
    return mapPages(directPages.data);
  }

  // Check who this token belongs to
  const me = await metaGet<{ id: string; name: string }>("/me?fields=id,name", token);
  console.log("[meta-api] Token identity:", JSON.stringify(me));

  // Strategy 2: Get businesses, then get owned pages (System User flow)
  console.log("[meta-api] /me/accounts returned 0 pages, trying Business API...");
  const businesses = await metaGet<{ data: any[] }>("/me/businesses?fields=id,name&limit=10", token);
  console.log("[meta-api] /me/businesses result:", JSON.stringify(businesses?.data?.map((b: any) => ({ id: b.id, name: b.name })) || "null"));
  if (businesses?.data && businesses.data.length > 0) {
    const allPages: MetaPage[] = [];
    for (const biz of businesses.data) {
      console.log(`[meta-api] Checking business: ${biz.name} (${biz.id})`);

      // Try owned_pages
      const owned = await metaGet<{ data: any[] }>(
        `/${biz.id}/owned_pages?fields=${fields}&limit=100`, token
      );
      if (owned?.data) {
        console.log(`[meta-api] Found ${owned.data.length} owned pages in ${biz.name}`);
        allPages.push(...mapPages(owned.data));
      }

      // Try client_pages
      const client = await metaGet<{ data: any[] }>(
        `/${biz.id}/client_pages?fields=${fields}&limit=100`, token
      );
      if (client?.data) {
        console.log(`[meta-api] Found ${client.data.length} client pages in ${biz.name}`);
        allPages.push(...mapPages(client.data));
      }
    }

    // Deduplicate by page ID
    const seen = new Set<string>();
    return allPages.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }

  // Strategy 3: If we have the app_id, try direct page access
  console.log("[meta-api] No businesses found either. Token may have limited access.");
  return [];
}

/**
 * Discovers ad accounts accessible to the token.
 */
export async function discoverAdAccounts(token: string): Promise<MetaAdAccount[]> {
  // Strategy 1: Direct
  const direct = await metaGet<{ data: any[] }>(
    "/me/adaccounts?fields=id,name,account_status,currency,balance,amount_spent,business_name&limit=50",
    token
  );
  if (direct?.data && direct.data.length > 0) {
    return mapAdAccounts(direct.data);
  }

  // Strategy 2: Via businesses
  const businesses = await metaGet<{ data: any[] }>("/me/businesses?fields=id,name&limit=10", token);
  if (businesses?.data) {
    const allAccounts: MetaAdAccount[] = [];
    for (const biz of businesses.data) {
      const owned = await metaGet<{ data: any[] }>(
        `/${biz.id}/owned_ad_accounts?fields=id,name,account_status,currency,balance,amount_spent&limit=50`,
        token
      );
      if (owned?.data) allAccounts.push(...mapAdAccounts(owned.data));

      const client = await metaGet<{ data: any[] }>(
        `/${biz.id}/client_ad_accounts?fields=id,name,account_status,currency,balance,amount_spent&limit=50`,
        token
      );
      if (client?.data) allAccounts.push(...mapAdAccounts(client.data));
    }
    const seen = new Set<string>();
    return allAccounts.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
  }

  return [];
}

function mapPages(data: any[]): MetaPage[] {
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    followers: p.followers_count || p.fan_count || 0,
    picture: p.picture?.data?.url,
    access_token: p.access_token,
    instagram: p.instagram_business_account
      ? {
          id: p.instagram_business_account.id,
          name: p.instagram_business_account.name,
          username: p.instagram_business_account.username,
          picture: p.instagram_business_account.profile_picture_url,
          followers: p.instagram_business_account.followers_count || 0,
        }
      : null,
  }));
}

function mapAdAccounts(data: any[]): MetaAdAccount[] {
  return data.map((a) => ({
    id: a.id,
    name: a.name || a.business_name || a.id,
    status: a.account_status,
    currency: a.currency || "USD",
    balance: Number(a.balance || 0) / 100,
    totalSpent: Number(a.amount_spent || 0) / 100,
  }));
}
