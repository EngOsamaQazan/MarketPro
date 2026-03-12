"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  User,
  Mail,
  Building2,
} from "lucide-react";

type OrgType = "agency" | "brand";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState<OrgType>("agency");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            org_name: orgName.trim() || fullName.trim(),
            org_type: orgType,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("هذا البريد الإلكتروني مسجل مسبقاً");
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("حدث خطأ غير متوقع");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[420px] py-8">
      {/* Mobile brand */}
      <div className="mb-8 flex items-center gap-3 lg:mb-10">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-amber glow-amber-sm">
          <Sparkles className="h-5 w-5 text-text-inverse" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">سطوة</h1>
          <p className="text-xs text-text-muted">منصة أتمتة التسويق</p>
        </div>
      </div>

      {/* Heading */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary">
          أنشئ حسابك
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          ابدأ بإدارة تسويقك تلقائياً خلال دقائق
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-error-400/20 bg-error-400/10 px-4 py-3 text-sm text-error-400">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            الاسم الكامل
          </label>
          <div className="relative">
            <User className="absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="أدخل اسمك الكامل"
              className="input-field pr-11"
              required
              autoComplete="name"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            البريد الإلكتروني
          </label>
          <div className="relative">
            <Mail className="absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-text-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="input-field pr-11"
              required
              dir="ltr"
              autoComplete="email"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="input-field pr-11"
                required
                dir="ltr"
                autoComplete="new-password"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              تأكيد كلمة المرور
            </label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-text-muted" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="input-field pr-11"
                required
                dir="ltr"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            اسم المنظمة / الشركة
          </label>
          <div className="relative">
            <Building2 className="absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="اسم شركتك أو وكالتك"
              className="input-field pr-11"
              autoComplete="organization"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            نوع المنظمة
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOrgType("agency")}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                orgType === "agency"
                  ? "border-amber-400 bg-amber-300/10 text-amber-300"
                  : "border-border-default bg-surface-card text-text-secondary hover:border-border-strong"
              }`}
            >
              وكالة تسويق
            </button>
            <button
              type="button"
              onClick={() => setOrgType("brand")}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                orgType === "brand"
                  ? "border-amber-400 bg-amber-300/10 text-amber-300"
                  : "border-border-default bg-surface-card text-text-secondary hover:border-border-strong"
              }`}
            >
              علامة تجارية
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full !py-3.5 text-sm glow-amber-sm !mt-6"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "إنشاء الحساب"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        لديك حساب بالفعل؟{" "}
        <Link
          href="/login"
          className="font-medium text-amber-400 hover:text-amber-300 transition-colors"
        >
          سجل دخولك
        </Link>
      </p>

      <p className="mt-8 text-center text-xs text-text-muted/60">
        © {new Date().getFullYear()} سطوة. جميع الحقوق محفوظة.
      </p>
    </div>
  );
}
