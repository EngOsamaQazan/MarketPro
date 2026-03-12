import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/auth";
import { getAnthropicKey, getApiKey } from "@/lib/api-keys";
import { MetaClient } from "@satwa/social";

const OPTIMIZER_SYSTEM = `أنت محلل حملات إعلانية متخصص. تحلل بيانات الأداء وتقدم توصيات مهيكلة.
أجب دائماً بصيغة JSON فقط بدون أي نص إضافي.

الصيغة المطلوبة:
{
  "recommendations": [
    {
      "action": "PAUSE_AD" | "INCREASE_BUDGET" | "DECREASE_BUDGET" | "CHANGE_TARGETING" | "UPDATE_CREATIVE",
      "params": { ... },
      "reason": "سبب التوصية بالعربي"
    }
  ],
  "analysis": "تحليل شامل للأداء بالعربي",
  "score": 0-100
}

قواعد:
- PAUSE_AD: فقط إذا CTR < 0.3% وعمر الحملة > 3 أيام
- INCREASE_BUDGET: إذا ROAS > 2 أو CTR > 2%، الزيادة بحد أقصى 30%
- DECREASE_BUDGET: إذا CPA مرتفع، التخفيض بحد أقصى 20%
- CHANGE_TARGETING: إذا Frequency > 3.5
- UPDATE_CREATIVE: إذا CTR ينخفض تدريجياً`;

interface Recommendation {
  action: string;
  params: Record<string, any>;
  reason: string;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { campaign_id } = await req.json();

    if (!campaign_id) {
      return NextResponse.json({ error: "campaign_id مطلوب" }, { status: 400 });
    }

    const { data: campaign, error: fetchErr } = await auth.supabase
      .from("ad_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (fetchErr || !campaign) {
      return NextResponse.json({ error: "الحملة غير موجودة" }, { status: 404 });
    }

    let liveMetrics = null;

    if (campaign.platform_campaign_id && campaign.platform === "meta") {
      try {
        const { data: socialAccount } = await auth.supabase
          .from("social_accounts")
          .select("*")
          .eq("company_id", campaign.company_id)
          .eq("is_connected", true)
          .in("platform", ["facebook", "meta"])
          .single();

        if (socialAccount) {
          const adAccountId = await getApiKey("meta", "ad_account_id");
          const meta = new MetaClient({
            accessToken: socialAccount.access_token,
            pageId: socialAccount.account_id,
            adAccountId: adAccountId || undefined,
          });

          liveMetrics = await meta.getCampaignInsights(campaign.platform_campaign_id);
        }
      } catch (e) {
        console.warn("[optimize] Could not fetch live Meta metrics:", e);
      }
    }

    const apiKey = await getAnthropicKey();
    const anthropic = new Anthropic({ apiKey });

    const campaignData = {
      id: campaign.id,
      name: campaign.name,
      platform: campaign.platform,
      objective: campaign.objective,
      status: campaign.status,
      daily_budget: campaign.daily_budget,
      total_budget: campaign.total_budget,
      spent_amount: campaign.spent_amount,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      target_audience: campaign.target_audience,
      performance: liveMetrics || campaign.performance_data || {},
      auto_optimize: campaign.auto_optimize,
    };

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: OPTIMIZER_SYSTEM,
      messages: [
        {
          role: "user",
          content: `حلل هذه الحملة وقدم توصيات التحسين:\n\n${JSON.stringify(campaignData, null, 2)}`,
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    const result = JSON.parse(jsonMatch[0]) as {
      recommendations: Recommendation[];
      analysis: string;
      score: number;
    };

    const autoExecuted: Array<{ action: string; result: string }> = [];

    if (campaign.auto_optimize && campaign.platform_campaign_id && campaign.platform === "meta") {
      const safeActions = ["PAUSE_AD", "INCREASE_BUDGET", "DECREASE_BUDGET"];
      const firstSafe = result.recommendations.find((r) => safeActions.includes(r.action));

      if (firstSafe) {
        try {
          const { data: socialAccount } = await auth.supabase
            .from("social_accounts")
            .select("*")
            .eq("company_id", campaign.company_id)
            .eq("is_connected", true)
            .in("platform", ["facebook", "meta"])
            .single();

          if (socialAccount) {
            const adAccountId = await getApiKey("meta", "ad_account_id");
            const meta = new MetaClient({
              accessToken: socialAccount.access_token,
              pageId: socialAccount.account_id,
              adAccountId: adAccountId || undefined,
            });

            switch (firstSafe.action) {
              case "PAUSE_AD":
                await meta.updateCampaignStatus(campaign.platform_campaign_id, "PAUSED");
                await auth.supabase
                  .from("ad_campaigns")
                  .update({ status: "paused" })
                  .eq("id", campaign_id);
                autoExecuted.push({ action: "PAUSE_AD", result: "تم إيقاف الحملة" });
                break;

              case "INCREASE_BUDGET": {
                const newBudget = campaign.daily_budget * 1.2;
                await meta.updateCampaignBudget(campaign.platform_campaign_id, newBudget);
                await auth.supabase
                  .from("ad_campaigns")
                  .update({ daily_budget: newBudget })
                  .eq("id", campaign_id);
                autoExecuted.push({
                  action: "INCREASE_BUDGET",
                  result: `تم زيادة الميزانية إلى ${newBudget.toFixed(2)}`,
                });
                break;
              }

              case "DECREASE_BUDGET": {
                const reduced = campaign.daily_budget * 0.85;
                await meta.updateCampaignBudget(campaign.platform_campaign_id, reduced);
                await auth.supabase
                  .from("ad_campaigns")
                  .update({ daily_budget: reduced })
                  .eq("id", campaign_id);
                autoExecuted.push({
                  action: "DECREASE_BUDGET",
                  result: `تم تخفيض الميزانية إلى ${reduced.toFixed(2)}`,
                });
                break;
              }
            }
          }
        } catch (e: any) {
          console.error("[optimize] Auto-execute failed:", e);
          autoExecuted.push({ action: firstSafe.action, result: `فشل: ${e.message}` });
        }
      }
    }

    await auth.supabase
      .from("ad_campaigns")
      .update({
        ai_optimizations: [
          ...(campaign.ai_optimizations || []),
          {
            timestamp: new Date().toISOString(),
            score: result.score,
            recommendations: result.recommendations,
            auto_executed: autoExecuted,
          },
        ],
      })
      .eq("id", campaign_id);

    try {
      await auth.supabase.from("ai_activity_log").insert({
        activity_type: "campaign_optimization",
        description: `تحسين حملة: ${campaign.name} — النتيجة: ${result.score}/100`,
        details: {
          campaign_id,
          campaign_name: campaign.name,
          score: result.score,
          recommendations_count: result.recommendations.length,
          auto_executed: autoExecuted,
        },
        created_by: auth.user!.id,
      });
    } catch {
      // ai_activity_log may not exist yet
    }

    return NextResponse.json({
      success: true,
      recommendations: result.recommendations,
      analysis: result.analysis,
      score: result.score,
      autoExecuted,
    });
  } catch (error: any) {
    console.error("[optimize] Error:", error);
    return NextResponse.json(
      { error: error.message || "فشل في تحسين الحملة" },
      { status: 500 }
    );
  }
}
