export const REPORT_ANALYZER_SYSTEM_PROMPT = `أنت محلل بيانات تسويق رقمي محترف.
مهمتك تحليل أداء الحملات التسويقية وتقديم تقارير شاملة مع توصيات ذكية.

القواعد:
1. حلل البيانات بموضوعية
2. قارن مع المعايير المعتمدة في الصناعة
3. قدم توصيات عملية وقابلة للتنفيذ
4. اذكر نقاط القوة والضعف بوضوح
5. اقترح تحسينات محددة للشهر القادم`;

export function buildReportPrompt(params: {
  companyName: string;
  industry: string;
  month: string;
  platformData: Record<string, unknown>;
  campaignData: Record<string, unknown>[];
  contentData: Record<string, unknown>[];
  budgetData: { planned: number; spent: number; byPlatform: Record<string, number> };
  kpiTargets: Record<string, { target: number; actual: number }>;
  previousMonthData?: Record<string, unknown>;
}): string {
  return `حلل أداء التسويق الرقمي للشهر وأنشئ تقريراً شاملاً:

**المنشأة:** ${params.companyName} (${params.industry})
**الشهر:** ${params.month}

**بيانات المنصات:**
${JSON.stringify(params.platformData, null, 2)}

**بيانات الحملات:**
${JSON.stringify(params.campaignData, null, 2)}

**بيانات المحتوى:**
${JSON.stringify(params.contentData, null, 2)}

**الميزانية:**
- المخطط: $${params.budgetData.planned}
- المنفق: $${params.budgetData.spent}
- التوزيع: ${JSON.stringify(params.budgetData.byPlatform)}

**مؤشرات الأداء (الهدف vs الفعلي):**
${Object.entries(params.kpiTargets).map(([k, v]) => `- ${k}: ${v.actual}/${v.target}`).join("\n")}

${params.previousMonthData ? `**بيانات الشهر السابق للمقارنة:**\n${JSON.stringify(params.previousMonthData, null, 2)}` : ""}

أجب بصيغة JSON:
{
  "executive_summary": "ملخص تنفيذي (3-5 جمل)",
  "overall_score": "تقييم عام من 10",
  "achievements": ["إنجاز 1", "إنجاز 2"],
  "challenges": ["تحدي 1", "تحدي 2"],
  "platform_analysis": {
    "platform_name": {
      "performance_score": "من 10",
      "highlights": ["نقطة قوة"],
      "improvements_needed": ["نقطة ضعف"],
      "key_metrics": {}
    }
  },
  "campaign_analysis": [
    {
      "name": "اسم الحملة",
      "verdict": "ناجحة/متوسطة/ضعيفة",
      "roi": "العائد",
      "insights": "التحليل"
    }
  ],
  "content_insights": {
    "best_performing_type": "نوع المحتوى الأفضل",
    "best_posting_times": ["أفضل الأوقات"],
    "engagement_trends": "توجهات التفاعل"
  },
  "budget_analysis": {
    "efficiency_score": "من 10",
    "recommendations": ["توصية 1"]
  },
  "ai_recommendations": [
    {
      "priority": "عالية/متوسطة/منخفضة",
      "recommendation": "التوصية",
      "expected_impact": "الأثر المتوقع",
      "implementation": "كيفية التنفيذ"
    }
  ],
  "next_month_focus": ["أولوية 1", "أولوية 2", "أولوية 3"]
}`;
}
