import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicKey, getSupabaseAdmin } from "@/lib/api-keys";
import { requireAuth } from "@/lib/auth";

const ONBOARDING_SYSTEM_PROMPT = `أنت وكيل ذكاء اصطناعي متخصص في التسويق الرقمي. مهمتك تجهيز خطة تسويق كاملة لعميل جديد.
عند استلام بيانات العميل، قم بـ:
1. تحليل المجال والسوق المستهدف
2. بناء خطة تسويق شهرية متكاملة
3. إنشاء محتوى مبدئي لأول شهر (20-30 منشور)
4. اقتراح حملات إعلانية مناسبة

القواعد:
- وزّع المحتوى بذكاء عبر المنصات المتاحة
- اجعل المحتوى متنوعاً (صور، فيديو، ريلز، قصص، كاروسيل)
- حدد أوقات النشر المثالية لكل منصة
- وزّع الميزانية حسب فعالية المنصة للمجال
- اقترح حملات بأهداف SMART
- اكتب بالعربية الفصحى المبسطة

أجب دائماً بصيغة JSON المحددة فقط.`;

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { company_id } = await req.json();
    if (!company_id) {
      return NextResponse.json({ error: "company_id مطلوب" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const apiKey = await getAnthropicKey();
    const anthropic = new Anthropic({ apiKey });

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: "الشركة غير موجودة" }, { status: 404 });
    }

    const { data: socialAccounts } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("company_id", company_id)
      .eq("is_connected", true);

    const connectedPlatforms = socialAccounts?.map((a: any) => a.platform) || [];
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: ONBOARDING_SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `بيانات العميل الجديد:
- الاسم: ${company.name}
- المجال: ${company.industry}
- الدولة: ${company.country} - ${company.city}
- الجمهور المستهدف: ${company.target_audience || "غير محدد"}
- الميزانية الشهرية: $${company.monthly_budget}
- الباقة: ${company.package_type}
- وصف النشاط: ${company.description || "غير متوفر"}
- المنصات المتصلة: ${connectedPlatforms.length ? connectedPlatforms.join(", ") : "لا توجد منصات متصلة بعد - اقترح أنسب المنصات"}

أنشئ استراتيجية الشهر الأول بصيغة JSON:
{
  "plan": {
    "title": "عنوان الخطة",
    "executive_summary": "ملخص تنفيذي",
    "objectives": [{"goal": "الهدف", "metric": "المؤشر", "target_value": "القيمة المستهدفة"}],
    "platform_strategy": {"platform": {"why": "السبب", "posting_frequency": "عدد/أسبوع", "budget_percentage": 0}},
    "budget_breakdown": {"advertising": 0, "content_production": 0, "tools": 0, "reserve": 0},
    "kpis": [{"name": "المؤشر", "target": "القيمة", "measurement": "طريقة القياس"}],
    "ai_analysis": "تحليل شامل للسوق والفرص"
  },
  "content_items": [
    {
      "platform": "instagram",
      "content_type": "reel",
      "text_content": "نص المنشور كاملاً مع الإيموجي",
      "hashtags": ["هاشتاق1", "هاشتاق2"],
      "scheduled_date": "YYYY-MM-DD",
      "scheduled_time": "HH:MM",
      "visual_suggestion": "وصف تفصيلي للمرئيات المطلوبة"
    }
  ],
  "campaigns": [
    {
      "name": "اسم الحملة",
      "platform": "المنصة",
      "objective": "awareness|engagement|traffic|conversions|leads",
      "daily_budget": 0,
      "target_audience": "وصف الجمهور المستهدف"
    }
  ]
}`,
      }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    const responseText = textContent?.type === "text" ? textContent.text : "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("AI did not return valid JSON");
    }

    const aiResult = JSON.parse(jsonMatch[0]);
    const { plan, content_items, campaigns } = aiResult;

    const { data: marketingPlan, error: planError } = await supabase
      .from("marketing_plans")
      .insert({
        company_id,
        month: currentMonth,
        title: plan.title || `خطة تسويق ${company.name} - الشهر الأول`,
        objectives: plan.objectives,
        target_platforms: connectedPlatforms.length ? connectedPlatforms : Object.keys(plan.platform_strategy || {}),
        total_budget: company.monthly_budget,
        budget_breakdown: plan.budget_breakdown,
        kpis: plan.kpis,
        ai_analysis: plan.ai_analysis || plan.executive_summary,
        status: "draft",
        created_by: auth.user.id,
        organization_id: auth.orgId,
      })
      .select()
      .single();

    if (planError) {
      console.error("Plan insert error:", planError);
      throw new Error("Failed to create marketing plan");
    }

    const contentRecords = (content_items || []).map((item: any) => ({
      company_id,
      platform: item.platform,
      content_type: item.content_type,
      text_content: item.text_content,
      hashtags: item.hashtags,
      scheduled_date: item.scheduled_date,
      scheduled_time: item.scheduled_time || "12:00",
      status: "draft",
      approval_status: "pending",
      ai_generated: true,
      plan_id: marketingPlan.id,
      created_by: auth.user.id,
      organization_id: auth.orgId,
    }));

    let contentInserted = 0;
    if (contentRecords.length > 0) {
      const { data: insertedContent, error: contentError } = await supabase
        .from("content_calendar")
        .insert(contentRecords)
        .select();

      if (contentError) {
        console.error("Content insert error:", contentError);
      } else {
        contentInserted = insertedContent?.length || 0;
      }
    }

    const campaignRecords = (campaigns || []).map((camp: any) => ({
      company_id,
      name: camp.name,
      platform: camp.platform,
      objective: camp.objective,
      status: "draft",
      daily_budget: camp.daily_budget,
      total_budget: (camp.daily_budget || 0) * 30,
      ai_optimizations: { target_audience: camp.target_audience },
      auto_optimize: true,
      organization_id: auth.orgId,
    }));

    let campaignsInserted = 0;
    if (campaignRecords.length > 0) {
      const { data: insertedCampaigns, error: campError } = await supabase
        .from("ad_campaigns")
        .insert(campaignRecords)
        .select();

      if (campError) {
        console.error("Campaign insert error:", campError);
      } else {
        campaignsInserted = insertedCampaigns?.length || 0;
      }
    }

    const notifyUserIds: string[] = [];

    if (company.assigned_manager_id) {
      notifyUserIds.push(company.assigned_manager_id);
    }

    const { data: clientUsers } = await supabase
      .from("profiles")
      .select("id")
      .eq("company_id", company_id)
      .eq("role", "client");

    for (const u of clientUsers || []) {
      if (!notifyUserIds.includes(u.id)) {
        notifyUserIds.push(u.id);
      }
    }

    for (const uid of notifyUserIds) {
      await supabase.from("notifications").insert({
        user_id: uid,
        company_id,
        type: "onboarding_complete",
        title: "تم تجهيز خطة التسويق",
        body: `تم إنشاء خطة تسويق شاملة لـ ${company.name} تتضمن ${contentInserted} منشور و${campaignsInserted} حملة إعلانية`,
        data: { plan_id: marketingPlan.id, content_count: contentInserted, campaigns_count: campaignsInserted },
        action_url: `/plans/${marketingPlan.id}`,
        organization_id: auth.orgId,
      });
    }

    const totalTokens = message.usage.input_tokens + message.usage.output_tokens;
    await supabase.from("ai_activity_log").insert({
      action_type: "client_onboarding",
      action_data: { company_id, company_name: company.name },
      result: {
        plan_id: marketingPlan.id,
        content_count: contentInserted,
        campaigns_count: campaignsInserted,
      },
      tokens_used: totalTokens,
      cost_estimate: totalTokens * 0.000003,
      created_by: auth.user.id,
      company_id,
      organization_id: auth.orgId,
    });

    return NextResponse.json({
      success: true,
      summary: {
        plan_id: marketingPlan.id,
        plan_title: plan.title,
        content_items_created: contentInserted,
        campaigns_created: campaignsInserted,
        notifications_sent: notifyUserIds.length,
      },
    });
  } catch (error: any) {
    console.error("Onboard client error:", error);
    return NextResponse.json(
      { error: "فشل في تجهيز العميل", details: error.message },
      { status: 500 },
    );
  }
}
