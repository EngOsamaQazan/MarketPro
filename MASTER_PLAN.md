# MarketPro - نظام إدارة التسويق الرقمي الذكي
## الخطة التنفيذية الشاملة

---

## 1. الرؤية العامة

**MarketPro** هو نظام متكامل لإدارة التسويق الرقمي يعتمد على الذكاء الاصطناعي (Claude AI) لتقديم خدمات تسويقية احترافية للعملاء. النظام يشمل:

- **لوحة تحكم إدارية** (Admin Dashboard) لفريق الشركة
- **تطبيق العميل** (Client App) على iOS + Android + Web
- **محرك ذكاء اصطناعي** لتوليد الخطط والتقارير والمحتوى
- **نظام ربط** مع جميع منصات التواصل الاجتماعي

---

## 2. الهيكل التقني (Tech Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATIONS                      │
├─────────────────────┬───────────────────────────────────────┤
│  Admin Dashboard    │  Client App (Mobile + Web)            │
│  Next.js 15        │  Expo Router (React Native)           │
│  (شركتك فقط)       │  iOS + Android + Web                  │
│  TailwindCSS       │  (للعملاء - Google Play & App Store)  │
└─────────┬───────────┴──────────────────┬────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                          │
├─────────────────────────────────────────────────────────────┤
│  🔐 Auth (JWT + RLS)     │  📊 Realtime Subscriptions      │
│  🗄️ PostgreSQL Database  │  📁 Storage (Media/PDFs)        │
│  ⚡ Edge Functions       │  🔗 Webhooks                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌──────────────────┐   ┌──────────────────────────────────────┐
│  AI ENGINE       │   │  SOCIAL MEDIA INTEGRATIONS           │
│  Claude API      │   ├──────────────────────────────────────┤
├──────────────────┤   │  Meta (Facebook + Instagram)  API v24│
│ • خطط تسويق     │   │  TikTok Content Posting API          │
│ • محتوى إبداعي  │   │  X (Twitter) API v2                  │
│ • تحليل أداء    │   │  Snapchat Marketing API              │
│ • تقارير PDF    │   │  LinkedIn Marketing API              │
│ • تحسين حملات   │   │  YouTube Data API v3                 │
│ • توصيات ذكية   │   │  Google Ads API                      │
└──────────────────┘   └──────────────────────────────────────┘
```

---

## 3. المنصات المدعومة وترتيبها حسب المنطقة

### إحصائيات 2026 - الشرق الأوسط

| الدولة       | الانتشار | المنصة #1    | المنصة #2    | المنصة #3 | المنصة #4 |
|-------------|---------|-------------|-------------|----------|----------|
| السعودية    | 99.6%   | WhatsApp    | Instagram   | Snapchat | TikTok   |
| الإمارات    | 100.3%  | WhatsApp    | Instagram   | Facebook | TikTok   |
| مصر         | 43.4%   | Facebook    | WhatsApp    | Instagram| TikTok   |
| العراق      | 84.9%   | Facebook    | Instagram   | TikTok   | Snapchat |
| الأردن      | 87%     | Facebook    | Instagram   | WhatsApp | TikTok   |
| فلسطين      | 73%     | Facebook    | Instagram   | TikTok   | WhatsApp |

> النظام سيجلب هذه الإحصائيات تلقائياً من DataReportal و We Are Social APIs

### المنصات التي سيدعمها النظام (بالترتيب)

1. **Meta (Facebook + Instagram)** — الأكثر استخداماً عربياً
2. **TikTok** — النمو الأسرع في المنطقة
3. **Snapchat** — مهم جداً في الخليج
4. **X (Twitter)** — مهم للأعمال والرأي العام
5. **LinkedIn** — B2B والتوظيف
6. **YouTube** — الفيديو الطويل
7. **Google Ads** — إعلانات البحث

---

## 4. وحدات النظام (System Modules)

### الوحدة 1: إدارة العملاء (Client Management)
```
├── إضافة/تعديل/أرشفة عملاء
├── معلومات المنشأة (الاسم، المجال، الموقع، الجمهور المستهدف)
├── ربط حسابات التواصل الاجتماعي لكل عميل
├── تحديد الباقة والميزانية الشهرية
├── سجل العمليات والتواصل مع العميل
└── لوحة حالة العميل (نشط/متوقف/منتهي)
```

### الوحدة 2: مولد الخطط التسويقية (AI Marketing Plan Generator)
```
├── تحليل المنشأة والجمهور المستهدف
├── دراسة المنافسين تلقائياً
├── تحديد المنصات الأنسب بناءً على:
│   ├── نوع العمل (B2B / B2C / خدمات / تجزئة)
│   ├── الدولة والمنطقة المستهدفة
│   ├── الميزانية المتاحة
│   └── أحدث إحصائيات المنصات
├── توليد خطة شهرية تشمل:
│   ├── الأهداف الشهرية (SMART Goals)
│   ├── تقويم المحتوى (Content Calendar)
│   ├── خطة الإعلانات المدفوعة
│   ├── استراتيجية الجمهور المستهدف
│   ├── KPIs ومؤشرات القياس
│   └── الميزانية الموزعة على المنصات
├── تصدير الخطة كملف PDF احترافي
└── إرسال الخطة للعميل عبر التطبيق + البريد
```

### الوحدة 3: إدارة المحتوى (Content Management)
```
├── تقويم محتوى تفاعلي (Calendar View)
├── إنشاء منشورات بالذكاء الاصطناعي
│   ├── توليد نص المنشور (عربي/إنجليزي)
│   ├── اقتراح هاشتاقات مناسبة
│   ├── اقتراح أفضل وقت للنشر
│   └── توليد أفكار محتوى شهرية
├── جدولة النشر على جميع المنصات
├── مكتبة الوسائط (صور/فيديو/تصاميم)
├── نظام موافقات (العميل يوافق قبل النشر)
└── نشر تلقائي أو يدوي
```

### الوحدة 4: إدارة الحملات الإعلانية (Campaign Management)
```
├── إنشاء حملات على:
│   ├── Meta Ads (Facebook + Instagram)
│   ├── TikTok Ads
│   ├── Snapchat Ads
│   ├── Google Ads
│   └── X Ads
├── تحسين تلقائي بالذكاء الاصطناعي:
│   ├── إيقاف الإعلانات ذات الأداء الضعيف
│   ├── زيادة ميزانية الإعلانات الناجحة
│   ├── A/B Testing تلقائي للنصوص والصور
│   ├── تحسين الجمهور المستهدف
│   └── تقارير أداء لحظية
├── تنبيهات ذكية:
│   ├── تجاوز الميزانية
│   ├── انخفاض حاد في الأداء
│   ├── فرص تحسين مكتشفة
│   └── حملات تحتاج تدخل
└── سجل كامل لجميع الحملات والنتائج
```

### الوحدة 5: التقارير والتحليلات (Reports & Analytics)
```
├── لوحة تحكم لحظية (Real-time Dashboard)
│   ├── إجمالي الوصول (Reach)
│   ├── التفاعل (Engagement)
│   ├── المتابعين الجدد
│   ├── أداء الإعلانات (ROAS, CPA, CTR)
│   └── مقارنة مع الشهر السابق
├── تقرير شهري تلقائي (PDF):
│   ├── ملخص تنفيذي
│   ├── إنجازات الشهر
│   ├── إحصائيات مفصلة بالرسوم البيانية
│   ├── أداء كل منصة
│   ├── أداء الحملات الإعلانية
│   ├── ROI وتحليل الميزانية
│   ├── مقارنة مع الأهداف المحددة
│   ├── توصيات للشهر القادم
│   └── خطة الشهر القادم المقترحة
├── تقارير مخصصة (حسب الطلب)
└── تصدير البيانات (PDF / Excel / CSV)
```

### الوحدة 6: بوابة العميل (Client Portal - Mobile App)
```
├── تسجيل دخول آمن
├── الصفحة الرئيسية:
│   ├── ملخص سريع للأداء
│   ├── آخر المنشورات والتفاعلات
│   └── إشعارات مهمة
├── خطة التسويق الشهرية:
│   ├── عرض الخطة كاملة
│   ├── تقدم التنفيذ (Progress Bar)
│   ├── المهام المنجزة vs المتبقية
│   └── تحميل الخطة PDF
├── التقارير:
│   ├── تقرير الشهر الحالي (لحظي)
│   ├── أرشيف التقارير السابقة
│   └── تحميل التقارير PDF
├── الموافقات:
│   ├── محتوى ينتظر الموافقة
│   ├── حملات تحتاج موافقة
│   └── سجل الموافقات
├── التواصل:
│   ├── محادثة مباشرة مع فريق التسويق
│   ├── طلب تعديلات
│   └── ملاحظات واقتراحات
└── الإعدادات:
    ├── معلومات المنشأة
    ├── تفضيلات الإشعارات
    └── إدارة الصلاحيات
```

### الوحدة 7: الإحصائيات الإقليمية (Regional Intelligence)
```
├── جلب أحدث إحصائيات المنصات حسب الدولة
├── تحديث تلقائي (شهري/ربع سنوي)
├── مصادر البيانات:
│   ├── DataReportal
│   ├── We Are Social
│   ├── Statista
│   └── Social media platform insights
├── توصيات ذكية:
│   ├── أفضل منصة لكل دولة/مجال
│   ├── أوقات الذروة حسب المنطقة
│   ├── توجهات (Trends) حالية
│   └── فرص تسويقية جديدة
└── تحديث الاستراتيجيات بناءً على التغييرات
```

---

## 5. قاعدة البيانات (Database Schema)

### الجداول الرئيسية

```sql
-- المستخدمون (فريق الشركة + العملاء)
profiles
├── id (uuid, PK)
├── email
├── full_name
├── avatar_url
├── role (admin | manager | client)
├── phone
├── company_id (FK → companies)
└── created_at

-- الشركات/المنشآت (العملاء)
companies
├── id (uuid, PK)
├── name
├── name_en
├── industry (المجال)
├── country
├── city
├── website
├── logo_url
├── description
├── target_audience
├── monthly_budget
├── package_type (basic | pro | enterprise)
├── status (active | paused | ended)
├── assigned_manager_id (FK → profiles)
├── contract_start_date
├── contract_end_date
└── created_at

-- حسابات التواصل الاجتماعي
social_accounts
├── id (uuid, PK)
├── company_id (FK → companies)
├── platform (facebook | instagram | tiktok | snapchat | x | linkedin | youtube)
├── account_id (platform-specific)
├── account_name
├── access_token (encrypted)
├── refresh_token (encrypted)
├── token_expires_at
├── permissions[]
├── followers_count
├── is_connected
└── last_synced_at

-- خطط التسويق
marketing_plans
├── id (uuid, PK)
├── company_id (FK → companies)
├── month (date - أول يوم بالشهر)
├── title
├── status (draft | pending_approval | approved | in_progress | completed)
├── objectives[] (الأهداف)
├── target_platforms[]
├── total_budget
├── budget_breakdown (jsonb - توزيع الميزانية)
├── kpis (jsonb - مؤشرات القياس)
├── ai_analysis (jsonb - تحليل AI)
├── pdf_url (رابط ملف PDF)
├── approved_by (FK → profiles)
├── approved_at
├── created_by (FK → profiles)
└── created_at

-- تقويم المحتوى
content_calendar
├── id (uuid, PK)
├── company_id (FK → companies)
├── plan_id (FK → marketing_plans)
├── platform
├── scheduled_date
├── scheduled_time
├── content_type (post | story | reel | video | carousel | article)
├── text_content
├── media_urls[]
├── hashtags[]
├── status (draft | pending_approval | approved | scheduled | published | failed)
├── approval_status (pending | approved | rejected)
├── approval_note
├── published_post_id (ID من المنصة بعد النشر)
├── engagement_data (jsonb)
├── ai_generated (boolean)
├── created_by (FK → profiles)
└── created_at

-- الحملات الإعلانية
ad_campaigns
├── id (uuid, PK)
├── company_id (FK → companies)
├── plan_id (FK → marketing_plans)
├── platform
├── platform_campaign_id
├── name
├── objective (awareness | traffic | engagement | leads | sales)
├── status (draft | active | paused | completed | failed)
├── daily_budget
├── total_budget
├── spent_amount
├── start_date
├── end_date
├── target_audience (jsonb)
├── performance_data (jsonb - reach, impressions, clicks, ctr, cpa, roas)
├── ai_optimizations[] (jsonb - سجل التحسينات)
├── auto_optimize (boolean)
├── created_by (FK → profiles)
└── created_at

-- الإعلانات الفردية
ads
├── id (uuid, PK)
├── campaign_id (FK → ad_campaigns)
├── platform_ad_id
├── name
├── ad_type (image | video | carousel | collection)
├── headline
├── body_text
├── call_to_action
├── media_urls[]
├── landing_url
├── status (active | paused | rejected)
├── performance_data (jsonb)
├── ab_test_variant (A | B | C)
└── created_at

-- التقارير الشهرية
monthly_reports
├── id (uuid, PK)
├── company_id (FK → companies)
├── plan_id (FK → marketing_plans)
├── month (date)
├── report_data (jsonb - البيانات الكاملة)
│   ├── summary (ملخص تنفيذي)
│   ├── achievements[]
│   ├── platform_stats{}
│   ├── campaign_results[]
│   ├── content_performance[]
│   ├── budget_analysis{}
│   ├── kpi_results{}
│   ├── comparison_with_previous{}
│   ├── ai_insights[]
│   └── next_month_recommendations[]
├── pdf_url
├── status (generating | ready | sent)
├── sent_at
├── viewed_by_client (boolean)
└── created_at

-- الإشعارات
notifications
├── id (uuid, PK)
├── user_id (FK → profiles)
├── company_id (FK → companies)
├── type (plan_ready | report_ready | approval_needed | alert | message)
├── title
├── body
├── data (jsonb)
├── is_read (boolean)
├── action_url
└── created_at

-- المحادثات
conversations
├── id (uuid, PK)
├── company_id (FK → companies)
├── messages[] (jsonb)
│   ├── sender_id
│   ├── content
│   ├── attachments[]
│   └── sent_at
├── last_message_at
└── created_at

-- إحصائيات المنصات حسب الدولة
platform_statistics
├── id (uuid, PK)
├── country_code
├── country_name
├── platform
├── users_count
├── penetration_rate
├── rank_in_country
├── peak_hours[] (أوقات الذروة)
├── demographics (jsonb)
├── source
├── report_date
└── updated_at

-- سجل عمليات AI
ai_activity_log
├── id (uuid, PK)
├── company_id (FK → companies)
├── action_type (plan_generated | content_created | campaign_optimized | report_generated)
├── input_data (jsonb)
├── output_data (jsonb)
├── model_used
├── tokens_used
├── cost_usd
└── created_at
```

---

## 6. الـ Tech Stack التفصيلي

### Frontend - Admin Dashboard (شركتك)
| التقنية | الاستخدام |
|---------|----------|
| **Next.js 15** | App Router, Server Components, API Routes |
| **TypeScript** | Type safety across the project |
| **TailwindCSS 4** | Styling |
| **shadcn/ui** | UI Components |
| **Recharts** | Charts & Graphs |
| **React Big Calendar** | Content Calendar |
| **React DnD** | Drag & Drop |
| **Zustand** | State Management |
| **React Hook Form + Zod** | Forms & Validation |

### Frontend - Client App (تطبيق العميل)
| التقنية | الاستخدام |
|---------|----------|
| **Expo SDK 52+** | React Native Framework |
| **Expo Router** | File-based routing (Web + Mobile) |
| **NativeWind** | TailwindCSS for React Native |
| **React Native Reanimated** | Animations |
| **React Native Chart Kit** | Charts |
| **Expo Notifications** | Push Notifications |
| **EAS Build** | Build for iOS & Android |
| **EAS Submit** | Submit to App Store & Google Play |

### Backend
| التقنية | الاستخدام |
|---------|----------|
| **Supabase** | Auth, Database, Storage, Realtime, Edge Functions |
| **PostgreSQL** | Database (via Supabase) |
| **Supabase Edge Functions** | Deno-based serverless functions |
| **Supabase RLS** | Row Level Security for multi-tenancy |
| **Supabase Storage** | Media files, PDFs, assets |
| **Supabase Realtime** | Live updates for client app |

### AI & Integrations
| التقنية | الاستخدام |
|---------|----------|
| **Anthropic Claude API** | AI Engine (خطط، محتوى، تحليل، تقارير) |
| **Meta Marketing API v24** | Facebook + Instagram Ads |
| **Meta Graph API v24** | Facebook + Instagram Pages |
| **TikTok Content Posting API** | TikTok Management |
| **Snapchat Marketing API** | Snapchat Ads |
| **X API v2** | Twitter/X Management |
| **LinkedIn Marketing API** | LinkedIn Management |
| **YouTube Data API v3** | YouTube Management |
| **Google Ads API** | Google Ads Management |

### PDF Generation
| التقنية | الاستخدام |
|---------|----------|
| **@react-pdf/renderer** | PDF generation with React components |
| **Custom templates** | قوالب عربية احترافية للخطط والتقارير |

### DevOps & Deployment
| التقنية | الاستخدام |
|---------|----------|
| **Vercel** | Admin Dashboard hosting |
| **EAS** | Mobile app builds & distribution |
| **GitHub Actions** | CI/CD pipeline |
| **Sentry** | Error tracking |
| **PostHog** | Analytics |

---

## 7. هيكل المشروع (Project Structure)

```
Sales/
├── apps/
│   ├── admin/                    # Next.js Admin Dashboard
│   │   ├── app/
│   │   │   ├── (auth)/           # صفحات تسجيل الدخول
│   │   │   ├── (dashboard)/      # اللوحة الرئيسية
│   │   │   │   ├── clients/      # إدارة العملاء
│   │   │   │   ├── plans/        # خطط التسويق
│   │   │   │   ├── content/      # إدارة المحتوى
│   │   │   │   ├── campaigns/    # الحملات الإعلانية
│   │   │   │   ├── reports/      # التقارير
│   │   │   │   ├── analytics/    # التحليلات
│   │   │   │   └── settings/     # الإعدادات
│   │   │   └── api/              # API Routes
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   │
│   └── client/                   # Expo Client App
│       ├── app/
│       │   ├── (auth)/           # تسجيل دخول العميل
│       │   ├── (tabs)/
│       │   │   ├── home/         # الرئيسية
│       │   │   ├── plan/         # خطة التسويق
│       │   │   ├── reports/      # التقارير
│       │   │   ├── approvals/    # الموافقات
│       │   │   └── chat/         # التواصل
│       │   └── settings/
│       ├── components/
│       ├── lib/
│       └── package.json
│
├── packages/
│   ├── shared/                   # Shared code between apps
│   │   ├── types/                # TypeScript types
│   │   ├── utils/                # Utility functions
│   │   ├── constants/            # Constants & enums
│   │   └── validators/           # Zod schemas
│   │
│   ├── supabase/                 # Supabase shared client & types
│   │   ├── client.ts
│   │   ├── types.ts              # Generated DB types
│   │   └── migrations/           # SQL migrations
│   │
│   ├── ai/                       # AI Engine
│   │   ├── plan-generator.ts     # Marketing plan generation
│   │   ├── content-creator.ts    # Content creation
│   │   ├── campaign-optimizer.ts # Campaign optimization
│   │   ├── report-generator.ts   # Report generation
│   │   ├── prompts/              # AI Prompt templates
│   │   └── utils.ts
│   │
│   ├── social/                   # Social Media Integrations
│   │   ├── meta/                 # Facebook + Instagram
│   │   ├── tiktok/
│   │   ├── snapchat/
│   │   ├── x/
│   │   ├── linkedin/
│   │   ├── youtube/
│   │   └── google-ads/
│   │
│   └── pdf/                      # PDF Generation
│       ├── templates/
│       │   ├── marketing-plan.tsx    # قالب خطة التسويق
│       │   ├── monthly-report.tsx    # قالب التقرير الشهري
│       │   └── components/          # Shared PDF components
│       └── generator.ts
│
├── supabase/
│   ├── migrations/               # Database migrations
│   ├── functions/                # Edge Functions
│   │   ├── generate-plan/        # توليد خطة تسويق
│   │   ├── generate-report/      # توليد تقرير شهري
│   │   ├── optimize-campaign/    # تحسين حملة
│   │   ├── publish-content/      # نشر محتوى
│   │   ├── sync-analytics/       # مزامنة التحليلات
│   │   ├── update-statistics/    # تحديث الإحصائيات
│   │   └── send-notification/    # إرسال إشعارات
│   └── seed.sql
│
├── .cursor/
│   └── skills/                   # Custom marketing skills
│       ├── marketing-strategy/
│       ├── social-media-expert/
│       ├── ad-campaign-optimizer/
│       ├── content-creator-ar/
│       └── report-designer/
│
├── turbo.json                    # Turborepo config
├── package.json                  # Root package.json
└── README.md
```

---

## 8. الـ Skills المقترح إنشاؤها

### Skill 1: `marketing-strategy`
> استراتيجيات التسويق الرقمي، تحليل السوق، تحديد الجمهور المستهدف، بناء خطط SMART

### Skill 2: `social-media-expert`
> خبير بجميع منصات التواصل، أفضل الممارسات لكل منصة، أوقات النشر، أنواع المحتوى

### Skill 3: `ad-campaign-optimizer`
> تحسين الحملات الإعلانية، A/B Testing، استهداف الجمهور، تحسين الميزانية، قراءة KPIs

### Skill 4: `content-creator-ar`
> إنشاء محتوى تسويقي بالعربية، كتابة إعلانية، هاشتاقات، CTAs بالعربي

### Skill 5: `report-designer`
> تصميم تقارير PDF احترافية، رسوم بيانية، تحليل بيانات، عرض نتائج

---

## 9. مراحل التنفيذ (Implementation Phases)

### المرحلة 1: الأساسيات (الأسابيع 1-3)
```
الأسبوع 1:
├── ✦ إعداد Monorepo (Turborepo)
├── ✦ إعداد Supabase Project
├── ✦ إنشاء قاعدة البيانات (Migrations)
├── ✦ إعداد Auth (تسجيل دخول/خروج)
└── ✦ إعداد Next.js Admin مع Layout أساسي

الأسبوع 2:
├── ✦ إدارة العملاء (CRUD كامل)
├── ✦ إدارة حسابات التواصل الاجتماعي
├── ✦ ربط Meta API (Facebook + Instagram)
└── ✦ لوحة تحكم أساسية

الأسبوع 3:
├── ✦ إعداد Expo Client App
├── ✦ تسجيل دخول العميل
├── ✦ الصفحة الرئيسية للعميل
└── ✦ نظام الإشعارات الأساسي
```

### المرحلة 2: محرك AI + المحتوى (الأسابيع 4-6)
```
الأسبوع 4:
├── ✦ ربط Claude API
├── ✦ مولد خطط التسويق (AI)
├── ✦ قوالب PDF للخطط
└── ✦ عرض الخطة في تطبيق العميل

الأسبوع 5:
├── ✦ تقويم المحتوى
├── ✦ إنشاء محتوى بالذكاء الاصطناعي
├── ✦ جدولة المنشورات
├── ✦ نظام الموافقات
└── ✦ النشر التلقائي على Meta

الأسبوع 6:
├── ✦ إدارة الحملات الإعلانية
├── ✦ إنشاء حملات عبر Meta API
├── ✦ تتبع الأداء
└── ✦ تحسين تلقائي أساسي
```

### المرحلة 3: التقارير + المنصات الإضافية (الأسابيع 7-9)
```
الأسبوع 7:
├── ✦ نظام التقارير الشهرية
├── ✦ قوالب PDF للتقارير
├── ✦ توليد تقارير بالذكاء الاصطناعي
└── ✦ أرشيف التقارير في تطبيق العميل

الأسبوع 8:
├── ✦ ربط TikTok API
├── ✦ ربط Snapchat API
├── ✦ ربط X (Twitter) API
└── ✦ توحيد واجهة الإدارة لجميع المنصات

الأسبوع 9:
├── ✦ ربط LinkedIn API
├── ✦ ربط YouTube API
├── ✦ نظام الإحصائيات الإقليمية
└── ✦ التوصيات الذكية حسب المنطقة
```

### المرحلة 4: التحسينات + الإطلاق (الأسابيع 10-12)
```
الأسبوع 10:
├── ✦ تحسين واجهات المستخدم
├── ✦ نظام المحادثات (Chat)
├── ✦ تحسينات الأداء
└── ✦ اختبارات شاملة

الأسبوع 11:
├── ✦ Build تطبيق iOS و Android
├── ✦ اختبار على أجهزة حقيقية
├── ✦ إصلاح الأخطاء
└── ✦ تحسين تجربة المستخدم

الأسبوع 12:
├── ✦ نشر Admin Dashboard على Vercel
├── ✦ رفع التطبيق على Google Play
├── ✦ رفع التطبيق على Apple App Store
├── ✦ توثيق النظام
└── ✦ تدريب الفريق
```

---

## 10. نماذج PDF (Templates)

### خطة التسويق الشهرية (Monthly Marketing Plan PDF)
```
صفحة 1: الغلاف
├── شعار الشركة + شعار العميل
├── "خطة التسويق الرقمي - [اسم الشهر] 2026"
├── اسم المنشأة
└── تاريخ الإعداد

صفحة 2: الملخص التنفيذي
├── نبذة عن الخطة
├── الأهداف الرئيسية (3-5 أهداف)
└── المنصات المستهدفة

صفحة 3-4: تحليل الوضع الحالي
├── أداء الشهر الماضي
├── نقاط القوة والضعف
└── الفرص المتاحة

صفحة 5-6: الاستراتيجية
├── الجمهور المستهدف (Demographics)
├── الرسالة التسويقية
├── نبرة المحتوى (Tone of Voice)
└── المنصات وسبب اختيارها

صفحة 7-8: تقويم المحتوى
├── جدول المنشورات (تقويم شهري)
├── أنواع المحتوى لكل منصة
└── الهاشتاقات والحملات

صفحة 9-10: خطة الإعلانات
├── الحملات المخطط لها
├── الميزانية لكل حملة
├── الجمهور المستهدف
└── KPIs المتوقعة

صفحة 11: الميزانية
├── توزيع الميزانية على المنصات
├── رسم بياني دائري
└── إجمالي الميزانية

صفحة 12: مؤشرات النجاح (KPIs)
├── الأهداف الرقمية
├── طريقة القياس
└── الحد الأدنى المقبول
```

### تقرير الإنجازات الشهري (Monthly Achievement Report PDF)
```
صفحة 1: الغلاف
صفحة 2: ملخص تنفيذي (الإنجازات الرئيسية)
صفحة 3-4: إحصائيات عامة (رسوم بيانية)
صفحة 5-6: أداء كل منصة بالتفصيل
صفحة 7-8: أداء الحملات الإعلانية
صفحة 9: تحليل المحتوى الأفضل أداءً
صفحة 10: تحليل الميزانية والعائد (ROI)
صفحة 11: مقارنة الأهداف vs النتائج
صفحة 12: توصيات الذكاء الاصطناعي للشهر القادم
```

---

## 11. نظام الصلاحيات (Roles & Permissions)

| الصلاحية | Admin | Manager | Client |
|----------|-------|---------|--------|
| إدارة كل العملاء | ✅ | ❌ | ❌ |
| إدارة عملائه فقط | ✅ | ✅ | ❌ |
| إنشاء خطط تسويق | ✅ | ✅ | ❌ |
| تعديل خطط تسويق | ✅ | ✅ | ❌ |
| عرض خطط التسويق | ✅ | ✅ | ✅ (خطته فقط) |
| إنشاء محتوى | ✅ | ✅ | ❌ |
| الموافقة على المحتوى | ✅ | ✅ | ✅ (منشأته فقط) |
| إدارة الحملات | ✅ | ✅ | ❌ |
| عرض التقارير | ✅ | ✅ | ✅ (تقاريره فقط) |
| إعدادات النظام | ✅ | ❌ | ❌ |
| المحادثات | ✅ | ✅ | ✅ |

---

## 12. الأمان (Security)

1. **Row Level Security (RLS)** على جميع جداول Supabase
2. **JWT Tokens** مع انتهاء صلاحية
3. **تشفير** Access Tokens لمنصات التواصل
4. **Rate Limiting** على Edge Functions
5. **CORS** محدد للنطاقات المسموحة
6. **Input Validation** بـ Zod على كل المدخلات
7. **Audit Log** لجميع العمليات الحساسة
8. **2FA** اختياري للمستخدمين

---

## 13. التكاليف المتوقعة (شهرياً)

| البند | التكلفة التقديرية |
|-------|------------------|
| Supabase Pro | $25/شهر |
| Vercel Pro | $20/شهر |
| Claude API | $20-100/شهر (حسب الاستخدام) |
| Apple Developer | $99/سنة ($8.25/شهر) |
| Google Play | $25 (مرة واحدة) |
| Domain + SSL | $15/سنة |
| **الإجمالي** | **~$75-155/شهر** |

---

## 14. ملاحظات مهمة

1. **Meta API** يتطلب Business Verification وApp Review قبل الوصول لـ Ads Management
2. **TikTok API** يتطلب Developer Account وموافقة على التطبيق
3. **Apple App Store** يتطلب مراجعة وقد يأخذ 1-2 أسبوع
4. **Google Play** المراجعة أسرع عادة (2-3 أيام)
5. الخطة مرنة وقابلة للتعديل حسب الأولويات
6. يمكن البدء بمنصة واحدة (Meta) وإضافة البقية تدريجياً
