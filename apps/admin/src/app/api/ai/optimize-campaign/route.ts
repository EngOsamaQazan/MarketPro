import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicKey } from "@/lib/api-keys";
import { requireAuth } from "@/lib/auth";

const OPTIMIZER_SYSTEM = `أنت نظام تحسين حملات إعلانية ذكي يعمل بشكل مستقل.
تحلل أداء الحملات وتتخذ قرارات تلقائية لتحسين النتائج.

القرارات المتاحة:
1. PAUSE_AD - إيقاف إعلان ضعيف الأداء
2. INCREASE_BUDGET - زيادة ميزانية إعلان ناجح (حد أقصى 30%)
3. DECREASE_BUDGET - تقليل ميزانية إعلان متوسط (حد أقصى 20%)
4. REFRESH_CREATIVE - تنبيه لتحديث المحتوى الإبداعي
5. EXPAND_AUDIENCE - اقتراح توسيع الجمهور
6. NARROW_AUDIENCE - اقتراح تضييق الجمهور
7. CREATE_AB_TEST - اقتراح اختبار A/B
8. NO_ACTION - لا يحتاج تدخل

القواعد الحديدية:
- لا تزيد الميزانية أكثر من مرة كل 48 ساعة
- لا توقف إعلان عمره أقل من 3 أيام (يحتاج وقت للتعلم)
- أوقف فوراً أي إعلان CPA > 2x الهدف وعمره > 5 أيام
- إذا Frequency > 3.5 اقترح تحديث المحتوى أو توسيع الجمهور

أجب دائماً بصيغة JSON.`;

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const apiKey = await getAnthropicKey();
    const anthropic = new Anthropic({ apiKey });

    const { campaigns } = await req.json();

    const prompt = `حلل الحملات التالية واتخذ القرارات المناسبة:

${JSON.stringify(campaigns, null, 2)}

أجب بصيغة JSON:
{
  "decisions": [
    {
      "campaign_id": "ID",
      "campaign_name": "الاسم",
      "action": "نوع القرار",
      "reason": "السبب بالعربي",
      "details": {
        "current_value": "القيمة الحالية",
        "recommended_value": "القيمة المقترحة"
      },
      "priority": "high|medium|low",
      "auto_execute": true/false,
      "estimated_impact": "الأثر المتوقع"
    }
  ],
  "summary": "ملخص عام للحالة",
  "overall_health": "healthy|needs_attention|critical"
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: OPTIMIZER_SYSTEM,
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

    const decisions = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      ...decisions,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });
  } catch (error: any) {
    console.error("Campaign Optimization Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to optimize campaigns" },
      { status: 500 }
    );
  }
}
