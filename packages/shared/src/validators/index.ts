import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(2, "اسم الشركة مطلوب"),
  name_en: z.string().optional(),
  industry: z.string().min(1, "المجال مطلوب"),
  country: z.string().min(2, "الدولة مطلوبة"),
  city: z.string().min(2, "المدينة مطلوبة"),
  website: z.string().url("رابط غير صحيح").optional().or(z.literal("")),
  description: z.string().optional(),
  target_audience: z.string().optional(),
  monthly_budget: z.number().min(0, "الميزانية يجب أن تكون أكبر من صفر"),
  package_type: z.enum(["basic", "pro", "enterprise"]),
  contract_start_date: z.string().min(1, "تاريخ بداية العقد مطلوب"),
  contract_end_date: z.string().optional(),
});

export const createContentSchema = z.object({
  company_id: z.string().uuid(),
  plan_id: z.string().uuid().optional(),
  platform: z.enum(["facebook", "instagram", "tiktok", "snapchat", "x", "linkedin", "youtube"]),
  scheduled_date: z.string().min(1, "تاريخ النشر مطلوب"),
  scheduled_time: z.string().min(1, "وقت النشر مطلوب"),
  content_type: z.enum(["post", "story", "reel", "video", "carousel", "article"]),
  text_content: z.string().min(1, "المحتوى مطلوب"),
  media_urls: z.array(z.string().url()).optional().default([]),
  hashtags: z.array(z.string()).optional().default([]),
});

export const createCampaignSchema = z.object({
  company_id: z.string().uuid(),
  plan_id: z.string().uuid().optional(),
  platform: z.enum(["facebook", "instagram", "tiktok", "snapchat", "x", "linkedin", "youtube"]),
  name: z.string().min(2, "اسم الحملة مطلوب"),
  objective: z.enum(["awareness", "traffic", "engagement", "leads", "sales"]),
  daily_budget: z.number().min(1, "الميزانية اليومية مطلوبة"),
  total_budget: z.number().min(1, "إجمالي الميزانية مطلوب"),
  start_date: z.string().min(1, "تاريخ البداية مطلوب"),
  end_date: z.string().optional(),
  target_audience: z.object({
    age_min: z.number().min(13).max(65).optional(),
    age_max: z.number().min(13).max(65).optional(),
    genders: z.array(z.enum(["male", "female", "all"])).optional(),
    countries: z.array(z.string()).optional(),
    cities: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
  }),
  auto_optimize: z.boolean().default(true),
});

export const generatePlanSchema = z.object({
  company_id: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "التاريخ يجب أن يكون بصيغة YYYY-MM-DD"),
  goals: z.array(z.string()).min(1, "يجب تحديد هدف واحد على الأقل"),
  platforms: z.array(
    z.enum(["facebook", "instagram", "tiktok", "snapchat", "x", "linkedin", "youtube"])
  ).min(1, "يجب اختيار منصة واحدة على الأقل"),
  budget: z.number().min(0),
  notes: z.string().optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type CreateContentInput = z.infer<typeof createContentSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;
