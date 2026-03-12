const GOOGLE_ADS_API = "https://googleads.googleapis.com/v23";
const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_ADS_SCOPE = "https://www.googleapis.com/auth/adwords";

export interface GoogleAdsAccount {
  id: string;
  descriptiveName: string;
  currencyCode: string;
  timeZone: string;
  manager: boolean;
  testAccount: boolean;
  status: string;
}

export interface GoogleAdsCampaign {
  id: string;
  name: string;
  status: string;
  type: string;
  biddingStrategy: string;
  budget: number;
  budgetType: string;
  startDate?: string;
  endDate?: string;
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    averageCpc: number;
    averageCpm: number;
    cost: number;
    conversions: number;
    costPerConversion: number;
    conversionsValue: number;
  };
}

export interface GoogleAdsOverview {
  totalCampaigns: number;
  activeCampaigns: number;
  pausedCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  totalCost: number;
  totalConversions: number;
  avgCtr: number;
  avgCpc: number;
}

export function getOAuthUrl(clientId: string, redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_ADS_SCOPE,
    access_type: "offline",
    prompt: "consent",
    ...(state ? { state } : {}),
  });
  return `${GOOGLE_OAUTH_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    console.error("[google-ads] Token exchange failed:", res.status, err.substring(0, 300));
    return null;
  }

  return res.json();
}

export async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string | null> {
  const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    console.error("[google-ads] Token refresh failed:", res.status, err.substring(0, 300));
    return null;
  }

  const data = await res.json();
  return data.access_token || null;
}

async function googleAdsRequest(
  endpoint: string,
  developerToken: string,
  accessToken: string,
  options: {
    method?: string;
    body?: any;
    loginCustomerId?: string;
  } = {}
): Promise<any> {
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${accessToken}`,
    "developer-token": developerToken,
    "Content-Type": "application/json",
  };

  if (options.loginCustomerId) {
    headers["login-customer-id"] = options.loginCustomerId.replace(/-/g, "");
  }

  const res = await fetch(`${GOOGLE_ADS_API}${endpoint}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`[google-ads] ${endpoint} -> ${res.status}:`, errText.substring(0, 500));
    return null;
  }

  return res.json();
}

export async function listAccessibleCustomers(
  developerToken: string,
  accessToken: string
): Promise<string[]> {
  const data = await googleAdsRequest(
    "/customers:listAccessibleCustomers",
    developerToken,
    accessToken
  );
  return data?.resourceNames?.map((rn: string) => rn.replace("customers/", "")) || [];
}

export async function getCustomerDetails(
  customerId: string,
  developerToken: string,
  accessToken: string,
  loginCustomerId?: string
): Promise<GoogleAdsAccount | null> {
  const cleanId = customerId.replace(/-/g, "");
  const data = await googleAdsRequest(
    `/customers/${cleanId}`,
    developerToken,
    accessToken,
    { loginCustomerId }
  );

  if (!data) return null;

  return {
    id: data.id || cleanId,
    descriptiveName: data.descriptiveName || "",
    currencyCode: data.currencyCode || "USD",
    timeZone: data.timeZone || "",
    manager: data.manager || false,
    testAccount: data.testAccount || false,
    status: data.status || "UNKNOWN",
  };
}

export async function searchQuery(
  customerId: string,
  query: string,
  developerToken: string,
  accessToken: string,
  loginCustomerId?: string
): Promise<any[]> {
  const cleanId = customerId.replace(/-/g, "");

  // Try search (paginated) first — more reliable than searchStream
  const data = await googleAdsRequest(
    `/customers/${cleanId}/googleAds:search`,
    developerToken,
    accessToken,
    {
      method: "POST",
      body: { query, pageSize: 1000 },
      loginCustomerId,
    }
  );

  if (!data) return [];

  if (Array.isArray(data)) {
    return data.flatMap((batch: any) => batch.results || []);
  }

  return data.results || [];
}

export async function discoverMccClients(
  mccId: string,
  developerToken: string,
  accessToken: string
): Promise<GoogleAdsAccount[]> {
  const query = `
    SELECT
      customer_client.id,
      customer_client.descriptive_name,
      customer_client.currency_code,
      customer_client.time_zone,
      customer_client.manager,
      customer_client.test_account,
      customer_client.status,
      customer_client.level
    FROM customer_client
    WHERE customer_client.level = 1
      AND customer_client.manager = false
  `;

  const results = await searchQuery(mccId, query, developerToken, accessToken, mccId);

  return results.map((row: any) => {
    const c = row.customerClient || {};
    return {
      id: String(c.id || ""),
      descriptiveName: c.descriptiveName || `حساب ${c.id}`,
      currencyCode: c.currencyCode || "USD",
      timeZone: c.timeZone || "",
      manager: false,
      testAccount: c.testAccount || false,
      status: c.status || "ENABLED",
    };
  });
}

async function getAccountName(
  customerId: string,
  developerToken: string,
  accessToken: string,
  loginCustomerId?: string
): Promise<{ name: string; manager: boolean; testAccount: boolean; currency: string } | null> {
  const query = `SELECT customer.descriptive_name, customer.manager, customer.test_account, customer.currency_code FROM customer LIMIT 1`;
  const results = await searchQuery(customerId, query, developerToken, accessToken, loginCustomerId);
  if (results.length === 0) return null;
  const c = results[0].customer || {};
  return {
    name: c.descriptiveName || "",
    manager: c.manager || false,
    testAccount: c.testAccount || false,
    currency: c.currencyCode || "USD",
  };
}

export async function discoverAccounts(
  developerToken: string,
  accessToken: string,
  loginCustomerId?: string,
  managedAccountsJson?: string
): Promise<GoogleAdsAccount[]> {
  // Priority 1: Use stored managed accounts from database
  if (managedAccountsJson) {
    try {
      const managed = JSON.parse(managedAccountsJson) as { id: string; name: string }[];
      if (managed.length > 0) {
        return managed.map((a) => ({
          id: a.id,
          descriptiveName: a.name,
          currencyCode: "USD",
          timeZone: "",
          manager: false,
          testAccount: false,
          status: "ENABLED",
        }));
      }
    } catch { /* invalid JSON, fall through */ }
  }

  // Priority 2: Try MCC client discovery via GAQL
  if (loginCustomerId) {
    const mccClients = await discoverMccClients(loginCustomerId, developerToken, accessToken);
    if (mccClients.length > 0) return mccClients;
  }

  // Priority 3: Fallback to listAccessibleCustomers
  const customerIds = await listAccessibleCustomers(developerToken, accessToken);
  if (customerIds.length === 0) return [];

  const mccId = loginCustomerId?.replace(/-/g, "");
  return customerIds
    .filter((id) => id !== mccId)
    .map((id) => ({
      id,
      descriptiveName: `حساب ${id}`,
      currencyCode: "USD",
      timeZone: "",
      manager: false,
      testAccount: false,
      status: "UNKNOWN",
    }));
}

export async function getCampaigns(
  customerId: string,
  developerToken: string,
  accessToken: string,
  loginCustomerId?: string,
  dateRange = "LAST_30_DAYS"
): Promise<GoogleAdsCampaign[]> {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign.bidding_strategy_type,
      campaign.start_date,
      campaign.end_date,
      campaign_budget.amount_micros,
      campaign_budget.type,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.average_cpm,
      metrics.cost_micros,
      metrics.conversions,
      metrics.cost_per_conversion,
      metrics.conversions_value
    FROM campaign
    WHERE segments.date DURING ${dateRange}
    ORDER BY metrics.cost_micros DESC
    LIMIT 100
  `;

  const results = await searchQuery(customerId, query, developerToken, accessToken, loginCustomerId);

  return results.map((row: any) => {
    const c = row.campaign || {};
    const b = row.campaignBudget || {};
    const m = row.metrics || {};

    return {
      id: c.id || "",
      name: c.name || "",
      status: (c.status || "UNKNOWN").toLowerCase(),
      type: c.advertisingChannelType || "",
      biddingStrategy: c.biddingStrategyType || "",
      budget: Number(b.amountMicros || 0) / 1_000_000,
      budgetType: b.type || "DAILY",
      startDate: c.startDate,
      endDate: c.endDate,
      metrics: {
        impressions: Number(m.impressions || 0),
        clicks: Number(m.clicks || 0),
        ctr: Number(m.ctr || 0) * 100,
        averageCpc: Number(m.averageCpc || 0) / 1_000_000,
        averageCpm: Number(m.averageCpm || 0) / 1_000_000,
        cost: Number(m.costMicros || 0) / 1_000_000,
        conversions: Number(m.conversions || 0),
        costPerConversion: Number(m.costPerConversion || 0) / 1_000_000,
        conversionsValue: Number(m.conversionsValue || 0),
      },
    };
  });
}

export async function getOverview(
  customerId: string,
  developerToken: string,
  accessToken: string,
  loginCustomerId?: string,
  dateRange = "LAST_30_DAYS"
): Promise<GoogleAdsOverview> {
  const query = `
    SELECT
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.cost_micros,
      metrics.conversions
    FROM campaign
    WHERE segments.date DURING ${dateRange}
  `;

  const results = await searchQuery(customerId, query, developerToken, accessToken, loginCustomerId);

  let totalCampaigns = 0;
  let activeCampaigns = 0;
  let pausedCampaigns = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalCost = 0;
  let totalConversions = 0;

  const seen = new Set<string>();
  for (const row of results) {
    const c = row.campaign || {};
    const m = row.metrics || {};

    if (!seen.has(c.id)) {
      seen.add(c.id);
      totalCampaigns++;
      if (c.status === "ENABLED") activeCampaigns++;
      else if (c.status === "PAUSED") pausedCampaigns++;
    }

    totalImpressions += Number(m.impressions || 0);
    totalClicks += Number(m.clicks || 0);
    totalCost += Number(m.costMicros || 0) / 1_000_000;
    totalConversions += Number(m.conversions || 0);
  }

  return {
    totalCampaigns,
    activeCampaigns,
    pausedCampaigns,
    totalImpressions,
    totalClicks,
    totalCost: Math.round(totalCost * 100) / 100,
    totalConversions,
    avgCtr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
    avgCpc: totalClicks > 0 ? Math.round((totalCost / totalClicks) * 100) / 100 : 0,
  };
}

export async function validateConnection(
  developerToken: string,
  accessToken: string
): Promise<boolean> {
  const customers = await listAccessibleCustomers(developerToken, accessToken);
  return customers.length > 0;
}
