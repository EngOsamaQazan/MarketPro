import Link from "next/link";
import {
  Sparkles,
  Brain,
  BarChart3,
  Megaphone,
  FileText,
  Bot,
  Users,
  ArrowLeft,
  CheckCircle2,
  Zap,
  Shield,
  Globe,
  ChevronLeft,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "خطط تسويقية ذكية",
    description: "يحلل بيانات شركتك وينشئ خطة تسويقية شهرية شاملة بضغطة زر واحدة",
  },
  {
    icon: Sparkles,
    title: "محتوى بالذكاء الاصطناعي",
    description: "يكتب منشورات احترافية بالعربية لكل منصة مع هاشتاقات وتوقيت نشر مثالي",
  },
  {
    icon: Megaphone,
    title: "إدارة حملات متعددة المنصات",
    description: "أنشئ وراقب وحسّن حملاتك الإعلانية على Meta وGoogle Ads من مكان واحد",
  },
  {
    icon: BarChart3,
    title: "تقارير تلقائية PDF",
    description: "تقارير أداء شهرية احترافية تُرسل لعملائك تلقائياً مع رؤى الذكاء الاصطناعي",
  },
  {
    icon: Bot,
    title: "أتمتة كاملة",
    description: "جدولة، نشر، تحسين، وإعادة استهداف — كل شيء يعمل بشكل تلقائي 24/7",
  },
  {
    icon: Users,
    title: "بوابة عملاء",
    description: "تطبيق جوال لعملائك يعرض التقارير والخطط ويتيح لهم الموافقة على المحتوى",
  },
];

const steps = [
  {
    number: "01",
    title: "اربط حساباتك",
    description: "اربط منصات التواصل الاجتماعي والإعلانات في دقائق",
  },
  {
    number: "02",
    title: "أطلق الذكاء",
    description: "الذكاء الاصطناعي يحلل بياناتك ويبني خطة تسويقية محكمة",
  },
  {
    number: "03",
    title: "راقب النتائج",
    description: "تابع أداء حملاتك ومحتواك من لوحة تحكم واحدة",
  },
  {
    number: "04",
    title: "وسّع النطاق",
    description: "أضف عملاء جدد وادر عشرات الحسابات بنفس الكفاءة",
  },
];

const platforms = [
  { name: "Meta", emoji: "📘" },
  { name: "Instagram", emoji: "📸" },
  { name: "Google Ads", emoji: "🔍" },
  { name: "TikTok", emoji: "🎵" },
  { name: "Snapchat", emoji: "👻" },
  { name: "X", emoji: "𝕏" },
  { name: "LinkedIn", emoji: "💼" },
  { name: "YouTube", emoji: "▶️" },
];

const whySatwa = [
  { icon: Globe, title: "عربية أولاً", description: "مبنية للسوق العربي بمحتوى ذكاء اصطناعي عربي أصيل" },
  { icon: Brain, title: "ذكاء اصطناعي حقيقي", description: "ليست مجرد أتمتة — تحليل وتخطيط واتخاذ قرارات ذكية" },
  { icon: Zap, title: "سرعة التنفيذ", description: "من الفكرة إلى التنفيذ في دقائق بدل أيام" },
  { icon: Shield, title: "أمان وخصوصية", description: "بياناتك محمية ومشفرة بأعلى معايير الأمان" },
];

const stats = [
  { value: "8+", label: "منصات مدعومة" },
  { value: "24/7", label: "عمل متواصل" },
  { value: "PDF", label: "تقارير تلقائية" },
  { value: "AI", label: "ذكاء اصطناعي" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-void text-text-primary">
      {/* Navbar */}
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-border-subtle bg-surface-void/80 backdrop-blur-xl">
        <div className="section-wrapper flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-amber">
              <Sparkles className="h-4 w-4 text-text-inverse" />
            </div>
            <span className="text-lg font-bold text-text-primary">سطوة</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/login"
              className="btn-primary text-sm px-5 py-2.5"
            >
              ابدأ الآن
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0 gradient-radial-amber" />
        <div className="section-wrapper relative">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/5 px-4 py-2 text-sm text-amber-200">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>منصة عربية بالذكاء الاصطناعي</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              تسويقك الرقمي،{" "}
              <span className="text-gradient-amber">بسطوة الذكاء الاصطناعي</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-text-secondary sm:text-xl">
              منصة عربية متكاملة تدير حملاتك الإعلانية، تصنع محتواك، وتحلل أداءك — بذكاء لا ينام
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/login" className="btn-primary text-base px-8 py-4 glow-amber">
                ابدأ الآن
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <a href="#features" className="btn-secondary text-base px-8 py-4">
                استكشف المنصة
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* What is Satwa */}
      <section className="section-padding border-t border-border-subtle">
        <div className="section-wrapper">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold lg:text-4xl">
              ما هي <span className="text-gradient-amber">سطوة</span>؟
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">
              سطوة ليست أداة تسويق عادية. هي مركز قيادة رقمي يعمل بالذكاء الاصطناعي —
              تحلل سوقك، تبني خططك، تصنع محتواك، تدير حملاتك، وترسل تقاريرك...
              كل ذلك بشكل آلي ومستمر.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section-padding border-t border-border-subtle">
        <div className="section-wrapper">
          <div className="text-center">
            <h2 className="text-3xl font-bold lg:text-4xl">قدرات المنصة</h2>
            <p className="mx-auto mt-4 max-w-xl text-text-secondary">
              كل ما تحتاجه لإدارة التسويق الرقمي في مكان واحد
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border-subtle bg-surface-card p-8 transition-all hover:border-amber-300/30 hover:bg-surface-elevated"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300 transition-all group-hover:glow-amber-sm">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-text-primary">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding border-t border-border-subtle bg-surface-base">
        <div className="section-wrapper">
          <div className="text-center">
            <h2 className="text-3xl font-bold lg:text-4xl">كيف تعمل سطوة؟</h2>
            <p className="mx-auto mt-4 max-w-xl text-text-secondary">
              أربع خطوات بسيطة للانطلاق
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/5 text-2xl font-bold text-amber-300">
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute left-0 top-8 hidden h-px w-full -translate-x-1/2 bg-gradient-to-l from-transparent via-border-default to-transparent lg:block" />
                )}
                <h3 className="mt-5 text-base font-bold text-text-primary">{step.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="section-padding border-t border-border-subtle">
        <div className="section-wrapper">
          <div className="text-center">
            <h2 className="text-3xl font-bold lg:text-4xl">المنصات المدعومة</h2>
            <p className="mx-auto mt-4 max-w-xl text-text-secondary">
              إدارة شاملة لجميع منصات التواصل الاجتماعي والإعلانات
            </p>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-card px-6 py-4 transition-all hover:border-border-default"
              >
                <span className="text-2xl">{platform.emoji}</span>
                <span className="text-sm font-semibold text-text-primary">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Satwa */}
      <section className="section-padding border-t border-border-subtle bg-surface-base">
        <div className="section-wrapper">
          <div className="text-center">
            <h2 className="text-3xl font-bold lg:text-4xl">لماذا سطوة؟</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whySatwa.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border-subtle bg-surface-card p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-bold text-text-primary">{item.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-padding border-t border-border-subtle">
        <div className="section-wrapper">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border-subtle bg-surface-card p-8 text-center">
                <p className="text-4xl font-bold text-gradient-amber">{stat.value}</p>
                <p className="mt-2 text-sm text-text-secondary">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding border-t border-border-subtle relative overflow-hidden">
        <div className="absolute inset-0 gradient-radial-amber" />
        <div className="section-wrapper relative text-center">
          <h2 className="text-3xl font-bold lg:text-4xl">
            جاهز تسيطر على تسويقك؟
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-text-secondary">
            انضم الآن واجعل الذكاء الاصطناعي يدير تسويقك الرقمي بالكامل
          </p>
          <div className="mt-8">
            <Link href="/login" className="btn-primary text-base px-10 py-4 glow-amber">
              ابدأ مجاناً
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-surface-base py-12">
        <div className="section-wrapper">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-amber">
                <Sparkles className="h-4 w-4 text-text-inverse" />
              </div>
              <span className="text-base font-bold text-text-primary">سطوة</span>
            </div>
            <p className="text-sm text-text-muted">
              © {new Date().getFullYear()} سطوة. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
