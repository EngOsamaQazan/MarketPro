import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicKey, getSupabaseAdmin } from "@/lib/api-keys";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { company_id, competitor_urls, competitor_social_handles } = body;

    if (!company_id) {
      return NextResponse.json(
        { success: false, error: "company_id مطلوب" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const { data: company, error: companyError } = await admin
      .from("companies")
      .select("*")
      .eq("id", company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: "الشركة غير موجودة" },
        { status: 404 }
      );
    }

    const apiKey = await getAnthropicKey();
    const anthropic = new Anthropic({ apiKey });

    const competitorContext = [
      competitor_urls?.length
        ? `Known competitor websites: ${competitor_urls.join(", ")}`
        : "",
      competitor_social_handles?.length
        ? `Known competitor social handles: ${competitor_social_handles.join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `You are a competitive intelligence analyst for digital marketing in the Middle East.

Analyze the competitive landscape for this company:
- Company: ${company.name}
- Industry: ${company.industry}
- Country: ${company.country}
- City: ${company.city}
- Target Audience: ${company.target_audience || "General"}
- Monthly Budget: ${company.monthly_budget} USD

${competitorContext}

Provide a comprehensive competitive analysis. Return ONLY valid JSON in this exact format:
{
  "competitors": [
    {
      "name": "Competitor Name",
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "social_presence": { "instagram": true, "twitter": true, "tiktok": false, "linkedin": true },
      "estimated_followers": 50000,
      "market_position": "leader|challenger|follower|nicher"
    }
  ],
  "opportunities": ["opportunity1", "opportunity2", "opportunity3"],
  "threats": ["threat1", "threat2"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "market_overview": "Brief overview of the market landscape",
  "competitive_advantage_suggestions": ["suggestion1", "suggestion2"]
}

Include 3-5 competitors. All text values must be in Arabic.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
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

    const analysis = JSON.parse(jsonMatch[0]);

    await admin.from("ai_activity_log").insert({
      action_type: "competitor_analysis",
      action_data: {
        company_id,
        company_name: company.name,
        industry: company.industry,
        competitor_urls,
        competitor_social_handles,
      },
      result: analysis,
      tokens_used: message.usage.input_tokens + message.usage.output_tokens,
      cost_estimate:
        (message.usage.input_tokens * 0.003 +
          message.usage.output_tokens * 0.015) /
        1000,
      created_by: auth.user!.id,
      company_id,
    });

    return NextResponse.json({
      success: true,
      analysis,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });
  } catch (error: any) {
    console.error("Competitor Analysis Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "فشل تحليل المنافسين",
      },
      { status: 500 }
    );
  }
}
