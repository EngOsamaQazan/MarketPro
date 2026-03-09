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

    const { data: campaigns } = await supabase
      .from("ad_campaigns")
      .select("*")
      .eq("status", "active");

    const { data: content } = await supabase
      .from("content_calendar")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_date", new Date().toISOString().split("T")[0]);

    if (!campaigns?.length && !content?.length) {
      return NextResponse.json({ message: "No active items to check" });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: `أنت نظام مراقبة حملات تسويقية. حلل البيانات واقترح إجراءات عاجلة. أجب بـ JSON.`,
      messages: [{
        role: "user",
        content: `حملات نشطة: ${JSON.stringify(campaigns)}\nمحتوى مجدول: ${JSON.stringify(content)}\n\nأجب: {"actions": [{"type": "pause|budget|alert", "target_id": "ID", "reason": "السبب"}], "summary": "ملخص"}`,
      }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    const responseText = textContent?.type === "text" ? textContent.text : "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { actions: [], summary: "No analysis" };

    await supabase.from("ai_activity_log").insert({
      action_type: "campaign_optimized",
      input_data: { campaigns_count: campaigns?.length, content_count: content?.length },
      output_data: result,
      model_used: "claude-sonnet-4-20250514",
      tokens_used: message.usage.input_tokens + message.usage.output_tokens,
    });

    for (const action of result.actions || []) {
      if (action.type === "pause" && action.target_id) {
        await supabase
          .from("ad_campaigns")
          .update({ status: "paused" })
          .eq("id", action.target_id)
          .eq("auto_optimize", true);
      }
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Daily check error:", error);
    return NextResponse.json({ error: "Daily check failed" }, { status: 500 });
  }
}
