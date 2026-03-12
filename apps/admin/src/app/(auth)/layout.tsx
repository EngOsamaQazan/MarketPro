"use client";

import { Sparkles, Bot, BarChart3, Globe } from "lucide-react";

const features = [
  { icon: Bot, text: "ذكاء اصطناعي يولّد المحتوى والحملات تلقائياً" },
  { icon: Globe, text: "إدارة جميع منصات التواصل من مكان واحد" },
  { icon: BarChart3, text: "تحليلات وتقارير ذكية لقياس الأداء" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-surface-void" dir="rtl">
      {/* Form Side */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-[45%]">
        {children}
      </div>

      {/* Brand Panel */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[55%] items-center justify-center">
        {/* Layered backgrounds */}
        <div className="absolute inset-0 bg-surface-base" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, rgba(212,165,116,0.12) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(184,132,60,0.08) 0%, transparent 50%)",
          }}
        />
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #D4A574 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Animated shapes */}
        <div className="auth-shape auth-shape-1" />
        <div className="auth-shape auth-shape-2" />
        <div className="auth-shape auth-shape-3" />
        <div className="auth-shape auth-shape-4" />

        {/* Content */}
        <div className="relative z-10 max-w-lg px-12 text-right">
          <div className="mb-10 flex h-16 w-16 items-center justify-center rounded-2xl gradient-amber glow-amber">
            <Sparkles className="h-8 w-8 text-text-inverse" />
          </div>

          <h2 className="text-4xl font-bold leading-[1.4] text-text-primary">
            أتمتة تسويقك
            <br />
            <span className="text-gradient-amber">بقوة الذكاء الاصطناعي</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-text-secondary">
            منصة سطوة تدير حملاتك التسويقية وتنشئ المحتوى وتحلل الأداء
            عبر جميع المنصات — كل ذلك تلقائياً.
          </p>

          <div className="mt-10 space-y-5">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-300/10">
                  <f.icon className="h-5 w-5 text-amber-300" />
                </div>
                <span className="text-sm text-text-secondary">{f.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-14 flex items-center gap-3 border-t border-border-subtle pt-8">
            <div className="flex -space-x-2 space-x-reverse">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full border-2 border-surface-base bg-surface-elevated"
                  style={{
                    background: `linear-gradient(135deg, hsl(${30 + i * 15}, 60%, ${35 + i * 8}%), hsl(${30 + i * 15}, 50%, ${25 + i * 5}%))`,
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-text-muted">
              +200 وكالة تسويق تثق بسطوة
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
