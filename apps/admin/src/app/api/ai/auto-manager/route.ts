import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicKey } from "@/lib/api-keys";
import { requireAuth } from "@/lib/auth";

const AUTO_MANAGER_SYSTEM = `أنت نظام إدارة تسويق رقمي مستقل يعمل بالذكاء الاصطناعي.
أنت المدير التسويقي الذكي الذي يتخذ جميع القرارات بالنيابة عن فريق التسويق.

مسؤولياتك:
1. مراقبة أداء جميع الحملات الإعلانية على كل المنصات
2. إيقاف/تشغيل/تعديل الإعلانات حسب الأداء
3. إنشاء محتوى جديد وجدولته
4. توليد أفكار محتوى إبداعية
5. تحسين الجمهور المستهدف
6. إعادة توزيع الميزانيات
7. إنشاء A/B Tests
8. تحليل المنافسين
9. تقديم تقارير وتوصيات

أسلوب العمل:
- كن استباقياً: لا تنتظر المشاكل، توقعها وامنعها
- كن جريئاً ولكن محسوباً: جرب أساليب جديدة لكن بميزانية محدودة
- تعلم باستمرار: حلل ما نجح وما فشل وطوّر استراتيجيتك
- ركز على ROI: كل قرار يجب أن يكون مبرراً بالعائد المتوقع

أجب دائماً بصيغة JSON مع خطة عمل واضحة.`;

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const apiKey = await getAnthropicKey();
    const anthropic = new Anthropic({ apiKey });

    const body = await req.json();
    const { action, data } = body;

    let prompt = "";

    switch (action) {
      case "daily_check":
        prompt = `قم بالفحص اليومي الشامل:

بيانات العملاء والحملات:
${JSON.stringify(data.campaigns, null, 2)}

بيانات المحتوى المنشور:
${JSON.stringify(data.content, null, 2)}

بيانات المنصات:
${JSON.stringify(data.platformStats, null, 2)}

أجب بالقرارات والإجراءات المطلوبة:
{
  "urgent_actions": [
    {"type": "نوع الإجراء", "target": "الهدف", "action": "ما يجب فعله", "reason": "السبب", "auto_execute": true/false}
  ],
  "optimization_suggestions": [
    {"area": "المجال", "suggestion": "الاقتراح", "expected_impact": "الأثر المتوقع", "priority": "high/medium/low"}
  ],
  "content_ideas": [
    {"platform": "المنصة", "type": "نوع المحتوى", "topic": "الموضوع", "rationale": "المبرر"}
  ],
  "budget_reallocation": [
    {"from": "من", "to": "إلى", "amount": "المبلغ", "reason": "السبب"}
  ],
  "daily_summary": "ملخص اليوم",
  "health_score": "من 100"
}`;
        break;

      case "generate_monthly_strategy":
        prompt = `بناءً على أداء الشهر الماضي، أنشئ استراتيجية الشهر القادم:

بيانات الشهر الماضي:
${JSON.stringify(data.lastMonthPerformance, null, 2)}

معلومات العملاء:
${JSON.stringify(data.clients, null, 2)}

الميزانيات:
${JSON.stringify(data.budgets, null, 2)}

أجب باستراتيجية شاملة:
{
  "strategy_changes": ["تغيير 1", "تغيير 2"],
  "new_experiments": ["تجربة 1"],
  "platforms_to_add": ["منصة جديدة مقترحة"],
  "platforms_to_reduce": ["منصة تحتاج تقليل"],
  "content_direction": "توجه المحتوى",
  "budget_strategy": "استراتيجية الميزانية",
  "per_client_plan": [
    {"client": "الاسم", "focus": "التركيز", "changes": ["التغييرات"]}
  ]
}`;
        break;

      case "competitor_analysis":
        prompt = `حلل المنافسين لهذا العميل:

معلومات العميل:
${JSON.stringify(data.client, null, 2)}

المنافسون المعروفون:
${JSON.stringify(data.competitors, null, 2)}

أجب بتحليل شامل:
{
  "competitor_insights": [
    {"competitor": "الاسم", "strengths": ["نقاط قوة"], "weaknesses": ["نقاط ضعف"], "content_strategy": "استراتيجيتهم"}
  ],
  "opportunities": ["فرصة 1"],
  "threats": ["تهديد 1"],
  "recommended_actions": ["إجراء 1"],
  "content_gaps": ["فجوة 1"]
}`;
        break;

      case "self_improve":
        prompt = `راجع أداءك كنظام ذكاء اصطناعي للتسويق الرقمي:

القرارات التي اتخذتها سابقاً ونتائجها:
${JSON.stringify(data.previousDecisions, null, 2)}

هل هناك أنماط ناجحة يجب تكرارها؟
هل هناك أخطاء يجب تجنبها؟
ما الاستراتيجيات الجديدة التي يجب تجربتها؟

أجب:
{
  "successful_patterns": ["نمط ناجح 1"],
  "mistakes_to_avoid": ["خطأ 1"],
  "new_strategies": ["استراتيجية جديدة 1"],
  "skills_to_update": ["مهارة تحتاج تحديث"],
  "market_trends": ["توجه سوقي جديد"],
  "updated_rules": [
    {"rule": "القاعدة", "old_value": "القيمة القديمة", "new_value": "القيمة الجديدة", "reason": "السبب"}
  ]
}`;
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Unknown action" },
          { status: 400 }
        );
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: AUTO_MANAGER_SYSTEM,
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

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      action,
      result,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });
  } catch (error: any) {
    console.error("Auto Manager Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Auto manager failed" },
      { status: 500 }
    );
  }
}
