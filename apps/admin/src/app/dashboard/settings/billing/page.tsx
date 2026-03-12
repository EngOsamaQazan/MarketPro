"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard,
  Loader2,
  Check,
  Zap,
  Users,
  FileText,
  Megaphone,
  Sparkles,
  Crown,
  ArrowUpRight,
} from "lucide-react";
import { useOrg } from "@/components/providers/org-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface Plan {
  id: string;
  name: string;
  name_ar: string;
  price_monthly: number;
  price_yearly: number;
  limits: Record<string, number>;
  features: string[];
}

interface Usage {
  clients: number;
  posts_this_month: number;
  campaigns: number;
  ai_credits: number;
  team_members: number;
}

interface OrgInfo {
  id: string;
  name: string;
  plan: string;
  plan_expires_at: string | null;
  limits: Record<string, number>;
}

const usageMetrics = [
  { key: "clients", limitKey: "max_clients", label: "العملاء", icon: Users },
  { key: "posts_this_month", limitKey: "max_posts_month", label: "المنشورات (هذا الشهر)", icon: FileText },
  { key: "campaigns", limitKey: "max_campaigns", label: "الحملات", icon: Megaphone },
  { key: "ai_credits", limitKey: "ai_credits_month", label: "رصيد AI (هذا الشهر)", icon: Sparkles },
  { key: "team_members", limitKey: "max_team_members", label: "أعضاء الفريق", icon: Users },
];

export default function BillingSettingsPage() {
  const { canManage, refreshOrg } = useOrg();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription");
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
        setUsage(data.usage || null);
        setOrgInfo(data.organization || null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChangePlan = async (planId: string) => {
    if (!canManage) return;
    setUpgrading(planId);
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "تم تحديث الاشتراك", description: data.message });
      await refreshOrg();
      fetchData();
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
      </div>
    );
  }

  const currentPlan = plans.find((p) => p.id === orgInfo?.plan) || null;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="border-border-subtle bg-surface-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-text-primary">
            <CreditCard className="h-5 w-5 text-amber-300" />
            الباقة الحالية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-300/10">
              <Crown className="h-7 w-7 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                {currentPlan?.name_ar || "مجاني"}
              </h3>
              <p className="text-sm text-text-secondary">
                {currentPlan?.price_monthly
                  ? `$${currentPlan.price_monthly}/شهر`
                  : "مجاناً"}
                {orgInfo?.plan_expires_at && (
                  <span className="mr-2 text-text-muted">
                    · تنتهي في{" "}
                    {new Date(orgInfo.plan_expires_at).toLocaleDateString("ar-SA")}
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      {usage && orgInfo && (
        <Card className="border-border-subtle bg-surface-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-text-primary">
              <Zap className="h-5 w-5 text-amber-300" />
              الاستخدام الحالي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {usageMetrics.map((m) => {
              const current = (usage as any)[m.key] || 0;
              const limit = orgInfo.limits?.[m.limitKey] ?? -1;
              const isUnlimited = limit === -1;
              const percentage = isUnlimited ? 0 : limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
              const isNearLimit = !isUnlimited && percentage >= 80;
              const Icon = m.icon;

              return (
                <div key={m.key}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-text-muted" />
                      <span className="text-sm text-text-secondary">{m.label}</span>
                    </div>
                    <span className="text-sm font-medium text-text-primary">
                      {current}
                      {isUnlimited ? (
                        <span className="text-text-muted"> / ∞</span>
                      ) : (
                        <span className="text-text-muted"> / {limit}</span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-base overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isNearLimit ? "bg-error-400" : "bg-amber-300"
                      }`}
                      style={{ width: isUnlimited ? "5%" : `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-text-primary">الباقات المتاحة</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === orgInfo?.plan;
            return (
              <Card
                key={plan.id}
                className={`border transition-all ${
                  isCurrent
                    ? "border-amber-400 bg-amber-300/5 ring-1 ring-amber-400/20"
                    : "border-border-subtle bg-surface-card hover:border-border-default"
                }`}
              >
                <CardContent className="p-5">
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-text-primary">{plan.name_ar}</h4>
                      {isCurrent && (
                        <Badge className="bg-amber-300/15 text-amber-300 border-amber-400/30">
                          الحالية
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-bold text-text-primary">
                        ${plan.price_monthly}
                      </span>
                      <span className="text-sm text-text-muted">/شهر</span>
                    </div>
                    {plan.price_yearly > 0 && (
                      <p className="mt-0.5 text-xs text-text-muted">
                        ${plan.price_yearly}/سنة (وفّر{" "}
                        {Math.round(
                          ((plan.price_monthly * 12 - plan.price_yearly) /
                            (plan.price_monthly * 12)) *
                            100
                        )}
                        %)
                      </p>
                    )}
                  </div>

                  <ul className="mb-5 space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                        <Check className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {canManage && (
                    <Button
                      onClick={() => !isCurrent && handleChangePlan(plan.id)}
                      disabled={isCurrent || upgrading !== null}
                      className={`w-full text-sm ${
                        isCurrent
                          ? "bg-surface-elevated text-text-muted cursor-default"
                          : "btn-primary"
                      }`}
                      size="sm"
                    >
                      {upgrading === plan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isCurrent ? (
                        "باقتك الحالية"
                      ) : plan.price_monthly > (currentPlan?.price_monthly || 0) ? (
                        <>
                          ترقية
                          <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                        </>
                      ) : (
                        "تغيير"
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
