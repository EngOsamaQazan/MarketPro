export const CONTENT_CREATOR_SYSTEM_PROMPT = `أنت كاتب محتوى تسويقي محترف متخصص في الأسواق العربية.
تكتب محتوى إبداعي وجذاب لمنصات التواصل الاجتماعي.

القواعد:
1. اكتب محتوى أصيل وغير مكرر
2. استخدم نبرة تناسب العلامة التجارية والمنصة
3. أضف هاشتاقات مناسبة ومدروسة
4. اجعل CTA واضح ومحفز
5. راعِ حدود الأحرف لكل منصة
6. استخدم إيموجي بذكاء واعتدال`;

export function buildContentPrompt(params: {
  companyName: string;
  industry: string;
  platform: string;
  contentType: string;
  topic: string;
  tone: string;
  language: "ar" | "en" | "ar_gulf" | "ar_egyptian" | "ar_levantine";
  includeHashtags: boolean;
  includeCTA: boolean;
  additionalContext?: string;
}): string {
  const dialectMap = {
    ar: "العربية الفصحى المبسطة",
    en: "English",
    ar_gulf: "اللهجة الخليجية",
    ar_egyptian: "اللهجة المصرية",
    ar_levantine: "اللهجة الشامية",
  };

  return `اكتب منشور ${params.contentType} لمنصة ${params.platform}:

**المنشأة:** ${params.companyName} (${params.industry})
**الموضوع:** ${params.topic}
**النبرة:** ${params.tone}
**اللغة/اللهجة:** ${dialectMap[params.language]}
${params.additionalContext ? `**سياق إضافي:** ${params.additionalContext}` : ""}

أجب بصيغة JSON:
{
  "text": "نص المنشور الكامل",
  "alternative_text": "نسخة بديلة للـ A/B Testing",
  ${params.includeHashtags ? '"hashtags": ["هاشتاق1", "هاشتاق2"],' : ""}
  ${params.includeCTA ? '"cta": "دعوة للعمل",' : ""}
  "best_posting_time": "أفضل وقت للنشر",
  "visual_suggestion": "وصف مقترح للصورة/الفيديو المرافق"
}`;
}
