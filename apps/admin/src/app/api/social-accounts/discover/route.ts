import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getServiceKeys, getSupabaseAdmin } from "@/lib/api-keys";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const keys = await getServiceKeys("meta");
    const token = keys.access_token;

    if (!token) {
      return NextResponse.json(
        { error: "لم يتم ربط حساب Meta بعد. اربط حسابك أولاً من صفحة الإعدادات." },
        { status: 400 }
      );
    }

    const pages: any[] = [];
    const adAccounts: any[] = [];
    const seenPageIds = new Set<string>();
    const seenAdIds = new Set<string>();

    const pagesRes = await fetch(
      `https://graph.facebook.com/v24.0/me/accounts?fields=id,name,category,fan_count,picture&limit=100&access_token=${token}`
    );
    if (pagesRes.ok) {
      const { data } = await pagesRes.json();
      for (const p of data || []) {
        if (!seenPageIds.has(p.id)) {
          seenPageIds.add(p.id);
          pages.push({
            id: p.id,
            name: p.name,
            category: p.category,
            followers: p.fan_count || 0,
            picture: p.picture?.data?.url,
          });
        }
      }
    }

    const bizRes = await fetch(
      `https://graph.facebook.com/v24.0/me/businesses?fields=id,name&access_token=${token}`
    );
    if (bizRes.ok) {
      const { data: businesses } = await bizRes.json();
      for (const biz of businesses || []) {
        for (const edge of ["owned_pages", "client_pages"]) {
          const bpRes = await fetch(
            `https://graph.facebook.com/v24.0/${biz.id}/${edge}?fields=id,name,category,fan_count,picture&limit=100&access_token=${token}`
          );
          if (bpRes.ok) {
            const { data: bpPages } = await bpRes.json();
            for (const p of bpPages || []) {
              if (!seenPageIds.has(p.id)) {
                seenPageIds.add(p.id);
                pages.push({
                  id: p.id,
                  name: p.name,
                  category: p.category,
                  followers: p.fan_count || 0,
                  picture: p.picture?.data?.url,
                  business: biz.name,
                });
              }
            }
          }
        }

        for (const edge of ["owned_ad_accounts", "client_ad_accounts"]) {
          const aaRes = await fetch(
            `https://graph.facebook.com/v24.0/${biz.id}/${edge}?fields=id,name,account_status,currency,balance&limit=100&access_token=${token}`
          );
          if (aaRes.ok) {
            const { data: accounts } = await aaRes.json();
            for (const a of accounts || []) {
              if (!seenAdIds.has(a.id)) {
                seenAdIds.add(a.id);
                adAccounts.push({
                  id: a.id,
                  name: a.name,
                  status: a.account_status,
                  currency: a.currency,
                  business: biz.name,
                });
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ pages, ad_accounts: adAccounts });
  } catch (error: any) {
    console.error("[social-accounts/discover] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { company_id, selected_pages, selected_ad_accounts } = await request.json();

    if (!company_id) {
      return NextResponse.json({ error: "معرف العميل مطلوب" }, { status: 400 });
    }

    const keys = await getServiceKeys("meta");
    const token = keys.access_token;

    if (!token) {
      return NextResponse.json({ error: "لم يتم ربط حساب Meta" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const rows: any[] = [];

    if (selected_pages?.length) {
      for (const page of selected_pages) {
        let pageToken = token;
        try {
          const ptRes = await fetch(
            `https://graph.facebook.com/v24.0/${page.id}?fields=access_token&access_token=${token}`
          );
          if (ptRes.ok) {
            const ptData = await ptRes.json();
            if (ptData.access_token) pageToken = ptData.access_token;
          }
        } catch {}

        rows.push({
          company_id,
          platform: "meta",
          account_id: page.id,
          account_name: page.name,
          access_token: pageToken,
          refresh_token: token,
          is_connected: true,
          followers_count: page.followers || 0,
          last_synced_at: new Date().toISOString(),
          organization_id: auth.orgId,
        });
      }
    }

    if (selected_ad_accounts?.length) {
      for (const ad of selected_ad_accounts) {
        rows.push({
          company_id,
          platform: "meta",
          account_id: ad.id,
          account_name: ad.name || `Ad Account ${ad.id}`,
          access_token: token,
          is_connected: true,
          last_synced_at: new Date().toISOString(),
          organization_id: auth.orgId,
        });
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "لم يتم اختيار أي حساب" }, { status: 400 });
    }

    const { error } = await admin
      .from("social_accounts")
      .upsert(rows, { onConflict: "company_id,platform,account_id" });

    if (error) throw error;

    return NextResponse.json({ success: true, count: rows.length });
  } catch (error: any) {
    console.error("[social-accounts/discover] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
