import type { SocialPlatform } from "../types";

export const PLATFORM_LABELS: Record<SocialPlatform, { en: string; ar: string }> = {
  facebook: { en: "Facebook", ar: "فيسبوك" },
  instagram: { en: "Instagram", ar: "إنستغرام" },
  tiktok: { en: "TikTok", ar: "تيك توك" },
  snapchat: { en: "Snapchat", ar: "سناب شات" },
  x: { en: "X (Twitter)", ar: "إكس (تويتر)" },
  linkedin: { en: "LinkedIn", ar: "لينكدإن" },
  youtube: { en: "YouTube", ar: "يوتيوب" },
};

export const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  tiktok: "#000000",
  snapchat: "#FFFC00",
  x: "#000000",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
};

export const INDUSTRIES = [
  { value: "restaurant", label_ar: "مطاعم ومقاهي", label_en: "Restaurants & Cafés" },
  { value: "ecommerce", label_ar: "تجارة إلكترونية", label_en: "E-commerce" },
  { value: "real_estate", label_ar: "عقارات", label_en: "Real Estate" },
  { value: "healthcare", label_ar: "صحة وطب", label_en: "Healthcare" },
  { value: "education", label_ar: "تعليم وتدريب", label_en: "Education" },
  { value: "fashion", label_ar: "أزياء وجمال", label_en: "Fashion & Beauty" },
  { value: "automotive", label_ar: "سيارات", label_en: "Automotive" },
  { value: "tourism", label_ar: "سياحة وسفر", label_en: "Tourism & Travel" },
  { value: "technology", label_ar: "تكنولوجيا", label_en: "Technology" },
  { value: "finance", label_ar: "مالية وبنوك", label_en: "Finance & Banking" },
  { value: "construction", label_ar: "مقاولات وبناء", label_en: "Construction" },
  { value: "retail", label_ar: "تجزئة", label_en: "Retail" },
  { value: "services", label_ar: "خدمات", label_en: "Services" },
  { value: "other", label_ar: "أخرى", label_en: "Other" },
] as const;

export const COUNTRIES = [
  { code: "SA", name_ar: "السعودية", name_en: "Saudi Arabia", currency: "SAR" },
  { code: "AE", name_ar: "الإمارات", name_en: "UAE", currency: "AED" },
  { code: "EG", name_ar: "مصر", name_en: "Egypt", currency: "EGP" },
  { code: "JO", name_ar: "الأردن", name_en: "Jordan", currency: "JOD" },
  { code: "PS", name_ar: "فلسطين", name_en: "Palestine", currency: "ILS" },
  { code: "IQ", name_ar: "العراق", name_en: "Iraq", currency: "IQD" },
  { code: "KW", name_ar: "الكويت", name_en: "Kuwait", currency: "KWD" },
  { code: "BH", name_ar: "البحرين", name_en: "Bahrain", currency: "BHD" },
  { code: "QA", name_ar: "قطر", name_en: "Qatar", currency: "QAR" },
  { code: "OM", name_ar: "عمان", name_en: "Oman", currency: "OMR" },
  { code: "LB", name_ar: "لبنان", name_en: "Lebanon", currency: "LBP" },
  { code: "SY", name_ar: "سوريا", name_en: "Syria", currency: "SYP" },
  { code: "LY", name_ar: "ليبيا", name_en: "Libya", currency: "LYD" },
  { code: "MA", name_ar: "المغرب", name_en: "Morocco", currency: "MAD" },
  { code: "TN", name_ar: "تونس", name_en: "Tunisia", currency: "TND" },
  { code: "DZ", name_ar: "الجزائر", name_en: "Algeria", currency: "DZD" },
  { code: "SD", name_ar: "السودان", name_en: "Sudan", currency: "SDG" },
  { code: "YE", name_ar: "اليمن", name_en: "Yemen", currency: "YER" },
] as const;

export const PACKAGE_TYPES = [
  {
    value: "basic",
    label_ar: "أساسي",
    label_en: "Basic",
    platforms: 2,
    posts_per_month: 15,
    campaigns: 2,
    reports: "basic",
  },
  {
    value: "pro",
    label_ar: "احترافي",
    label_en: "Professional",
    platforms: 4,
    posts_per_month: 30,
    campaigns: 5,
    reports: "detailed",
  },
  {
    value: "enterprise",
    label_ar: "متقدم",
    label_en: "Enterprise",
    platforms: 7,
    posts_per_month: 60,
    campaigns: 10,
    reports: "comprehensive",
  },
] as const;
