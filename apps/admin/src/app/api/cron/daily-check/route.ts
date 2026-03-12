import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicKey, getSupabaseAdmin } from "@/lib/api-keys";
import { CONTENT_CREATOR_SYSTEM_PROMPT } from "@satwa/ai";

const DAILY_AGENT_SYSTEM_PROMPT = `أنت وكيل ذكاء اصطناعي يدير التسويق الرقمي. راجع أداء اليوم واتخذ قرارات ذكية.

دورك:
1. تحليل أداء الحملات الإعلانية النشطة واكتشاف المشاكل
2. مراجعة المحتوى المجدول لليوم والتأكد من جاهزيته
3. تحليل اتجاهات التفاعل على المحتوى المنشور
4. اتخاذ قرارات تلقائية لتحسين الأداء

قواعد القرارات:
- أوقف الحملة إذا كان CPA أعلى من المقبول بـ 50%+
- زِد الميزانية للحملات ذات الأداء الممتاز (ROAS > 3x)
- خفّض الميزانية للحملات الضعيفة قبل إيقافها
- اعتمد المحتوى تلقائياً فقط إذا كان AI-generated وجودته مقبولة
- أنشئ محتوى بديل للمحتوى المرفوض أو الناقص
- نبّه فوراً عند أي مشكلة حرجة

أجب دائماً بصيغة JSON المحددة.`;

interface CampaignAction {
  campaign_id: string;
  action: "PAUSE" | "RESUME" | "INCREASE_BUDGET" | "DECREASE_BUDGET";
  reason: string;
  new_value?: number;
}

interface ContentAction {
  action: "GENERATE_REPLACEMENT" | "RESCHEDULE" | "APPROVE_AUTO";
  content_id?: string;
  reason: string;
  platform?: string;
  content_type?: string;
}

interface Alert {
  severity: "critical" | "warning" | "info";
  message: string;
}

interface DailyAnalysis {
  campaign_actions: CampaignAction[];
  content_actions: ContentAction[];
  alerts: Alert[];
  daily_summary: string;
  score: number;
}

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

    const today = new Date().toISOString().split("T")[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const results = [];

    for (const company of companies) {
      try {
        const [campaignsRes, todayContentRes, recentContentRes] = await Promise.all([
          supabase
            .from("ad_campaigns")
            .select("*")
            .eq("company_id", company.id)
            .in("status", ["active", "paused"]),
          supabase
            .from("content_calendar")
            .select("*")
            .eq("company_id", company.id)
            .eq("scheduled_date", today),
          supabase
            .from("content_calendar")
            .select("*")
            .eq("company_id", company.id)
            .eq("status", "published")
            .gte("scheduled_date", sevenDaysAgo)
            .lt("scheduled_date", today),
        ]);

        const activeCampaigns = campaignsRes.data || [];
        const todayContent = todayContentRes.data || [];
        const recentContent = recentContentRes.data || [];

        if (!activeCampaigns.length && !todayContent.length && !recentContent.length) {
          results.push({ company: company.name, skipped: true, reason: "No active items" });
          continue;
        }

        const todayContentSummary = todayContent.map((c: any) => ({
          id: c.id,
          platform: c.platform,
          type: c.content_type,
          status: c.status,
          approval_status: c.approval_status,
          ai_generated: c.ai_generated,
          has_text: !!c.text_content,
          has_media: !!(c.media_urls?.length),
        }));

        const recentEngagement = recentContent.map((c: any) => ({
          id: c.id,
          platform: c.platform,
          type: c.content_type,
          date: c.scheduled_date,
          engagement: c.engagement_data,
        }));

        const campaignSummary = activeCampaigns.map((c: any) => ({
          id: c.id,
          name: c.name,
          platform: c.platform,
          objective: c.objective,
          status: c.status,
          daily_budget: c.daily_budget,
          total_budget: c.total_budget,
          performance: c.performance_data,
          auto_optimize: c.auto_optimize,
        }));

        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 6144,
          system: DAILY_AGENT_SYSTEM_PROMPT,
          messages: [{
            role: "user",
            content: `التقرير اليومي لـ: ${company.name} (${company.industry})
التاريخ: ${today}

=== الحملات الإعلانية (${campaignSummary.length}) ===
${JSON.stringify(campaignSummary, null, 2)}

=== محتوى اليوم المجدول (${todayContentSummary.length}) ===
${JSON.stringify(todayContentSummary, null, 2)}

=== أداء المحتوى المنشور (آخر 7 أيام: ${recentEngagement.length} منشور) ===
${JSON.stringify(recentEngagement, null, 2)}

حلل البيانات وأجب بصيغة JSON:
{
  "campaign_actions": [
    {
      "campaign_id": "UUID",
      "action": "PAUSE|RESUME|INCREASE_BUDGET|DECREASE_BUDGET",
      "reason": "سبب القرار",
      "new_value": 0
    }
  ],
  "content_actions": [
    {
      "action": "GENERATE_REPLACEMENT|RESCHEDULE|APPROVE_AUTO",
      "content_id": "UUID أو null للمحتوى الجديد",
      "reason": "السبب",
      "platform": "المنصة (للمحتوى الجديد)",
      "content_type": "نوع المحتوى (للمحتوى الجديد)"
    }
  ],
  "alerts": [
    {
      "severity": "critical|warning|info",
      "message": "وصف التنبيه"
    }
  ],
  "daily_summary": "ملخص شامل لحالة التسويق اليوم بالعربية",
  "score": 75
}`,
          }],
        });

        const textContent = message.content.find((c) => c.type === "text");
        const responseText = textContent?.type === "text" ? textContent.text : "";
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        const analysis: DailyAnalysis = jsonMatch
          ? JSON.parse(jsonMatch[0])
          : { campaign_actions: [], content_actions: [], alerts: [], daily_summary: "لا يوجد تحليل", score: 50 };

        const executedActions: any[] = [];

        for (const action of analysis.campaign_actions) {
          const campaign = activeCampaigns.find((c: any) => c.id === action.campaign_id);
          if (!campaign) continue;
          if (!campaign.auto_optimize && action.action !== "PAUSE") continue;

          switch (action.action) {
            case "PAUSE": {
              const { error } = await supabase
                .from("ad_campaigns")
                .update({ status: "paused" })
                .eq("id", action.campaign_id);
              if (!error) executedActions.push({ type: "campaign_paused", ...action });
              break;
            }
            case "RESUME": {
              const { error } = await supabase
                .from("ad_campaigns")
                .update({ status: "active" })
                .eq("id", action.campaign_id);
              if (!error) executedActions.push({ type: "campaign_resumed", ...action });
              break;
            }
            case "INCREASE_BUDGET": {
              const newBudget = action.new_value || campaign.daily_budget * 1.2;
              const maxBudget = campaign.daily_budget * 2;
              const finalBudget = Math.min(newBudget, maxBudget);
              const { error } = await supabase
                .from("ad_campaigns")
                .update({ daily_budget: finalBudget })
                .eq("id", action.campaign_id);
              if (!error) executedActions.push({ type: "budget_increased", ...action, final_value: finalBudget });
              break;
            }
            case "DECREASE_BUDGET": {
              const newBudget = action.new_value || campaign.daily_budget * 0.7;
              const minBudget = campaign.daily_budget * 0.3;
              const finalBudget = Math.max(newBudget, minBudget);
              const { error } = await supabase
                .from("ad_campaigns")
                .update({ daily_budget: finalBudget })
                .eq("id", action.campaign_id);
              if (!error) executedActions.push({ type: "budget_decreased", ...action, final_value: finalBudget });
              break;
            }
          }
        }

        for (const action of analysis.content_actions) {
          switch (action.action) {
            case "APPROVE_AUTO": {
              if (!action.content_id) break;
              const content = todayContent.find((c: any) => c.id === action.content_id);
              if (content?.ai_generated && content?.approval_status === "pending") {
                const { error } = await supabase
                  .from("content_calendar")
                  .update({ approval_status: "approved" })
                  .eq("id", action.content_id);
                if (!error) executedActions.push({ type: "content_auto_approved", content_id: action.content_id });
              }
              break;
            }
            case "GENERATE_REPLACEMENT": {
              try {
                const platform = action.platform || "instagram";
                const contentType = action.content_type || "post";

                const replacementMessage = await anthropic.messages.create({
                  model: "claude-sonnet-4-20250514",
                  max_tokens: 2048,
                  system: CONTENT_CREATOR_SYSTEM_PROMPT,
                  messages: [{
                    role: "user",
                    content: `اكتب منشور ${contentType} لمنصة ${platform}:

**المنشأة:** ${company.name} (${company.industry})
**السبب:** ${action.reason}
**التاريخ:** ${today}

أجب بصيغة JSON:
{
  "text_content": "نص المنشور",
  "hashtags": ["هاشتاق1"],
  "visual_suggestion": "وصف المرئيات",
  "scheduled_time": "HH:MM"
}`,
                  }],
                });

                const repText = replacementMessage.content.find((c) => c.type === "text");
                const repResponse = repText?.type === "text" ? repText.text : "";
                const repJson = repResponse.match(/\{[\s\S]*\}/);

                if (repJson) {
                  const newContent = JSON.parse(repJson[0]);
                  const { data: inserted, error } = await supabase
                    .from("content_calendar")
                    .insert({
                      company_id: company.id,
                      platform,
                      content_type: contentType,
                      text_content: newContent.text_content,
                      hashtags: newContent.hashtags,
                      scheduled_date: today,
                      scheduled_time: newContent.scheduled_time || "14:00",
                      status: "draft",
                      approval_status: "pending",
                      ai_generated: true,
                    })
                    .select()
                    .single();

                  if (!error && inserted) {
                    executedActions.push({
                      type: "replacement_content_created",
                      new_content_id: inserted.id,
                      platform,
                      reason: action.reason,
                    });
                  }
                }
              } catch (genErr) {
                console.error(`Replacement content generation failed for ${company.name}:`, genErr);
              }
              break;
            }
            case "RESCHEDULE": {
              if (!action.content_id) break;
              const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
              const { error } = await supabase
                .from("content_calendar")
                .update({ scheduled_date: tomorrow })
                .eq("id", action.content_id);
              if (!error) executedActions.push({ type: "content_rescheduled", content_id: action.content_id, new_date: tomorrow });
              break;
            }
          }
        }

        const criticalAlerts = analysis.alerts.filter((a) => a.severity === "critical");
        const scoreEmoji = analysis.score >= 80 ? "🟢" : analysis.score >= 50 ? "🟡" : "🔴";

        if (company.assigned_manager_id) {
          let notifBody = `${scoreEmoji} تقييم اليوم: ${analysis.score}/100\n${analysis.daily_summary}`;
          if (executedActions.length > 0) {
            notifBody += `\n\nإجراءات تلقائية: ${executedActions.length}`;
          }
          if (criticalAlerts.length > 0) {
            notifBody += `\n\n⚠️ تنبيهات حرجة: ${criticalAlerts.map((a) => a.message).join(" | ")}`;
          }

          await supabase.from("notifications").insert({
            user_id: company.assigned_manager_id,
            company_id: company.id,
            type: criticalAlerts.length > 0 ? "critical_alert" : "daily_summary",
            title: `التقرير اليومي - ${company.name}`,
            body: notifBody,
            data: {
              score: analysis.score,
              actions_executed: executedActions.length,
              alerts_count: analysis.alerts.length,
              critical_count: criticalAlerts.length,
            },
            action_url: `/campaigns?company=${company.id}`,
          });
        }

        const totalTokens = message.usage.input_tokens + message.usage.output_tokens;
        await supabase.from("ai_activity_log").insert({
          action_type: "daily_check",
          action_data: {
            company_id: company.id,
            company_name: company.name,
            date: today,
            campaigns_checked: activeCampaigns.length,
            content_checked: todayContent.length,
            recent_content_analyzed: recentContent.length,
          },
          result: {
            score: analysis.score,
            summary: analysis.daily_summary,
            campaign_actions: analysis.campaign_actions.length,
            content_actions: analysis.content_actions.length,
            alerts: analysis.alerts.length,
            executed_actions: executedActions,
          },
          tokens_used: totalTokens,
          cost_estimate: totalTokens * 0.000003,
          company_id: company.id,
        });

        results.push({
          company: company.name,
          score: analysis.score,
          summary: analysis.daily_summary,
          campaign_actions: analysis.campaign_actions.length,
          content_actions: analysis.content_actions.length,
          executed_actions: executedActions.length,
          alerts: analysis.alerts.length,
          critical_alerts: criticalAlerts.length,
        });
      } catch (companyError: any) {
        console.error(`Daily check failed for ${company.name}:`, companyError);
        results.push({
          company: company.name,
          error: companyError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      date: today,
      companies_checked: results.length,
      results,
    });
  } catch (error: any) {
    console.error("Daily check error:", error);
    return NextResponse.json({ error: "Daily check failed", details: error.message }, { status: 500 });
  }
}
