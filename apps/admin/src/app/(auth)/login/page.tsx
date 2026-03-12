"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Sparkles, User, Lock, Eye, EyeOff, Loader2, Mail, Phone, AtSign } from "lucide-react";

type LoginMethod = "email" | "username" | "phone";

const loginMethods: { key: LoginMethod; label: string; icon: React.ReactNode; placeholder: string }[] = [
  { key: "email", label: "البريد الإلكتروني", icon: <Mail className="h-4 w-4" />, placeholder: "example@email.com" },
  { key: "username", label: "اسم المستخدم", icon: <AtSign className="h-4 w-4" />, placeholder: "username" },
  { key: "phone", label: "رقم الهاتف", icon: <Phone className="h-4 w-4" />, placeholder: "0797707062" },
];

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<LoginMethod>("email");
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let email = identifier.trim();

      if (method !== "email") {
        const res = await fetch("/api/auth/resolve-identity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: identifier.trim() }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "حدث خطأ أثناء التحقق");
          setLoading(false);
          return;
        }

        email = data.email;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "بيانات الدخول غير صحيحة"
            : authError.message
        );
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("حدث خطأ غير متوقع");
      setLoading(false);
    }
  }

  const currentMethod = loginMethods.find((m) => m.key === method)!;

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full items-center justify-center px-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/30">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">سطوة</h1>
              <p className="text-sm text-slate-400">ذكاء اصطناعي يدير تسويقك</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900">مرحباً بعودتك</h2>
          <p className="mt-2 text-slate-500">سجل دخولك للوصول إلى لوحة التحكم</p>

          {/* Login Method Tabs */}
          <div className="mt-6 flex rounded-xl bg-slate-100 p-1">
            {loginMethods.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  setMethod(m.key);
                  setIdentifier("");
                  setError("");
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                  method === m.key
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {currentMethod.label}
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type={method === "email" ? "email" : "text"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={currentMethod.placeholder}
                  className="input-field ps-10"
                  required
                  dir="ltr"
                  autoComplete={method === "email" ? "email" : method === "phone" ? "tel" : "username"}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field ps-12"
                  required
                  dir="ltr"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3.5 text-base"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "تسجيل الدخول"
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 p-12">
        <div className="max-w-lg text-center text-white">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm mb-8">
            <Sparkles className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-bold">
            نظام إدارة التسويق الرقمي الذكي
          </h2>
          <p className="mt-4 text-lg text-white/70 leading-relaxed">
            أدِر حملاتك الإعلانية، أنشئ محتوى احترافي، وحقق أفضل النتائج
            باستخدام الذكاء الاصطناعي
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { value: "24/7", label: "مراقبة مستمرة" },
              { value: "AI", label: "ذكاء اصطناعي" },
              { value: "7+", label: "منصات مدعومة" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="mt-1 text-xs text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
