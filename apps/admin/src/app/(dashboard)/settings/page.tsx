"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles, Key, Eye, EyeOff, Save, Loader2, CheckCircle, AlertTriangle,
  Shield, X, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Copy,
  Check, Plug, Info, BookOpen, Zap, Globe, Hash, Lock, User, Users, Link2,
  RefreshCw, Settings, Cpu
} from "lucide-react";

/* ───────── Types ───────── */
interface ApiKeyEntry {
  id?: string;
  service: string;
  key_name: string;
  key_value: string;
  is_active: boolean;
  created_at?: string;
}

interface GuideStep {
  title: string;
  description: string;
  instructions: string[];
  notes?: string[];
  warnings?: string[];
  link?: { url: string; label: string };
}

interface ServiceConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description: string;
  docsUrl: string;
  keys: { name: string; label: string; placeholder: string; hint?: string; secret?: boolean }[];
  guide: GuideStep[];
}

/* ───────── Service Configurations ───────── */
const SERVICES: ServiceConfig[] = [
  {
    id: "anthropic",
    label: "Anthropic Claude AI",
    icon: <Cpu className="h-5 w-5" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    description: "محرك الذكاء الاصطناعي الأساسي للنظام — توليد خطط التسويق، المحتوى، وتحسين الحملات",
    docsUrl: "https://console.anthropic.com/",
    keys: [
      { name: "api_key", label: "API Key", placeholder: "sk-ant-api03-...", hint: "مفتاح API الرئيسي من لوحة تحكم Anthropic", secret: true },
    ],
    guide: [
      {
        title: "إنشاء حساب في Anthropic",
        description: "قم بإنشاء حساب أو تسجيل الدخول في منصة Anthropic",
        instructions: [
          "اذهب إلى console.anthropic.com",
          "سجّل حساب جديد أو سجّل دخولك",
          "فعّل حسابك عبر البريد الإلكتروني",
        ],
        link: { url: "https://console.anthropic.com/", label: "فتح لوحة تحكم Anthropic" },
      },
      {
        title: "إنشاء مفتاح API",
        description: "أنشئ مفتاح API جديد للاستخدام مع نظام سطوة",
        instructions: [
          "اذهب إلى Settings → API Keys",
          "اضغط Create Key",
          "أدخل اسم المفتاح (مثلاً: سطوة)",
          "انسخ المفتاح فوراً — لن يظهر مرة أخرى!",
        ],
        warnings: ["احفظ المفتاح في مكان آمن فوراً — لا يمكن استعراضه بعد إغلاق النافذة"],
        notes: ["المفتاح يبدأ بـ sk-ant-api03-"],
      },
      {
        title: "إضافة رصيد",
        description: "أضف رصيد لحسابك لتتمكن من استخدام API",
        instructions: [
          "اذهب إلى Settings → Plans & Billing",
          "أضف وسيلة دفع (بطاقة ائتمان)",
          "اشحن رصيد حسب احتياجك (يبدأ من $5)",
        ],
        notes: ["التكلفة التقريبية: $0.003 لكل 1000 كلمة (Claude Sonnet)", "الرصيد لا ينتهي ويُخصم حسب الاستخدام فقط"],
      },
    ],
  },
  {
    id: "meta",
    label: "Meta (Facebook + Instagram)",
    icon: <Globe className="h-5 w-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    description: "إدارة صفحات فيسبوك، حسابات إنستغرام، والحملات الإعلانية",
    docsUrl: "https://developers.facebook.com/",
    keys: [
      { name: "app_id", label: "App ID (معرّف التطبيق)", placeholder: "123456789012345", hint: "رقم التطبيق — يظهر في أعلى لوحة التحكم أو من App Settings → Basic" },
      { name: "app_secret", label: "App Secret (سر التطبيق)", placeholder: "abc123def456...", hint: "من App Settings → Basic → اضغط Show بجانب App Secret", secret: true },
      { name: "access_token", label: "Access Token (رمز الوصول)", placeholder: "EAAxxxxxxx...", hint: "يتم تعبئته تلقائياً عند الربط عبر OAuth — أو أدخل رمز System User يدوياً", secret: true },
    ],
    guide: [
      {
        title: "إنشاء حساب Meta Business (إذا لم يكن لديك)",
        description: "حساب الأعمال في Meta مطلوب لإنشاء التطبيق وربط الصفحات",
        instructions: [
          "اذهب إلى business.facebook.com",
          "اضغط «إنشاء حساب» وأدخل اسم شركتك",
          "أدخل اسمك وبريدك الإلكتروني الخاص بالعمل",
          "أكمل إعداد الحساب — ستحتاج إضافة صفحة فيسبوك وحساب إعلاني",
        ],
        link: { url: "https://business.facebook.com/overview", label: "فتح Meta Business Suite" },
        notes: ["إذا كان لديك حساب Business بالفعل، تجاوز هذه الخطوة"],
      },
      {
        title: "إنشاء تطبيق في Meta for Developers",
        description: "هذا التطبيق هو البوابة التي يستخدمها سطوة للتواصل مع فيسبوك وإنستغرام",
        instructions: [
          "اذهب إلى developers.facebook.com وسجّل دخولك",
          "اضغط «تطبيقاتي» (My Apps) في أعلى الصفحة",
          "اضغط «إنشاء تطبيق» (Create App)",
          "في صفحة «تفاصيل التطبيق»: أدخل اسم التطبيق (مثلاً: سطوة) واختر حساب الأعمال الخاص بك",
          "اضغط «التالي» للانتقال لخطوة حالات الاستخدام",
        ],
        link: { url: "https://developers.facebook.com/apps/create/", label: "إنشاء تطبيق جديد" },
      },
      {
        title: "اختيار حالات الاستخدام (Use Cases)",
        description: "في هذه الشاشة اختر الخدمات التي يحتاجها النظام — ستظهر قائمة بالخيارات",
        instructions: [
          "ضع علامة ✓ على «إنشاء إعلانات وإدارتها من خلال واجهة API التسويق» — هذا يعطيك Marketing API لإدارة الحملات الإعلانية",
          "ضع علامة ✓ على «المصادقة وطلب البيانات من خلال تسجيل دخول فيسبوك» — هذا يعطيك Facebook Login لربط الصفحات والحسابات",
          "لا تحتاج باقي الخيارات (Threads, ألعاب, إعلانات التطبيقات) — اتركها فارغة",
          "اضغط «التالي» (Next) للمتابعة",
        ],
        notes: [
          "Marketing API: للتحكم بالإعلانات وميزانياتها وإحصائياتها من النظام",
          "Facebook Login: لربط صفحات فيسبوك وحسابات إنستغرام وقراءة البيانات",
        ],
      },
      {
        title: "إكمال إنشاء التطبيق",
        description: "أكمل الخطوات المتبقية (النشاط التجاري، المتطلبات، نظرة عامة)",
        instructions: [
          "في خطوة «النشاط التجاري»: اختر حساب الأعمال المرتبط بصفحاتك",
          "في خطوة «المتطلبات»: راجع المتطلبات واقبل الشروط",
          "في خطوة «نظرة عامة»: راجع تفاصيل التطبيق واضغط «إنشاء التطبيق»",
          "سيتم نقلك للوحة تحكم التطبيق الجديد",
        ],
        warnings: ["بعد الإنشاء، التطبيق يكون في وضع Development — يعمل فقط مع حسابك حتى تطلب App Review"],
      },
      {
        title: "نسخ App ID و App Secret",
        description: "هذه هي بيانات الاعتماد الأساسية للتطبيق",
        instructions: [
          "من لوحة تحكم التطبيق، اذهب إلى «إعدادات التطبيق» → «الأساسية» (App Settings → Basic)",
          "في أعلى الصفحة يظهر «معرّف التطبيق» (App ID) — انسخه، هذا هو الحقل الأول",
          "بجانب «مفتاح سر التطبيق» (App Secret) اضغط «إظهار» (Show) ثم أدخل كلمة مرورك",
          "انسخ App Secret — هذا هو الحقل الثاني",
        ],
        warnings: ["App Secret سري تماماً — لا تشاركه مع أي شخص ولا تضعه في كود عام"],
      },
      {
        title: "إضافة الصلاحيات المطلوبة",
        description: "اطلب الصلاحيات اللازمة لإدارة الإعلانات والصفحات والمحتوى",
        instructions: [
          "من القائمة الجانبية اذهب إلى «App Review» → «الأذونات والميزات» (Permissions and Features)",
          "ابحث عن هذه الصلاحيات واطلبها واحدة واحدة:",
          "ads_management — لإدارة الحملات الإعلانية (إنشاء، تعديل، إيقاف)",
          "ads_read — لقراءة بيانات وإحصائيات الإعلانات",
          "pages_show_list — لعرض قائمة الصفحات المُدارة",
          "pages_read_engagement — لقراءة التفاعلات والتعليقات",
          "pages_read_user_content — لقراءة محتوى الصفحات",
          "pages_manage_metadata — لإدارة معلومات الصفحات",
          "business_management — للوصول لجميع Business Portfolios",
        ],
        notes: [
          "الصلاحيات في وضع Development تعمل فوراً مع حسابك",
          "للنشر على حسابات عملائك، ستحتاج لاحقاً App Review من Meta (عملية مراجعة تستغرق 2-5 أيام عمل)",
        ],
      },
      {
        title: "إنشاء System User و Access Token الدائم",
        description: "رمز System User لا ينتهي — على عكس رمز المستخدم العادي الذي ينتهي خلال 60 يوم",
        instructions: [
          "اذهب إلى business.facebook.com → «إعدادات الأعمال» (Business Settings)",
          "من القائمة الجانبية اختر «المستخدمون» → «مستخدمو النظام» (System Users)",
          "اضغط «إضافة» (Add) لإنشاء System User جديد",
          "أدخل اسم (مثلاً: سطوة Bot) واختر الدور «مسؤول» (Admin)",
          "بعد الإنشاء، اضغط «إنشاء رمز مميز» (Generate New Token)",
          "اختر التطبيق الذي أنشأته في الخطوات السابقة",
          "اختر الصلاحيات: ads_read, pages_show_list, pages_read_engagement, pages_read_user_content, pages_manage_metadata, business_management",
          "اضغط «إنشاء رمز مميز» — انسخ الرمز فوراً! هذا هو Access Token",
        ],
        warnings: ["الرمز يظهر مرة واحدة فقط! انسخه واحفظه فوراً قبل إغلاق النافذة"],
        notes: [
          "رمز System User لا ينتهي ولا يحتاج تجديد — مثالي للأنظمة الآلية",
          "تأكد من إضافة أصول (Assets) للـ System User: الصفحات + الحساب الإعلاني + حساب إنستغرام",
        ],
      },
      {
        title: "ربط الأصول بـ System User",
        description: "أعطِ مستخدم النظام صلاحية الوصول لصفحاتك وحساباتك الإعلانية",
        instructions: [
          "من نفس صفحة System Users، اضغط على اسم المستخدم الذي أنشأته",
          "اضغط «إضافة أصول» (Add Assets)",
          "اختر «الصفحات» (Pages) وحدد صفحات فيسبوك التي تريد إدارتها → اختر «تحكم كامل»",
          "اختر «الحسابات الإعلانية» (Ad Accounts) وحدد حسابك → اختر «تحكم كامل»",
          "اختر «حسابات إنستغرام» (Instagram Accounts) وحدد الحساب → اختر «تحكم كامل»",
          "اضغط «حفظ التغييرات»",
          "الآن الصق الـ 3 قيم (App ID, App Secret, Access Token) في الحقول أدناه واضغط حفظ",
        ],
        notes: ["بعد ربط الأصول، النظام يستطيع إدارة إعلاناتك ومحتواك بالكامل بشكل آلي"],
      },
    ],
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: <Zap className="h-5 w-5" />,
    color: "text-slate-700",
    bgColor: "bg-slate-50",
    description: "نشر المحتوى وإدارة الحملات الإعلانية على تيك توك",
    docsUrl: "https://developers.tiktok.com/",
    keys: [
      { name: "app_id", label: "App ID", placeholder: "aw123456", hint: "معرّف التطبيق من TikTok for Developers" },
      { name: "app_secret", label: "App Secret", placeholder: "abc123...", hint: "السر الخاص بالتطبيق", secret: true },
      { name: "access_token", label: "Access Token", placeholder: "act.xxxx...", hint: "رمز الوصول للتطبيق", secret: true },
    ],
    guide: [
      {
        title: "إنشاء تطبيق في TikTok for Developers",
        description: "سجّل تطبيقك للحصول على صلاحيات API",
        instructions: [
          "اذهب إلى developers.tiktok.com",
          "سجّل دخولك أو أنشئ حساب مطور",
          "اضغط Manage Apps → Create App",
          "اختر Content Posting API و TikTok Marketing API",
        ],
        link: { url: "https://developers.tiktok.com/", label: "فتح TikTok for Developers" },
      },
      {
        title: "الحصول على بيانات الاعتماد",
        description: "انسخ App ID و App Secret من صفحة التطبيق",
        instructions: [
          "افتح تطبيقك من قائمة التطبيقات",
          "انسخ App ID و App Secret",
          "أكمل عملية التوثيق OAuth للحصول على Access Token",
        ],
      },
    ],
  },
  {
    id: "x",
    label: "X (Twitter)",
    icon: <Hash className="h-5 w-5" />,
    color: "text-slate-800",
    bgColor: "bg-slate-50",
    description: "نشر التغريدات وإدارة الحساب ومتابعة التفاعلات",
    docsUrl: "https://developer.x.com/en/portal/dashboard",
    keys: [
      { name: "bearer_token", label: "Bearer Token", placeholder: "AAAAAxxxxxxx...", hint: "للقراءة فقط — البحث والتحليلات", secret: true },
      { name: "api_key", label: "API Key (Consumer Key)", placeholder: "xxxx...", hint: "من Developer Portal → Keys and Tokens" },
      { name: "api_secret", label: "API Secret", placeholder: "xxxx...", hint: "مفتاح سري للتطبيق", secret: true },
      { name: "access_token", label: "Access Token", placeholder: "xxxx-xxxx...", hint: "رمز وصول لحسابك المحدد", secret: true },
      { name: "access_secret", label: "Access Token Secret", placeholder: "xxxx...", hint: "السر المرافق لرمز الوصول", secret: true },
    ],
    guide: [
      {
        title: "إنشاء مشروع في X Developer Portal",
        description: "سجّل تطبيقك للحصول على صلاحيات النشر والقراءة",
        instructions: [
          "اذهب إلى developer.x.com",
          "سجّل حساب مطوّر (مجاني)",
          "أنشئ Project جديد",
          "أنشئ App داخل المشروع",
        ],
        link: { url: "https://developer.x.com/en/portal/dashboard", label: "فتح X Developer Portal" },
        notes: ["الخطة المجانية تسمح بنشر 1500 تغريدة/شهر وقراءة 10000 تغريدة"],
      },
      {
        title: "نسخ المفاتيح والرموز",
        description: "من صفحة التطبيق، انسخ جميع المفاتيح المطلوبة",
        instructions: [
          "افتح تطبيقك → Keys and Tokens",
          "انسخ API Key و API Secret",
          "أنشئ Access Token and Secret واضغط Generate",
          "من Project settings، انسخ Bearer Token",
        ],
        warnings: ["جميع المفاتيح تُعرض مرة واحدة فقط — احفظها فوراً"],
      },
    ],
  },
  {
    id: "snapchat",
    label: "Snapchat",
    icon: <Zap className="h-5 w-5" />,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    description: "إدارة الحملات الإعلانية على سناب شات",
    docsUrl: "https://business.snapchat.com/",
    keys: [
      { name: "access_token", label: "Access Token", placeholder: "xxxx...", hint: "رمز الوصول من Snapchat Marketing API", secret: true },
      { name: "ad_account_id", label: "Ad Account ID", placeholder: "xxxx-xxxx-xxxx", hint: "معرّف الحساب الإعلاني" },
    ],
    guide: [
      {
        title: "إنشاء حساب Snapchat Business",
        description: "حساب الأعمال مطلوب لاستخدام Marketing API",
        instructions: [
          "اذهب إلى business.snapchat.com",
          "أنشئ حساب أعمال أو سجّل دخولك",
          "أنشئ Ad Account من Ads Manager",
        ],
        link: { url: "https://business.snapchat.com/", label: "Snapchat Business Manager" },
      },
      {
        title: "الحصول على API Credentials",
        description: "أنشئ تطبيق OAuth للحصول على Access Token",
        instructions: [
          "اذهب إلى Business Manager → Business Settings",
          "اختر OAuth Apps → Create App",
          "أكمل عملية Authorization",
          "انسخ Ad Account ID من Ads Manager",
        ],
      },
    ],
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: <User className="h-5 w-5" />,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    description: "نشر المحتوى المهني وإدارة صفحات الشركات",
    docsUrl: "https://www.linkedin.com/developers/",
    keys: [
      { name: "access_token", label: "Access Token", placeholder: "AQVxxxx...", hint: "رمز OAuth 2.0 — يحتاج تجديد كل 60 يوم", secret: true },
      { name: "organization_id", label: "Organization ID", placeholder: "123456789", hint: "معرّف صفحة الشركة على LinkedIn" },
    ],
    guide: [
      {
        title: "إنشاء تطبيق LinkedIn",
        description: "سجّل تطبيقك في LinkedIn Developers",
        instructions: [
          "اذهب إلى linkedin.com/developers",
          "اضغط Create App",
          "اربط التطبيق بصفحة شركتك",
          "اطلب صلاحيات Marketing Developer Platform",
        ],
        link: { url: "https://www.linkedin.com/developers/apps/new", label: "إنشاء تطبيق LinkedIn" },
      },
      {
        title: "الحصول على Access Token",
        description: "أكمل عملية OAuth للحصول على رمز وصول",
        instructions: [
          "من Auth tab، انسخ Client ID و Client Secret",
          "نفّذ OAuth 2.0 flow للحصول على Access Token",
          "أو استخدم Token Generator من تبويب Auth",
        ],
        notes: ["رمز الوصول صالح لـ 60 يوم — يحتاج تجديد دوري"],
      },
    ],
  },
  {
    id: "youtube",
    label: "YouTube / Google",
    icon: <Globe className="h-5 w-5" />,
    color: "text-red-600",
    bgColor: "bg-red-50",
    description: "إدارة القنوات، نشر الفيديوهات، والاطلاع على التحليلات",
    docsUrl: "https://console.cloud.google.com/",
    keys: [
      { name: "api_key", label: "API Key", placeholder: "AIzaSyxxxx...", hint: "مفتاح API لخدمات Google — للقراءة فقط" },
      { name: "oauth_token", label: "OAuth Token", placeholder: "ya29.xxxx...", hint: "رمز OAuth للعمليات التي تحتاج تفويض", secret: true },
      { name: "channel_id", label: "Channel ID", placeholder: "UCxxxx...", hint: "معرّف القناة — يبدأ بـ UC" },
    ],
    guide: [
      {
        title: "إنشاء مشروع في Google Cloud",
        description: "أنشئ مشروعاً وفعّل YouTube Data API",
        instructions: [
          "اذهب إلى console.cloud.google.com",
          "أنشئ مشروع جديد أو اختر مشروع موجود",
          "اذهب إلى APIs & Services → Library",
          "ابحث عن YouTube Data API v3 واضغط Enable",
        ],
        link: { url: "https://console.cloud.google.com/apis/library", label: "مكتبة APIs في Google Cloud" },
      },
      {
        title: "إنشاء API Key",
        description: "أنشئ مفتاح API للقراءة والتحليلات",
        instructions: [
          "اذهب إلى APIs & Services → Credentials",
          "اضغط Create Credentials → API Key",
          "انسخ المفتاح (يبدأ بـ AIzaSy)",
          "يُفضل تقييد المفتاح بـ YouTube Data API فقط من خلال API restrictions",
        ],
      },
      {
        title: "إعداد OAuth (اختياري — للنشر)",
        description: "مطلوب فقط إذا أردت نشر فيديوهات من النظام",
        instructions: [
          "اذهب إلى Credentials → Create Credentials → OAuth Client ID",
          "اختر Web Application",
          "أضف Redirect URI",
          "أكمل شاشة OAuth consent",
          "نفّذ OAuth flow للحصول على Token",
        ],
      },
    ],
  },
  {
    id: "google_ads",
    label: "Google Ads",
    icon: <Settings className="h-5 w-5" />,
    color: "text-green-600",
    bgColor: "bg-green-50",
    description: "إدارة الحملات الإعلانية في Google Search و Display",
    docsUrl: "https://ads.google.com/",
    keys: [
      { name: "developer_token", label: "Developer Token", placeholder: "xxxx...", hint: "من Google Ads API Center", secret: true },
      { name: "client_id", label: "OAuth Client ID", placeholder: "xxxx.apps.googleusercontent.com", hint: "من Google Cloud Console" },
      { name: "client_secret", label: "OAuth Client Secret", placeholder: "GOCSPX-xxxx...", hint: "سر عميل OAuth", secret: true },
      { name: "refresh_token", label: "Refresh Token", placeholder: "1//xxxx...", hint: "رمز التجديد — لا ينتهي", secret: true },
    ],
    guide: [
      {
        title: "إنشاء حساب Google Ads و Developer Token",
        description: "طلب صلاحيات API من Google Ads",
        instructions: [
          "سجّل دخولك في ads.google.com",
          "اذهب إلى Tools & Settings → API Center",
          "اطلب Developer Token (يحتاج مراجعة من Google)",
        ],
        link: { url: "https://ads.google.com/", label: "Google Ads" },
        notes: ["الحصول على Basic Access Token يستغرق 1-3 أيام عمل"],
      },
      {
        title: "إعداد OAuth في Google Cloud",
        description: "أنشئ OAuth Client ID في مشروعك",
        instructions: [
          "من Google Cloud Console → Credentials",
          "أنشئ OAuth 2.0 Client ID (Web Application)",
          "انسخ Client ID و Client Secret",
          "نفّذ OAuth flow للحصول على Refresh Token",
        ],
      },
    ],
  },
];

const AI_SETTINGS = [
  { label: "تحسين الحملات تلقائياً", desc: "إيقاف الإعلانات الضعيفة وزيادة ميزانية الناجحة", key: "auto_optimize", icon: <Zap className="h-4 w-4" /> },
  { label: "توليد محتوى تلقائي", desc: "إنشاء منشورات AI وإضافتها للتقويم كمسودات", key: "auto_content", icon: <Sparkles className="h-4 w-4" /> },
  { label: "إرسال تقارير شهرية", desc: "توليد وإرسال تقرير PDF نهاية كل شهر", key: "auto_reports", icon: <Globe className="h-4 w-4" /> },
  { label: "تحديث الإحصائيات الإقليمية", desc: "جلب أحدث بيانات المنصات شهرياً", key: "auto_stats", icon: <RefreshCw className="h-4 w-4" /> },
  { label: "التعلم الذاتي الشهري", desc: "مراجعة الأداء وتحديث الاستراتيجيات", key: "auto_learn", icon: <Cpu className="h-4 w-4" /> },
  { label: "تنبيهات ذكية", desc: "تنبيهات عند اكتشاف فرص أو مشاكل", key: "auto_alerts", icon: <Info className="h-4 w-4" /> },
];

/* ───────── Step Guide Component ───────── */
function SetupGuide({ guide, serviceId }: { guide: GuideStep[]; serviceId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="text-start">
            <p className="text-sm font-bold text-slate-900">دليل الإعداد خطوة بخطوة</p>
            <p className="text-xs text-slate-500">{guide.length} خطوات — اضغط لعرض الدليل المفصّل</p>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="border-t border-slate-100 p-6 bg-gradient-to-b from-slate-50/50 to-white">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {guide.map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentStep(i)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    i === currentStep
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30 scale-110"
                      : i < currentStep
                      ? "bg-green-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {i < currentStep ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </button>
                {i < guide.length - 1 && (
                  <div className={`h-0.5 w-8 rounded-full ${i < currentStep ? "bg-green-400" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white font-bold">
                {currentStep + 1}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{guide[currentStep].title}</h3>
                <p className="text-sm text-slate-500 mt-1">{guide[currentStep].description}</p>
              </div>
            </div>

            <div className="space-y-2.5 mb-5">
              {guide[currentStep].instructions.map((inst, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-600 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700 leading-relaxed">{inst}</span>
                </div>
              ))}
            </div>

            {guide[currentStep].notes?.map((note, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg bg-blue-50 border border-blue-100 p-3 mb-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <span className="text-xs text-blue-700">{note}</span>
              </div>
            ))}

            {guide[currentStep].warnings?.map((warn, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-100 p-3 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <span className="text-xs text-amber-700 font-medium">{warn}</span>
              </div>
            ))}

            {guide[currentStep].link && (
              <a
                href={guide[currentStep].link!.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 rounded-lg bg-primary-50 px-4 py-2.5 text-xs font-semibold text-primary-600 hover:bg-primary-100 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {guide[currentStep].link!.label}
              </a>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
                السابق
              </button>
              <span className="text-xs text-slate-400">
                {currentStep + 1} / {guide.length}
              </span>
              <button
                onClick={() => setCurrentStep(Math.min(guide.length - 1, currentStep + 1))}
                disabled={currentStep === guide.length - 1}
                className="flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:text-primary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Main Settings Page ───────── */
export default function SettingsPage() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [activeService, setActiveService] = useState("anthropic");
  const [copied, setCopied] = useState<string | null>(null);
  const [aiToggles, setAiToggles] = useState<Record<string, boolean>>({
    auto_optimize: true, auto_content: true, auto_reports: false,
    auto_stats: true, auto_learn: true, auto_alerts: true,
  });

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/api-keys");
      const data = await res.json();
      if (data.keys) setKeys(data.keys);
    } catch {
      setMessage({ type: "error", text: "فشل تحميل المفاتيح" });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const getKeyForService = (service: string, keyName: string) =>
    keys.find((k) => k.service === service && k.key_name === keyName);

  const getConfiguredCount = (service: ServiceConfig) =>
    service.keys.filter((k) => getKeyForService(service.id, k.name)).length;

  const handleSave = async (service: string, keyName: string) => {
    const editKey = `${service}:${keyName}`;
    const value = editValues[editKey];
    if (!value?.trim()) return;

    setSaving(editKey);
    setMessage(null);

    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, key_name: keyName, key_value: value.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "تم حفظ المفتاح بنجاح" });
        setEditValues((prev) => ({ ...prev, [editKey]: "" }));
        fetchKeys();
      } else {
        setMessage({ type: "error", text: data.error || "فشل الحفظ" });
      }
    } catch {
      setMessage({ type: "error", text: "خطأ في الاتصال" });
    }
    setSaving(null);
  };

  const handleSaveAll = async (service: ServiceConfig) => {
    const keysToSave = service.keys.filter((k) => {
      const val = editValues[`${service.id}:${k.name}`];
      return val && val.trim();
    });
    if (keysToSave.length === 0) return;

    for (const k of keysToSave) {
      await handleSave(service.id, k.name);
    }
  };

  const [oauthLoading, setOauthLoading] = useState(false);

  /* ── Google Ads Account Management ── */
  interface GadsAccount {
    id: string;
    name: string;
    selected: boolean;
  }
  const [gadsAccounts, setGadsAccounts] = useState<GadsAccount[]>([]);
  const [gadsLoading, setGadsLoading] = useState(false);
  const [gadsSaving, setGadsSaving] = useState(false);
  const [gadsLoaded, setGadsLoaded] = useState(false);

  const fetchGadsAccounts = async () => {
    setGadsLoading(true);
    try {
      const res = await fetch("/api/google-ads/managed-accounts", { credentials: "include" });
      const data = await res.json();
      if (data.accounts) {
        setGadsAccounts(data.accounts);
        setGadsLoaded(true);
      }
    } catch {
      setMessage({ type: "error", text: "فشل جلب حسابات Google Ads" });
    }
    setGadsLoading(false);
  };

  const toggleGadsAccount = (id: string) => {
    setGadsAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a))
    );
  };

  const updateGadsName = (id: string, name: string) => {
    setGadsAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, name } : a))
    );
  };

  const saveGadsAccounts = async () => {
    const selected = gadsAccounts.filter((a) => a.selected);
    const incomplete = selected.filter((a) => !a.name.trim());
    if (incomplete.length > 0) {
      setMessage({ type: "error", text: "يرجى إدخال اسم لكل حساب مُختار" });
      return;
    }
    setGadsSaving(true);
    try {
      const res = await fetch("/api/google-ads/managed-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: selected.map((a) => ({ id: a.id, name: a.name })) }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: data.message });
      } else {
        setMessage({ type: "error", text: data.error || "فشل الحفظ" });
      }
    } catch {
      setMessage({ type: "error", text: "خطأ في حفظ الحسابات" });
    }
    setGadsSaving(false);
  };

  const handleGoogleAdsOAuth = async () => {
    setOauthLoading(true);
    try {
      const res = await fetch("/api/google-ads/oauth");
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setMessage({ type: "error", text: data.error || "فشل إنشاء رابط التفويض" });
        setOauthLoading(false);
      }
    } catch {
      setMessage({ type: "error", text: "خطأ في الاتصال بخدمة التفويض" });
      setOauthLoading(false);
    }
  };

  const [metaOauthLoading, setMetaOauthLoading] = useState(false);
  const [metaConnectedInfo, setMetaConnectedInfo] = useState<{
    name: string;
    pages: number;
    businesses: number;
    ad_accounts: number;
    connected_at: string;
  } | null>(null);

  useEffect(() => {
    const connectedUserKey = keys.find(
      (k: ApiKeyEntry) => k.service === "meta" && k.key_name === "connected_user" && k.is_active
    );
    if (connectedUserKey) {
      try {
        setMetaConnectedInfo(JSON.parse(connectedUserKey.key_value));
      } catch {}
    }
  }, [keys]);

  const handleMetaOAuth = async () => {
    setMetaOauthLoading(true);
    try {
      const res = await fetch("/api/meta/oauth");
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setMessage({ type: "error", text: data.error || "فشل إنشاء رابط التفويض — تأكد من إضافة App ID أولاً" });
        setMetaOauthLoading(false);
      }
    } catch {
      setMessage({ type: "error", text: "خطأ في الاتصال بخدمة التفويض" });
      setMetaOauthLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("success") === "google_ads_connected") {
      setMessage({ type: "success", text: "تم ربط حساب Google Ads بنجاح! تم حفظ Refresh Token تلقائياً." });
      setActiveService("google_ads");
      window.history.replaceState({}, "", "/settings");
      fetchKeys();
    }

    if (params.get("success") === "meta_connected") {
      setMessage({ type: "success", text: "تم ربط حساب فيسبوك بنجاح! الآن يمكنك الوصول لجميع الصفحات والحسابات الإعلانية." });
      setActiveService("meta");
      window.history.replaceState({}, "", "/settings");
      fetchKeys();
    }

    const error = params.get("error");
    if (error?.startsWith("google_ads_")) {
      const errorMessages: Record<string, string> = {
        google_ads_oauth_denied: "تم رفض التفويض — يرجى المحاولة مرة أخرى",
        google_ads_no_code: "لم يتم استلام رمز التفويض",
        google_ads_missing_credentials: "بيانات OAuth غير مكتملة — أضف Client ID و Secret أولاً",
        google_ads_no_refresh_token: "لم يتم استلام Refresh Token — يرجى إعادة الربط",
        google_ads_callback_error: "حدث خطأ أثناء معالجة التفويض",
      };
      setMessage({ type: "error", text: errorMessages[error] || "خطأ في ربط Google Ads" });
      setActiveService("google_ads");
      window.history.replaceState({}, "", "/settings");
    }

    if (error?.startsWith("meta_")) {
      const errorMessages: Record<string, string> = {
        meta_oauth_denied: "تم رفض التفويض — يرجى المحاولة مرة أخرى",
        meta_no_code: "لم يتم استلام رمز التفويض",
        meta_missing_credentials: "بيانات التطبيق غير مكتملة — أضف App ID و App Secret أولاً",
        meta_token_exchange_failed: "فشل تبادل رمز الوصول — تأكد من صحة App Secret",
        meta_long_lived_failed: "فشل الحصول على رمز طويل الأمد",
        meta_callback_error: "حدث خطأ أثناء معالجة التفويض",
      };
      setMessage({ type: "error", text: errorMessages[error] || "خطأ في ربط Meta" });
      setActiveService("meta");
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  const activeConfig = SERVICES.find((s) => s.id === activeService)!;

  return (
    <div className="min-h-screen -m-6 bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">إعدادات النظام</h1>
            <p className="text-sm text-slate-500">إدارة مفاتيح API والتكامل مع المنصات الخارجية</p>
          </div>
        </div>
      </div>

      {/* Message toast */}
      {message && (
        <div className={`mx-8 mt-4 flex items-center gap-3 rounded-xl border p-4 ${
          message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {message.type === "success" ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
          <span className="text-sm font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="mr-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <div className="w-72 min-w-[288px] bg-white border-l border-slate-200 min-h-[calc(100vh-80px)] py-4">
          <div className="px-4 mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">الخدمات المتصلة</p>
          </div>
          <div className="space-y-0.5 px-3">
            {SERVICES.map((service) => {
              const configured = getConfiguredCount(service);
              const total = service.keys.length;
              const isActive = activeService === service.id;

              return (
                <button
                  key={service.id}
                  onClick={() => setActiveService(service.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-start transition-all ${
                    isActive
                      ? "bg-primary-50 border-r-[3px] border-primary-600"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    isActive ? "bg-primary-600 text-white" : `${service.bgColor} ${service.color}`
                  }`}>
                    {service.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? "text-primary-700" : "text-slate-700"}`}>
                      {service.label}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {configured}/{total} مفاتيح مُعدّة
                    </p>
                  </div>
                  {configured === total && total > 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  ) : configured > 0 ? (
                    <div className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-slate-200 shrink-0" />
                  )}
                </button>
              );
            })}

            {/* AI Auto Management section */}
            <div className="border-t border-slate-100 mt-4 pt-4">
              <button
                onClick={() => setActiveService("ai_settings")}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-start transition-all ${
                  activeService === "ai_settings"
                    ? "bg-primary-50 border-r-[3px] border-primary-600"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  activeService === "ai_settings"
                    ? "bg-primary-600 text-white"
                    : "bg-gradient-to-br from-purple-500 to-indigo-600 text-white"
                }`}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${activeService === "ai_settings" ? "text-primary-700" : "text-slate-700"}`}>
                    الإدارة الذكية
                  </p>
                  <p className="text-[11px] text-slate-400">التشغيل التلقائي بالـ AI</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 p-8 max-w-[860px]">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <span className="mr-3 text-slate-500">جاري تحميل الإعدادات...</span>
            </div>
          ) : activeService === "ai_settings" ? (
            /* ──── AI Settings Panel ──── */
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">الإدارة الذكية المستقلة</h2>
                  <p className="text-sm text-slate-500">تحكّم بأتمتة الذكاء الاصطناعي لإدارة التسويق</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {AI_SETTINGS.map((setting, i) => (
                  <div key={setting.key} className={`flex items-center justify-between p-5 ${i !== AI_SETTINGS.length - 1 ? "border-b border-slate-100" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        {setting.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{setting.label}</p>
                        <p className="text-xs text-slate-500">{setting.desc}</p>
                      </div>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={aiToggles[setting.key] ?? false}
                        onChange={(e) => setAiToggles((prev) => ({ ...prev, [setting.key]: e.target.checked }))}
                      />
                      <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ──── Service Panel ──── */
            <div>
              {/* Service Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${activeConfig.bgColor} ${activeConfig.color}`}>
                  {activeConfig.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-900">{activeConfig.label}</h2>
                  <p className="text-sm text-slate-500">{activeConfig.description}</p>
                </div>
                <a
                  href={activeConfig.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500 hover:text-primary-600 hover:border-primary-200 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  المستندات
                </a>
              </div>

              {/* Connection Status */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6">
                <div className="flex items-center gap-4">
                  {getConfiguredCount(activeConfig) === activeConfig.keys.length ? (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-500">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-700">تم التكوين</p>
                        <p className="text-xs text-green-600">جميع مفاتيح API محفوظة ومُفعّلة</p>
                      </div>
                    </>
                  ) : getConfiguredCount(activeConfig) > 0 ? (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-amber-700">تكوين جزئي</p>
                        <p className="text-xs text-amber-600">
                          {getConfiguredCount(activeConfig)} من {activeConfig.keys.length} مفاتيح مُعدّة — أكمل بقية المفاتيح
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <Plug className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">غير مُكوّن</p>
                        <p className="text-xs text-slate-500">أدخل مفاتيح API لتفعيل التكامل — اتبع الدليل أدناه</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* OAuth Connect Button for Meta */}
              {activeConfig.id === "meta" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Link2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">ربط حسابك على فيسبوك عبر OAuth</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        سجّل دخول بحسابك الشخصي لجلب جميع الصفحات والحسابات الإعلانية عبر كل Business Portfolios
                      </p>
                    </div>
                    <button
                      onClick={handleMetaOAuth}
                      disabled={metaOauthLoading || !getKeyForService("meta", "app_id") || !getKeyForService("meta", "app_secret")}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {metaOauthLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      {getKeyForService("meta", "access_token") ? "إعادة الربط" : "ربط الحساب"}
                    </button>
                  </div>

                  {(!getKeyForService("meta", "app_id") || !getKeyForService("meta", "app_secret")) && (
                    <p className="text-xs text-amber-600 mt-3 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      أضف App ID و App Secret أولاً لتفعيل زر الربط
                    </p>
                  )}

                  {metaConnectedInfo && (
                    <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <p className="text-sm font-bold text-emerald-800">متصل بحساب: {metaConnectedInfo.name}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div className="rounded-lg bg-white p-2.5 text-center">
                          <p className="text-lg font-bold text-slate-900">{metaConnectedInfo.pages}</p>
                          <p className="text-[10px] text-slate-500">صفحة</p>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 text-center">
                          <p className="text-lg font-bold text-slate-900">{metaConnectedInfo.businesses}</p>
                          <p className="text-[10px] text-slate-500">Portfolio</p>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 text-center">
                          <p className="text-lg font-bold text-slate-900">{metaConnectedInfo.ad_accounts}</p>
                          <p className="text-[10px] text-slate-500">حساب إعلاني</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-emerald-600 mt-2">
                        آخر ربط: {new Date(metaConnectedInfo.connected_at).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* OAuth Connect Button for Google Ads */}
              {activeConfig.id === "google_ads" && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Link2 className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">ربط حساب Google Ads عبر OAuth</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        بعد إضافة Client ID و Client Secret، اضغط الزر للربط والحصول على Refresh Token تلقائياً
                      </p>
                    </div>
                    <button
                      onClick={handleGoogleAdsOAuth}
                      disabled={oauthLoading || !getKeyForService("google_ads", "client_id") || !getKeyForService("google_ads", "client_secret")}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {oauthLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      {getKeyForService("google_ads", "refresh_token") ? "إعادة الربط" : "ربط الحساب"}
                    </button>
                  </div>
                  {(!getKeyForService("google_ads", "client_id") || !getKeyForService("google_ads", "client_secret")) && (
                    <p className="text-xs text-amber-600 mt-3 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      أضف Client ID و Client Secret أولاً لتفعيل زر الربط
                    </p>
                  )}
                </div>
              )}

              {/* Google Ads Account Manager */}
              {activeConfig.id === "google_ads" && (
                <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden mb-6">
                  <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-l from-slate-50 to-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary-600" />
                        <h3 className="text-sm font-bold text-slate-900">إدارة الحسابات الإعلانية</h3>
                      </div>
                      <button
                        onClick={fetchGadsAccounts}
                        disabled={gadsLoading}
                        className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-600 hover:bg-primary-100 disabled:opacity-50 transition-colors"
                      >
                        {gadsLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        {gadsLoaded ? "تحديث" : "جلب الحسابات"}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      اختر الحسابات الإعلانية التي تريد إدارتها من النظام وسمّ كل حساب باسم النشاط التجاري
                    </p>
                  </div>

                  <div className="p-6">
                    {!gadsLoaded ? (
                      <div className="text-center py-8">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mx-auto mb-3">
                          <Users className="h-6 w-6" />
                        </div>
                        <p className="text-sm text-slate-500 mb-1">لم يتم جلب الحسابات بعد</p>
                        <p className="text-xs text-slate-400">اضغط &quot;جلب الحسابات&quot; لعرض جميع الحسابات المتاحة في Google Ads</p>
                      </div>
                    ) : gadsAccounts.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-slate-500">لا توجد حسابات متاحة</p>
                        <p className="text-xs text-slate-400 mt-1">تأكد من ربط حساب Google Ads أولاً</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {gadsAccounts.map((account) => (
                            <div
                              key={account.id}
                              className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                                account.selected
                                  ? "border-primary-200 bg-primary-50/50"
                                  : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                              }`}
                            >
                              <label className="relative flex cursor-pointer items-center">
                                <input
                                  type="checkbox"
                                  className="peer sr-only"
                                  checked={account.selected}
                                  onChange={() => toggleGadsAccount(account.id)}
                                />
                                <div className="flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all peer-checked:bg-primary-600 peer-checked:border-primary-600 border-slate-300">
                                  {account.selected && <Check className="h-3.5 w-3.5 text-white" />}
                                </div>
                              </label>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded" dir="ltr">
                                    {account.id.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}
                                  </span>
                                </div>
                                {account.selected && (
                                  <input
                                    type="text"
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                                    placeholder="اسم النشاط التجاري (مثال: الفاخر للشقق الفندقيه)"
                                    value={account.name}
                                    onChange={(e) => updateGadsName(account.id, e.target.value)}
                                    autoComplete="off"
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                          <p className="text-xs text-slate-500">
                            {gadsAccounts.filter((a) => a.selected).length} من {gadsAccounts.length} حساب مُختار
                          </p>
                          <button
                            onClick={saveGadsAccounts}
                            disabled={gadsSaving || gadsAccounts.filter((a) => a.selected).length === 0}
                            className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            {gadsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            حفظ الحسابات المُختارة
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Setup Guide */}
              <SetupGuide guide={activeConfig.guide} serviceId={activeConfig.id} />

              {/* Security Notice */}
              <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 p-4 mb-6">
                <Shield className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-blue-800">حماية البيانات</p>
                  <p className="text-[11px] text-blue-600 mt-0.5">
                    المفاتيح تُحفظ مشفرة في قاعدة البيانات. فقط المديرون يمكنهم عرضها أو تعديلها.
                    لتحديث مفتاح موجود، أدخل القيمة الجديدة واضغط حفظ.
                  </p>
                </div>
              </div>

              {/* API Key Fields */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-l from-slate-50 to-white">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary-600" />
                    <h3 className="text-sm font-bold text-slate-900">بيانات الاعتماد</h3>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Hidden fields to prevent Chrome from autofilling API key inputs with saved credentials */}
                  <input type="text" name="prevent_autofill_username" autoComplete="username" className="hidden" tabIndex={-1} aria-hidden="true" />
                  <input type="password" name="prevent_autofill_password" autoComplete="new-password" className="hidden" tabIndex={-1} aria-hidden="true" />
                  {activeConfig.keys.map((keyConfig) => {
                    const existing = getKeyForService(activeConfig.id, keyConfig.name);
                    const editKey = `${activeConfig.id}:${keyConfig.name}`;
                    const isEditing = editValues[editKey] !== undefined && editValues[editKey] !== "";
                    const isVisible = showValues[editKey];

                    return (
                      <div key={keyConfig.name}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-slate-700">
                            {keyConfig.label}
                          </label>
                          {existing && (
                            <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                              <CheckCircle className="h-3 w-3" />
                              محفوظ — {new Date(existing.created_at!).toLocaleDateString("ar")}
                            </span>
                          )}
                        </div>

                        {keyConfig.hint && (
                          <p className="text-xs text-slate-400 mb-2">{keyConfig.hint}</p>
                        )}

                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                            <input
                              type={isVisible ? "text" : "password"}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pe-10 ps-10 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all outline-none"
                              placeholder={existing ? existing.key_value : keyConfig.placeholder}
                              value={editValues[editKey] || ""}
                              onChange={(e) => setEditValues((prev) => ({ ...prev, [editKey]: e.target.value }))}
                              dir="ltr"
                              autoComplete="off"
                              data-1p-ignore
                              data-lpignore="true"
                              data-form-type="other"
                            />
                            <button
                              type="button"
                              onClick={() => setShowValues((prev) => ({ ...prev, [editKey]: !isVisible }))}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>

                          <button
                            onClick={() => handleSave(activeConfig.id, keyConfig.name)}
                            disabled={!isEditing || saving === editKey}
                            className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                            title="حفظ"
                          >
                            {saving === editKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Save All */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      const resetKeys: Record<string, string> = {};
                      activeConfig.keys.forEach((k) => { resetKeys[`${activeConfig.id}:${k.name}`] = ""; });
                      setEditValues((prev) => ({ ...prev, ...resetKeys }));
                    }}
                    className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    إلغاء التغييرات
                  </button>
                  <button
                    onClick={() => handleSaveAll(activeConfig)}
                    disabled={!activeConfig.keys.some((k) => editValues[`${activeConfig.id}:${k.name}`]?.trim())}
                    className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    حفظ جميع التغييرات
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
