import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicKey, getSupabaseAdmin } from "@/lib/api-keys";
import {
  PLAN_GENERATOR_SYSTEM_PROMPT,
  buildPlanPrompt,
  CONTENT_CREATOR_SYSTEM_PROMPT,
} from "@satwa/ai";

const BATCH_CONTENT_SYSTEM_PROMPT = `${CONTENT_CREATOR_SYSTEM_PROMPT}

مهمتك الآن إنشاء محتوى شهر كامل (30 منشور) دفعة واحدة.
وزّع المنشورات على الأيام والمنصات بشكل متوازن.
نوّع بين أنواع المحتوى: صور، فيديو، ريلز، قصص، كاروسيل، نص.
حدد أفضل وقت نشر لكل منشور.
أجب بصيغة JSON فقط.`;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const apiKey = await getAnthropicKey();
    const anthropic = new Anthropic({ apiKey });

    const { data: companies } = await supabase
      .from("companies")
      .select("*")
      .eq("status", "active");

    if (!companies?.length) {
      return NextResponse.json({ message: "No active companies" });
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}-01`;

    const results = [];

    for (const company of companies) {
      try {
        const [reportRes, contentRes, campaignsRes, accountsRes] = await Promise.all([
          supabase
            .from("monthly_reports")
            .select("*")
            .eq("company_id", company.id)
            .eq("month", lastMonth)
            .single(),
          supabase
            .from("content_calendar")
            .select("*")
            .eq("company_id", company.id)
            .gte("scheduled_date", lastMonth)
            .lt("scheduled_date", currentMonth),
          supabase
            .from("ad_campaigns")
            .select("*")
            .eq("company_id", company.id)
            .in("status", ["active", "completed", "paused"]),
          supabase
            .from("social_accounts")
            .select("*")
            .eq("company_id", company.id)
            .eq("is_connected", true),
        ]);

        const connectedPlatforms = accountsRes.data?.map((a: any) => a.platform) || [];
        const lastMonthReport = reportRes.data?.report_data;
        const lastMonthContent = contentRes.data || [];
        const campaignPerformance = campaignsRes.data || [];

        const previousMonthData: Record<string, unknown> = {};
        if (lastMonthReport) {
          previousMonthData.report = lastMonthReport;
        }
        if (lastMonthContent.length > 0) {
          const contentStats = {
            total_posts: lastMonthContent.length,
            published: lastMonthContent.filter((c: any) => c.status === "published").length,
            by_platform: {} as Record<string, number>,
            engagement_summary: lastMonthContent
              .filter((c: any) => c.engagement_data)
              .map((c: any) => ({
                platform: c.platform,
                type: c.content_type,
                engagement: c.engagement_data,
              })),
          };
          for (const c of lastMonthContent) {
            contentStats.by_platform[c.platform] = (contentStats.by_platform[c.platform] || 0) + 1;
          }
          previousMonthData.content_performance = contentStats;
        }
        if (campaignPerformance.length > 0) {
          previousMonthData.campaigns = campaignPerformance.map((c: any) => ({
            name: c.name,
            platform: c.platform,
            status: c.status,
            daily_budget: c.daily_budget,
            performance: c.performance_data,
          }));
        }

        const planPrompt = buildPlanPrompt({
          companyName: company.name,
          industry: company.industry,
          country: company.country,
          city: company.city,
          targetAudience: company.target_audience || "غير محدد",
          monthlyBudget: company.monthly_budget,
          platforms: connectedPlatforms.length > 0 ? connectedPlatforms : ["instagram", "twitter"],
          goals: ["زيادة الوعي بالعلامة التجارية", "زيادة التفاعل", "تحقيق مبيعات"],
          previousMonthData: Object.keys(previousMonthData).length > 0 ? previousMonthData : undefined,
        });

        const planMessage = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 6144,
          system: PLAN_GENERATOR_SYSTEM_PROMPT,
          messages: [{ role: "user", content: planPrompt }],
        });

        const planText = planMessage.content.find((c) => c.type === "text");
        const planResponseText = planText?.type === "text" ? planText.text : "";
        const planJsonMatch = planResponseText.match(/\{[\s\S]*\}/);
        const planData = planJsonMatch ? JSON.parse(planJsonMatch[0]) : {};

        const targetPlatforms = connectedPlatforms.length > 0
          ? connectedPlatforms
          : Object.keys(planData.platform_strategy || {});

        const { data: marketingPlan, error: planError } = await supabase
          .from("marketing_plans")
          .insert({
            company_id: company.id,
            month: currentMonth,
            title: planData.title || `خطة تسويق ${company.name} - ${currentMonth}`,
            objectives: planData.objectives,
            target_platforms: targetPlatforms,
            total_budget: company.monthly_budget,
            budget_breakdown: planData.budget_breakdown,
            kpis: planData.kpis,
            ai_analysis: planData.executive_summary,
            status: "draft",
          })
          .select()
          .single();

        if (planError) {
          console.error(`Plan insert error for ${company.name}:`, planError);
          continue;
        }

        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

        const contentMessage = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 12000,
          system: BATCH_CONTENT_SYSTEM_PROMPT,
          messages: [{
            role: "user",
            content: `أنشئ محتوى شهر كامل (30 منشور) للمنشأة التالية:

**المنشأة:** ${company.name} (${company.industry})
**الدولة:** ${company.country} - ${company.city}
**الجمهور:** ${company.target_audience || "عام"}
**المنصات:** ${targetPlatforms.join(", ")}
**الشهر:** ${currentMonth}
**عدد أيام الشهر:** ${daysInMonth}

${planData.platform_strategy ? `**استراتيجية المنصات:**\n${JSON.stringify(planData.platform_strategy)}` : ""}

${previousMonthData.content_performance ? `**أداء الشهر السابق:**\n${JSON.stringify(previousMonthData.content_performance)}` : ""}

أنشئ 30 منشور موزعين على أيام الشهر بالتساوي. أجب بصيغة JSON:
{
  "content_items": [
    {
      "platform": "instagram",
      "content_type": "reel|post|story|carousel|video",
      "text_content": "نص المنشور الكامل مع إيموجي مناسب",
      "hashtags": ["هاشتاق1", "هاشتاق2"],
      "scheduled_date": "${currentMonth.slice(0, 8)}DD",
      "scheduled_time": "HH:MM",
      "visual_suggestion": "وصف المرئيات المطلوبة"
    }
  ]
}`,
          }],
        });

        const contentText = contentMessage.content.find((c) => c.type === "text");
        const contentResponseText = contentText?.type === "text" ? contentText.text : "";
        const contentJsonMatch = contentResponseText.match(/\{[\s\S]*\}/);
        const contentData = contentJsonMatch ? JSON.parse(contentJsonMatch[0]) : { content_items: [] };

        const contentRecords = (contentData.content_items || []).map((item: any) => ({
          company_id: company.id,
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
        }));

        let contentInserted = 0;
        if (contentRecords.length > 0) {
          const { data: inserted, error: contentError } = await supabase
            .from("content_calendar")
            .insert(contentRecords)
            .select();

          if (contentError) {
            console.error(`Content insert error for ${company.name}:`, contentError);
          } else {
            contentInserted = inserted?.length || 0;
          }
        }

        const notifyUserIds: string[] = [];
        if (company.assigned_manager_id) {
          notifyUserIds.push(company.assigned_manager_id);
        }

        const { data: clientUsers } = await supabase
          .from("profiles")
          .select("id")
          .eq("company_id", company.id)
          .eq("role", "client");

        for (const u of clientUsers || []) {
          if (!notifyUserIds.includes(u.id)) {
            notifyUserIds.push(u.id);
          }
        }

        for (const uid of notifyUserIds) {
          await supabase.from("notifications").insert({
            user_id: uid,
            company_id: company.id,
            type: "monthly_plan_ready",
            title: "خطة الشهر الجديد جاهزة",
            body: `تم إنشاء خطة تسويق ${company.name} لشهر ${currentMonth} تتضمن ${contentInserted} منشور`,
            data: { plan_id: marketingPlan.id, content_count: contentInserted },
            action_url: `/plans/${marketingPlan.id}`,
          });
        }

        const totalTokens =
          planMessage.usage.input_tokens +
          planMessage.usage.output_tokens +
          contentMessage.usage.input_tokens +
          contentMessage.usage.output_tokens;

        await supabase.from("ai_activity_log").insert({
          action_type: "monthly_planning",
          action_data: {
            company_id: company.id,
            company_name: company.name,
            month: currentMonth,
          },
          result: {
            plan_id: marketingPlan.id,
            content_count: contentInserted,
            has_previous_data: Object.keys(previousMonthData).length > 0,
          },
          tokens_used: totalTokens,
          cost_estimate: totalTokens * 0.000003,
          company_id: company.id,
        });

        results.push({
          company: company.name,
          plan_id: marketingPlan.id,
          content_created: contentInserted,
          tokens_used: totalTokens,
        });
      } catch (companyError: any) {
        console.error(`Monthly planning failed for ${company.name}:`, companyError);
        results.push({
          company: company.name,
          error: companyError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      month: currentMonth,
      companies_processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error("Monthly planning error:", error);
    return NextResponse.json({ error: "Monthly planning failed", details: error.message }, { status: 500 });
  }
}
