import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CONTENT_CREATOR_SYSTEM_PROMPT, buildContentPrompt } from "@satwa/ai";
import { getAnthropicKey } from "@/lib/api-keys";
import { requireAuth } from "@/lib/auth";
import { checkUsageLimit, logUsage } from "@/lib/usage-limits";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const limit = await checkUsageLimit(auth, "ai_credits");
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `تجاوزت حد استخدام الذكاء الاصطناعي في باقتك (${limit.limit})`, limit: limit.limit },
        { status: 403 }
      );
    }

    const apiKey = await getAnthropicKey();
    const anthropic = new Anthropic({ apiKey });

    const body = await req.json();

    const prompt = buildContentPrompt({
      companyName: body.companyName,
      industry: body.industry,
      platform: body.platform,
      contentType: body.contentType,
      topic: body.topic,
      tone: body.tone,
      language: body.language || "ar",
      includeHashtags: body.includeHashtags ?? true,
      includeCTA: body.includeCTA ?? true,
      additionalContext: body.additionalContext,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: CONTENT_CREATOR_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response");
    }

    const content = JSON.parse(jsonMatch[0]);

    await logUsage(auth.supabase, auth.orgId, "ai_credits");

    return NextResponse.json({
      success: true,
      content,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });
  } catch (error: any) {
    console.error("Content Generation Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate content" },
      { status: 500 }
    );
  }
}
