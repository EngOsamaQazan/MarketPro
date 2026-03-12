"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Megaphone,
  TrendingUp,
  DollarSign,
  CalendarDays,
  FileText,
  Sparkles,
  Loader2,
  Link2,
  RefreshCw,
  BarChart3,
  Clock,
  Building2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useClient } from "@/components/providers/client-context";
import { useOrg } from "@/components/providers/org-context";

interface DashboardStats {
  total_clients: number;
  active_clients: number;
  total_monthly_revenue: number;
  total_posts_this_month: number;
  published_posts: number;
  scheduled_posts: number;
  active_campaigns: number;
  total_ad_spend: number;
  total_ad_budget: number;
  active_plans: number;
  connected_accounts: number;
  total_followers: number;
}

interface PlatformBreakdown {
  [key: string]: {
    posts: number;
    campaigns: number;
    accounts: number;
    followers: number;
  };
}

const quickActions = [
  {
    icon: Sparkles,
    title: "إنشاء خطة بالذكاء الاصطناعي",
    description: "أنشئ خطة تسويق شهرية كاملة",
    color: "from-purple-500 to-indigo-600",
    href: "/plans",
  },
  {
    icon: CalendarDays,
    title: "جدولة محتوى",
    description: "أضف منشورات للتقويم",
    color: "from-emerald-500 to-teal-600",
    href: "/content",
  },
  {
    icon: Megaphone,
    title: "إطلاق حملة إعلانية",
    description: "أنشئ حملة على أي منصة",
    color: "from-blue-500 to-cyan-600",
    href: "/campaigns",
  },
  {
    icon: FileText,
    title: "إنشاء تقرير",
    description: "أنشئ تقرير أداء شهري PDF",
    color: "from-amber-500 to-orange-600",
    href: "/reports",
  },
];

const PLATFORM_LABELS: Record<string, string> = {
  facebook: "فيسبوك",
  instagram: "إنستغرام",
  meta: "ميتا",
  tiktok: "تيك توك",
  snapchat: "سناب شات",
  x: "إكس",
  linkedin: "لينكدإن",
  youtube: "يوتيوب",
  google_ads: "Google Ads",
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "bg-blue-100 text-blue-600",
  instagram: "bg-pink-100 text-pink-600",
  meta: "bg-blue-100 text-blue-600",
  tiktok: "bg-slate-100 text-slate-800",
  snapchat: "bg-yellow-100 text-yellow-600",
  x: "bg-sky-100 text-sky-600",
  linkedin: "bg-indigo-100 text-indigo-600",
  youtube: "bg-red-100 text-red-600",
  google_ads: "bg-green-100 text-green-600",
};

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-20" />
              <Skeleton className="mt-4 h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { selectedClientId, selectedClient } = useClient();
  const { org } = useOrg();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [platformBreakdown, setPlatformBreakdown] = useState<PlatformBreakdown>({});
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedClientId
        ? `/api/dashboard?client_id=${selectedClientId}`
        : "/api/dashboard";
      const res = await fetch(url);
      const data = await res.json();
      setStats(data.stats || null);
      setPlatformBreakdown(data.platform_breakdown || {});
      setRecentActivity(data.recent_activity || []);
      setCompanies(data.companies || []);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [selectedClientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <DashboardSkeleton />;

  const pageTitle = selectedClient
    ? `لوحة تحكم ${selectedClient.name}`
    : "لوحة التحكم الرئيسية";

  const pageSubtitle = selectedClient
    ? `${selectedClient.industry} • ${formatCurrency(selectedClient.monthly_budget)}/شهر`
    : `${org?.name || "سطوة"} • ${stats?.active_clients || 0} عميل نشط`;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{pageTitle}</h1>
          <p className="mt-1 text-slate-500">{pageSubtitle}</p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      {!stats?.connected_accounts && !selectedClientId && (
        <Alert variant="warning">
          <Link2 className="h-5 w-5" />
          <AlertTitle>لم يتم ربط أي حساب بعد</AlertTitle>
          <AlertDescription>
            اذهب إلى صفحة العملاء واربط حسابات التواصل الاجتماعي لبدء الإدارة
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {!selectedClientId && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">العملاء</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {stats?.active_clients || 0}
                  </p>
                </div>
                <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                إيرادات شهرية: {formatCurrency(stats?.total_monthly_revenue || 0)}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">المنشورات هذا الشهر</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats?.total_posts_this_month || 0}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              منشور: {stats?.published_posts || 0} • مجدول: {stats?.scheduled_posts || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">الحملات النشطة</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats?.active_campaigns || 0}
                </p>
              </div>
              <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
                <Megaphone className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              إنفاق: {formatCurrency(stats?.total_ad_spend || 0)} / {formatCurrency(stats?.total_ad_budget || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">الحسابات المتصلة</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stats?.connected_accounts || 0}
                </p>
              </div>
              <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              {formatNumber(stats?.total_followers || 0)} متابع
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-slate-900">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
              onClick={() => router.push(action.href)}
            >
              <CardContent className="flex flex-col items-start p-5 text-right">
                <div className={cn("rounded-xl bg-gradient-to-br p-3 text-white shadow-lg", action.color)}>
                  <action.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-900">{action.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Platform Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>توزيع المنصات</CardTitle>
            <CardDescription>المنشورات والحملات حسب المنصة</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(platformBreakdown).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(platformBreakdown).map(([platform, data]) => (
                  <div key={platform} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("rounded-lg p-2", PLATFORM_COLORS[platform] || "bg-slate-100 text-slate-600")}>
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">
                        {PLATFORM_LABELS[platform] || platform}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      {data.posts > 0 && (
                        <span>{data.posts} منشور</span>
                      )}
                      {data.campaigns > 0 && (
                        <span>{data.campaigns} حملة</span>
                      )}
                      {data.accounts > 0 && (
                        <Badge variant="success">{data.accounts} حساب</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <BarChart3 className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-400">لا توجد بيانات حالياً</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity or Client List */}
        <Card>
          <CardHeader>
            <CardTitle>{selectedClientId ? "النشاط الأخير" : "العملاء"}</CardTitle>
            <CardDescription>
              {selectedClientId ? "نشاط الذكاء الاصطناعي" : `${stats?.total_clients || 0} عميل`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedClientId ? (
              recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3 text-right">
                      <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {activity.action_type}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(activity.created_at).toLocaleDateString("ar-SA", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Clock className="h-8 w-8 text-slate-300" />
                  <p className="text-sm text-slate-400">لا يوجد نشاط بعد</p>
                </div>
              )
            ) : companies.length > 0 ? (
              <div className="space-y-3">
                {companies.map((company: any) => (
                  <button
                    key={company.id}
                    onClick={() => router.push(`/clients/${company.id}`)}
                    className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-right hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                      {company.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{company.name}</p>
                      <p className="text-xs text-slate-400">{company.industry}</p>
                    </div>
                    <Badge variant={company.status === "active" ? "success" : "secondary"}>
                      {company.status === "active" ? "نشط" : company.status}
                    </Badge>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Building2 className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-400">لا يوجد عملاء</p>
                <Button size="sm" onClick={() => router.push("/clients")}>
                  إضافة عميل
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
