"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Clock,
  Sparkles,
  Zap,
  RefreshCw,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrg } from "@/components/providers/org-context";

interface AiActivity {
  id: string;
  action_type: string;
  company_id: string | null;
  tokens_used: number;
  cost_estimate: number;
  created_at: string;
  action_data: any;
  result: any;
}

const CRON_JOBS = [
  { id: "daily-check", name: "فحص يومي", schedule: "يومياً 6 صباحاً", endpoint: "/api/cron/daily-check", description: "تحديث حالات العملاء وتنبيهات العقود" },
  { id: "publish-content", name: "نشر المحتوى", schedule: "كل ساعة", endpoint: "/api/cron/publish-content", description: "نشر المحتوى المجدول تلقائياً" },
  { id: "sync-engagement", name: "مزامنة التفاعلات", schedule: "كل 6 ساعات", endpoint: "/api/cron/sync-engagement", description: "تحديث بيانات التفاعل من المنصات" },
  { id: "monthly-planning", name: "تخطيط شهري", schedule: "أول كل شهر", endpoint: "/api/cron/monthly-planning", description: "إنشاء خطط تسويق شهرية بالـ AI" },
  { id: "monthly-report", name: "تقارير شهرية", schedule: "آخر كل شهر", endpoint: "/api/cron/monthly-report", description: "إنشاء تقارير الأداء الشهرية" },
  { id: "refresh-tokens", name: "تجديد الرموز", schedule: "أسبوعياً", endpoint: "/api/cron/refresh-tokens", description: "تجديد رموز الوصول للمنصات" },
  { id: "self-learn", name: "تعلم ذاتي", schedule: "أسبوعياً", endpoint: "/api/cron/self-learn", description: "تحليل الأداء وتحسين الاستراتيجيات" },
];

const ACTION_LABELS: Record<string, string> = {
  plan_generated: "إنشاء خطة تسويق",
  content_created: "توليد محتوى",
  campaign_optimized: "تحسين حملة",
  report_generated: "إنشاء تقرير",
  client_onboarding: "تجهيز عميل جديد",
  daily_check: "فحص يومي",
  monthly_planning: "تخطيط شهري",
  self_learning: "تعلم ذاتي",
  engagement_sync: "مزامنة تفاعلات",
};

export default function AutomationPage() {
  const [activities, setActivities] = useState<AiActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { org } = useOrg();

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/automation/activity");
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const totalTokens = activities.reduce((s, a) => s + (a.tokens_used || 0), 0);
  const totalCost = activities.reduce((s, a) => s + (a.cost_estimate || 0), 0);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            <Bot className="inline h-7 w-7 ml-2 text-amber-300" />
            مركز الأتمتة
          </h1>
          <p className="mt-1 text-text-muted">
            المهام التلقائية وسجل الذكاء الاصطناعي
          </p>
        </div>
        <Button variant="outline" onClick={fetchActivities}>
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-muted">إجمالي العمليات</p>
                <p className="mt-2 text-3xl font-bold text-text-primary">{activities.length}</p>
              </div>
              <div className="rounded-xl bg-purple-500/15 p-3 text-purple-400">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-muted">Tokens مستخدمة</p>
                <p className="mt-2 text-3xl font-bold text-text-primary">{formatNumber(totalTokens)}</p>
              </div>
              <div className="rounded-xl bg-blue-500/15 p-3 text-blue-400">
                <Zap className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-muted">التكلفة التقديرية</p>
                <p className="mt-2 text-3xl font-bold text-text-primary">${totalCost.toFixed(4)}</p>
              </div>
              <div className="rounded-xl bg-success-400/10 p-3 text-success-400">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-muted">المهام المجدولة</p>
                <p className="mt-2 text-3xl font-bold text-text-primary">{CRON_JOBS.length}</p>
              </div>
              <div className="rounded-xl bg-amber-500/15 p-3 text-amber-400">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cron Jobs */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>المهام التلقائية</CardTitle>
            <CardDescription>الجدول الزمني للعمليات الآلية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {CRON_JOBS.map((job) => (
                <div key={job.id} className="rounded-xl border border-border-subtle p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-text-secondary">{job.name}</span>
                    <Badge variant="success" className="text-[10px]">
                      <CheckCircle2 className="h-3 w-3 ml-1" />
                      مفعّل
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted">{job.description}</p>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-text-muted">
                    <Clock className="h-3 w-3" />
                    {job.schedule}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>سجل نشاط الذكاء الاصطناعي</CardTitle>
            <CardDescription>آخر {activities.length} عملية</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.slice(0, 20).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 rounded-xl border border-border-subtle p-4">
                    <div className="rounded-lg bg-purple-500/15 p-2.5 text-purple-400">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-text-secondary">
                          {ACTION_LABELS[activity.action_type] || activity.action_type}
                        </p>
                        <span className="text-[11px] text-text-muted">
                          {new Date(activity.created_at).toLocaleDateString("ar-SA", {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
                        {activity.tokens_used > 0 && (
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {formatNumber(activity.tokens_used)} tokens
                          </span>
                        )}
                        {activity.cost_estimate > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${activity.cost_estimate.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <Bot className="h-10 w-10 text-text-muted" />
                <p className="text-sm text-text-muted">لم يتم تسجيل أي نشاط بعد</p>
                <p className="text-xs text-text-muted">ستظهر هنا عمليات الذكاء الاصطناعي والمهام الآلية</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
