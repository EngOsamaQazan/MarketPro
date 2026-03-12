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

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("حدث خطأ غير متوقع");
      setLoading(false);
    }
  }

  const currentMethod = loginMethods.find((m) => m.key === method)!;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface-void overflow-hidden">
      <div className="absolute inset-0 gradient-radial-amber opacity-60" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Brand */}
        <div className="mb-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-amber glow-amber">
            <Sparkles className="h-8 w-8 text-text-inverse" />
          </div>
          <h1 className="mt-5 text-3xl font-bold text-text-primary">سطوة</h1>
          <p className="mt-1 text-sm text-text-muted">ذكاء اصطناعي يدير تسويقك</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border-subtle bg-surface-card p-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-text-primary">مرحباً بعودتك</h2>
            <p className="mt-2 text-sm text-text-secondary">سجل دخولك للوصول إلى لوحة التحكم</p>
          </div>

          {/* Login Method Tabs */}
          <div className="mt-6 flex rounded-xl bg-surface-inset p-1">
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
                    ? "bg-amber-300/15 text-amber-300 shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-error-400/20 bg-error-400/10 p-4 text-sm text-error-400">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {currentMethod.label}
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
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
              <label className="block text-sm font-medium text-text-secondary mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3.5 text-base glow-amber-sm"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "تسجيل الدخول"
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-text-muted">
          © {new Date().getFullYear()} سطوة. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
}
