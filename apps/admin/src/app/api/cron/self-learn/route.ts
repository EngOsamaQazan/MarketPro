import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicKey, getSupabaseAdmin } from "@/lib/api-keys";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const apiKey = await getAnthropicKey();
    const anthropic = new Anthropic({ apiKey });

    const { data: recentLogs } = await supabase
      .from("ai_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: campaigns } = await supabase
      .from("ad_campaigns")
      .select("*")
      .in("status", ["active", "completed", "paused"])
      .order("created_at", { ascending: false })
      .limit(30);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: `أنت نظام تعلم ذاتي لمنصة تسويق رقمي. مهمتك تحليل أدائك السابق واستخلاص دروس لتحسين قراراتك المستقبلية.`,
      messages: [{
        role: "user",
        content: `سجل القرارات السابقة:\n${JSON.stringify(recentLogs)}\n\nأداء الحملات:\n${JSON.stringify(campaigns)}\n\nحلل أداءك واستخلص:\n{"successful_patterns": ["ما نجح"], "mistakes_to_avoid": ["ما فشل"], "new_strategies": ["أفكار جديدة"], "updated_optimization_rules": [{"rule": "القاعدة", "old": "القديم", "new": "الجديد"}], "market_insights": ["رؤى سوقية"]}`,
      }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    const responseText = textContent?.type === "text" ? textContent.text : "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const learnings = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    await supabase.from("ai_activity_log").insert({
      action_type: "campaign_optimized",
      input_data: { type: "self_learning", logs_analyzed: recentLogs?.length, campaigns_analyzed: campaigns?.length },
      output_data: learnings,
      model_used: "claude-sonnet-4-20250514",
      tokens_used: message.usage.input_tokens + message.usage.output_tokens,
    });

    return NextResponse.json({ success: true, learnings });
  } catch (error) {
    console.error("Self-learning error:", error);
    return NextResponse.json({ error: "Self-learning failed" }, { status: 500 });
  }
}
