import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { checkUsageLimit, logUsage } from "@/lib/usage-limits";
import { getApiKey } from "@/lib/api-keys";
import { MetaClient } from "@satwa/social";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const limit = await checkUsageLimit(auth, "campaigns");
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `تجاوزت حد الحملات في باقتك (${limit.limit})`, limit: limit.limit },
        { status: 403 }
      );
    }

    const {
      company_id,
      name,
      objective,
      daily_budget,
      total_budget,
      start_date,
      end_date,
      targeting,
    } = await req.json();

    if (!company_id || !name || !objective || !daily_budget || !start_date) {
      return NextResponse.json(
        { error: "الحقول المطلوبة: company_id, name, objective, daily_budget, start_date" },
        { status: 400 }
      );
    }

    const { data: socialAccount, error: saError } = await auth.supabase
      .from("social_accounts")
      .select("*")
      .eq("company_id", company_id)
      .eq("is_connected", true)
      .in("platform", ["facebook", "meta"])
      .single();

    if (saError || !socialAccount) {
      return NextResponse.json(
        { error: "لم يتم العثور على حساب Meta متصل لهذه الشركة" },
        { status: 404 }
      );
    }

    const adAccountId = await getApiKey("meta", "ad_account_id");
    if (!adAccountId) {
      return NextResponse.json(
        { error: "لم يتم العثور على معرف حساب Meta الإعلاني. أضفه من الإعدادات." },
        { status: 400 }
      );
    }

    const meta = new MetaClient({
      accessToken: socialAccount.access_token,
      pageId: socialAccount.account_id,
      adAccountId,
    });

    const campaign = await meta.createCampaign({
      name,
      objective: objective.toUpperCase(),
      status: "PAUSED",
      daily_budget: daily_budget,
    });

    const campaignId = (campaign as { id: string }).id;

    const adSet = await meta.createAdSet({
      campaignId,
      name: `${name} - مجموعة إعلانية`,
      dailyBudget: daily_budget,
      targeting: {
        ageMin: targeting?.ageMin || 18,
        ageMax: targeting?.ageMax || 65,
        genders: targeting?.genders,
        countries: targeting?.countries || ["SA"],
        cities: targeting?.cities,
        interests: targeting?.interests,
      },
      startTime: new Date(start_date).toISOString(),
      endTime: end_date ? new Date(end_date).toISOString() : undefined,
    });

    const adSetId = (adSet as { id: string }).id;

    let adResult = null;
    try {
      adResult = await meta.createAd({
        adSetId,
        name: `${name} - إعلان`,
        headline: name,
        body: `حملة ${name}`,
        linkUrl: "https://example.com",
        callToAction: "LEARN_MORE",
      });
    } catch {
      // Placeholder ad may fail without valid creative — that's acceptable
    }

    const { data: dbCampaign, error: dbError } = await auth.supabase
      .from("ad_campaigns")
      .insert({
        company_id,
        name,
        platform: "meta",
        objective,
        status: "paused",
        daily_budget,
        total_budget: total_budget || daily_budget * 30,
        spent_amount: 0,
        start_date,
        end_date: end_date || null,
        target_audience: targeting || {},
        performance_data: {},
        ai_optimizations: [],
        auto_optimize: false,
        platform_campaign_id: campaignId,
        created_by: auth.user!.id,
        organization_id: auth.orgId,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[create-auto] DB insert error:", dbError);
      return NextResponse.json(
        { error: "تم إنشاء الحملة على Meta لكن فشل الحفظ في قاعدة البيانات", meta_campaign_id: campaignId },
        { status: 500 }
      );
    }

    await logUsage(auth.supabase, auth.orgId, "campaigns");

    return NextResponse.json({
      success: true,
      campaign: dbCampaign,
      meta: {
        campaign_id: campaignId,
        adset_id: adSetId,
        ad_id: adResult ? (adResult as { id: string }).id : null,
      },
    });
  } catch (error: any) {
    console.error("[create-auto] Error:", error);
    return NextResponse.json(
      { error: error.message || "فشل في إنشاء الحملة" },
      { status: 500 }
    );
  }
}
