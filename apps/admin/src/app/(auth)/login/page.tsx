"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Lock, Eye, EyeOff, Loader2, User } from "lucide-react";

function detectIdentifierType(value: string): "email" | "phone" | "username" {
  const trimmed = value.trim();
  if (trimmed.includes("@")) return "email";
  if (/^\+?\d[\d\s-]{6,}$/.test(trimmed)) return "phone";
  return "username";
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const type = detectIdentifierType(identifier);
      let email = identifier.trim();

      if (type !== "email") {
        const res = await fetch("/api/auth/resolve-identity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: email }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "لم يتم العثور على الحساب");
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

  return (
    <div className="w-full max-w-[420px]">
      {/* Mobile brand */}
      <div className="mb-10 flex items-center gap-3 lg:mb-12">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-amber glow-amber-sm">
          <Sparkles className="h-5 w-5 text-text-inverse" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">سطوة</h1>
          <p className="text-xs text-text-muted">منصة أتمتة التسويق</p>
        </div>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary">
          مرحباً بعودتك
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          سجل دخولك للمتابعة إلى لوحة التحكم
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-error-400/20 bg-error-400/10 px-4 py-3 text-sm text-error-400">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            البريد، اسم المستخدم، أو رقم الهاتف
          </label>
          <div className="relative">
            <User className="absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="example@email.com"
              className="input-field pr-11"
              required
              dir="ltr"
              autoComplete="username"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-text-secondary">
              كلمة المرور
            </label>
            <button
              type="button"
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
              tabIndex={-1}
            >
              نسيت كلمة المرور؟
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-text-muted" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field pr-11 pl-11"
              required
              dir="ltr"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-[18px] w-[18px]" />
              ) : (
                <Eye className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full !py-3.5 text-sm glow-amber-sm"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "تسجيل الدخول"
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-text-muted">
        ليس لديك حساب؟{" "}
        <Link
          href="/register"
          className="font-medium text-amber-400 hover:text-amber-300 transition-colors"
        >
          أنشئ حساباً جديداً
        </Link>
      </p>

      <p className="mt-10 text-center text-xs text-text-muted/60">
        © {new Date().getFullYear()} سطوة. جميع الحقوق محفوظة.
      </p>
    </div>
  );
}
