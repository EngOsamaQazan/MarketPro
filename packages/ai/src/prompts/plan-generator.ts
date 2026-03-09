export const PLAN_GENERATOR_SYSTEM_PROMPT = `أنت خبير تسويق رقمي متخصص في الأسواق العربية والشرق الأوسط.
مهمتك بناء خطط تسويق رقمي شهرية احترافية ومفصلة للعملاء.

القواعد:
1. اكتب بالعربية الفصحى المبسطة
2. كن عملياً ومحدداً - لا تعميمات
3. وزع الميزانية بذكاء حسب المنصات الأنسب
4. ضع أهداف SMART قابلة للقياس
5. راعِ الخصوصيات الثقافية والدينية للمنطقة المستهدفة
6. اقترح أنواع محتوى مناسبة لكل منصة
7. حدد KPIs واضحة مع أرقام مستهدفة واقعية

أجب دائماً بصيغة JSON المحددة.`;

export function buildPlanPrompt(params: {
  companyName: string;
  industry: string;
  country: string;
  city: string;
  targetAudience: string;
  monthlyBudget: number;
  platforms: string[];
  goals: string[];
  currentFollowers?: Record<string, number>;
  previousMonthData?: Record<string, unknown>;
  notes?: string;
}): string {
  return `أنشئ خطة تسويق رقمي شهرية للمنشأة التالية:

**معلومات المنشأة:**
- الاسم: ${params.companyName}
- المجال: ${params.industry}
- الدولة: ${params.country} - ${params.city}
- الجمهور المستهدف: ${params.targetAudience}
- الميزانية الشهرية: $${params.monthlyBudget}

**المنصات المطلوبة:** ${params.platforms.join(", ")}

**الأهداف:** 
${params.goals.map((g, i) => `${i + 1}. ${g}`).join("\n")}

${params.currentFollowers ? `**المتابعين الحاليين:**\n${Object.entries(params.currentFollowers).map(([p, c]) => `- ${p}: ${c}`).join("\n")}` : ""}

${params.previousMonthData ? `**بيانات الشهر السابق:** ${JSON.stringify(params.previousMonthData)}` : ""}

${params.notes ? `**ملاحظات إضافية:** ${params.notes}` : ""}

أجب بصيغة JSON التالية:
{
  "title": "عنوان الخطة",
  "executive_summary": "ملخص تنفيذي (3-5 جمل)",
  "objectives": [
    {
      "goal": "الهدف",
      "metric": "مؤشر القياس",
      "target_value": "القيمة المستهدفة",
      "current_value": "القيمة الحالية"
    }
  ],
  "platform_strategy": {
    "platform_name": {
      "why": "سبب اختيار هذه المنصة",
      "content_types": ["أنواع المحتوى"],
      "posting_frequency": "عدد المنشورات أسبوعياً",
      "best_times": ["أفضل أوقات النشر"],
      "budget_allocation": "نسبة الميزانية %"
    }
  },
  "content_calendar": [
    {
      "week": 1,
      "posts": [
        {
          "day": "الأحد",
          "platform": "instagram",
          "type": "reel",
          "topic": "موضوع المنشور",
          "description": "وصف مختصر للمحتوى"
        }
      ]
    }
  ],
  "ad_campaigns": [
    {
      "name": "اسم الحملة",
      "platform": "المنصة",
      "objective": "الهدف",
      "budget": "الميزانية",
      "duration_days": "المدة بالأيام",
      "target_audience": {
        "age": "الفئة العمرية",
        "gender": "الجنس",
        "interests": ["الاهتمامات"],
        "locations": ["المواقع"]
      },
      "expected_results": {
        "reach": "الوصول المتوقع",
        "clicks": "النقرات المتوقعة",
        "cpa": "التكلفة المتوقعة لكل نتيجة"
      }
    }
  ],
  "budget_breakdown": {
    "advertising": { "amount": 0, "percentage": 0 },
    "content_production": { "amount": 0, "percentage": 0 },
    "tools": { "amount": 0, "percentage": 0 },
    "reserve": { "amount": 0, "percentage": 0 }
  },
  "kpis": [
    {
      "name": "اسم المؤشر",
      "target": "القيمة المستهدفة",
      "measurement": "طريقة القياس"
    }
  ],
  "risks_and_mitigations": [
    {
      "risk": "المخاطرة",
      "mitigation": "الحل"
    }
  ]
}`;
}
