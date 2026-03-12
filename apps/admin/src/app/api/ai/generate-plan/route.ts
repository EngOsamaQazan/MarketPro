import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { PLAN_GENERATOR_SYSTEM_PROMPT, buildPlanPrompt } from "@satwa/ai";
import { getAnthropicKey } from "@/lib/api-keys";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const apiKey = await getAnthropicKey();
    const anthropic = new Anthropic({ apiKey });

    const body = await req.json();

    const prompt = buildPlanPrompt({
      companyName: body.companyName,
      industry: body.industry,
      country: body.country,
      city: body.city,
      targetAudience: body.targetAudience,
      monthlyBudget: body.monthlyBudget,
      platforms: body.platforms,
      goals: body.goals,
      currentFollowers: body.currentFollowers,
      previousMonthData: body.previousMonthData,
      notes: body.notes,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: PLAN_GENERATOR_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = message.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response as JSON");
    }

    const plan = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      plan,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });
  } catch (error: any) {
    console.error("AI Plan Generation Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate marketing plan" },
      { status: 500 }
    );
  }
}
