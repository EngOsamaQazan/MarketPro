"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Link2,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  { id: 1, title: "معلومات المنظمة", icon: Building2 },
  { id: 2, title: "ربط المنصات", icon: Link2 },
  { id: 3, title: "إضافة عميل", icon: Users },
];

const PLATFORMS = [
  { key: "meta", label: "Meta (Facebook & Instagram)", color: "bg-blue-500" },
  { key: "google_ads", label: "Google Ads", color: "bg-red-500" },
  { key: "tiktok", label: "TikTok", color: "bg-slate-700" },
  { key: "x", label: "X (Twitter)", color: "bg-slate-800" },
  { key: "snapchat", label: "Snapchat", color: "bg-yellow-400" },
  { key: "linkedin", label: "LinkedIn", color: "bg-blue-700" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [orgData, setOrgData] = useState({
    name: "",
    name_en: "",
    website: "",
    description: "",
  });

  const [clientData, setClientData] = useState({
    name: "",
    industry: "",
    country: "SA",
    city: "",
    monthly_budget: "",
    contract_start_date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    async function loadOrg() {
      try {
        const res = await fetch("/api/organizations");
        if (res.ok) {
          const data = await res.json();
          if (data.organization) {
            setOrgData((prev) => ({
              ...prev,
              name: data.organization.name || "",
              name_en: data.organization.name_en || "",
              website: data.organization.website || "",
            }));
          }
        }
      } catch {
        // ignore
      }
    }
    loadOrg();
  }, []);

  const handleSaveOrg = useCallback(async () => {
    setLoading(true);
    try {
      await fetch("/api/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgData.name,
          name_en: orgData.name_en || null,
          website: orgData.website || null,
          settings: { description: orgData.description },
        }),
      });
    } catch {
      // continue
    } finally {
      setLoading(false);
    }
  }, [orgData]);

  const handleAddClient = useCallback(async () => {
    if (!clientData.name) return;
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...clientData,
          monthly_budget: Number(clientData.monthly_budget) || 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "فشل في إضافة العميل");
      }
    } catch {
      // continue
    } finally {
      setLoading(false);
    }
  }, [clientData]);

  const handleNext = async () => {
    if (step === 1) await handleSaveOrg();
    if (step === 3) {
      if (clientData.name) await handleAddClient();
      await completeOnboarding();
      return;
    }
    setStep((s) => s + 1);
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      await fetch("/api/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { onboarding_completed: true } }),
      });
    } catch {
      // continue
    }
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-void p-6" dir="rtl">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-amber glow-amber">
            <Sparkles className="h-7 w-7 text-text-inverse" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">مرحباً بك في سطوة</h1>
          <p className="mt-1 text-sm text-text-secondary">
            دعنا نُعدّ حسابك في بضع خطوات بسيطة
          </p>
        </div>

        <div className="mb-8 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  step > s.id
                    ? "bg-amber-300 text-text-inverse"
                    : step === s.id
                      ? "bg-amber-300/20 text-amber-300 ring-2 ring-amber-300/40"
                      : "bg-surface-elevated text-text-muted"
                }`}
              >
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span
                className={`hidden text-xs font-medium sm:block ${
                  step === s.id ? "text-amber-300" : "text-text-muted"
                }`}
              >
                {s.title}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`mx-1 h-px w-8 ${step > s.id ? "bg-amber-300" : "bg-border-subtle"}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="border-border-subtle bg-surface-card">
          <CardContent className="p-8">
            {step === 1 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-text-primary">معلومات المنظمة</h3>
                <p className="text-sm text-text-secondary">أكمل بيانات منظمتك الأساسية</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-text-secondary">اسم المنظمة (عربي)</Label>
                    <Input
                      value={orgData.name}
                      onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                      className="mt-1.5 bg-surface-base border-border-default"
                    />
                  </div>
                  <div>
                    <Label className="text-text-secondary">اسم المنظمة (إنجليزي)</Label>
                    <Input
                      value={orgData.name_en}
                      onChange={(e) => setOrgData({ ...orgData, name_en: e.target.value })}
                      className="mt-1.5 bg-surface-base border-border-default"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-text-secondary">الموقع الإلكتروني</Label>
                  <Input
                    value={orgData.website}
                    onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
                    placeholder="https://example.com"
                    className="mt-1.5 bg-surface-base border-border-default"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label className="text-text-secondary">وصف المنظمة</Label>
                  <Textarea
                    value={orgData.description}
                    onChange={(e) => setOrgData({ ...orgData, description: e.target.value })}
                    placeholder="نبذة مختصرة عن نشاطكم..."
                    className="mt-1.5 bg-surface-base border-border-default min-h-[80px]"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-text-primary">ربط المنصات</h3>
                <p className="text-sm text-text-secondary">
                  اربط حساباتك على منصات التواصل الاجتماعي (يمكنك تخطي هذه الخطوة)
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => {
                        window.open(
                          `/api/social-accounts/connect?platform=${p.key}&company_id=admin`,
                          "_blank",
                          "width=600,height=700"
                        );
                      }}
                      className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-base p-4 text-right transition-all hover:border-amber-400/40 hover:bg-surface-hover"
                    >
                      <div className={`h-3 w-3 rounded-full ${p.color}`} />
                      <span className="text-sm font-medium text-text-primary">{p.label}</span>
                      <Link2 className="mr-auto h-4 w-4 text-text-muted" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-text-primary">أضف عميلك الأول</h3>
                <p className="text-sm text-text-secondary">
                  أضف عميلاً لتبدأ بإدارة تسويقه (يمكنك تخطي هذه الخطوة)
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-text-secondary">اسم العميل</Label>
                    <Input
                      value={clientData.name}
                      onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                      className="mt-1.5 bg-surface-base border-border-default"
                    />
                  </div>
                  <div>
                    <Label className="text-text-secondary">المجال</Label>
                    <Input
                      value={clientData.industry}
                      onChange={(e) => setClientData({ ...clientData, industry: e.target.value })}
                      placeholder="مطاعم، عقارات، تقنية..."
                      className="mt-1.5 bg-surface-base border-border-default"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-text-secondary">الدولة</Label>
                    <Input
                      value={clientData.country}
                      onChange={(e) => setClientData({ ...clientData, country: e.target.value })}
                      className="mt-1.5 bg-surface-base border-border-default"
                    />
                  </div>
                  <div>
                    <Label className="text-text-secondary">المدينة</Label>
                    <Input
                      value={clientData.city}
                      onChange={(e) => setClientData({ ...clientData, city: e.target.value })}
                      className="mt-1.5 bg-surface-base border-border-default"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-text-secondary">الميزانية الشهرية (ر.س)</Label>
                  <Input
                    type="number"
                    value={clientData.monthly_budget}
                    onChange={(e) => setClientData({ ...clientData, monthly_budget: e.target.value })}
                    placeholder="5000"
                    className="mt-1.5 bg-surface-base border-border-default"
                    dir="ltr"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button
                variant="ghost"
                onClick={() => setStep((s) => s - 1)}
                className="text-text-secondary hover:text-text-primary"
              >
                <ChevronRight className="ml-1 h-4 w-4" />
                السابق
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (step === 3) completeOnboarding();
                  else setStep((s) => s + 1);
                }}
                className="text-text-muted hover:text-text-secondary"
              >
                تخطي
              </Button>
            )}
            <Button onClick={handleNext} disabled={loading} className="btn-primary">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : step === 3 ? (
                <>إنهاء الإعداد <Check className="mr-1 h-4 w-4" /></>
              ) : (
                <>التالي <ChevronLeft className="mr-1 h-4 w-4" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
