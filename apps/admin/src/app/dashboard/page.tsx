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
    iconBg: "bg-purple-500/15 text-purple-400",
    href: "/dashboard/plans",
  },
  {
    icon: CalendarDays,
    title: "جدولة محتوى",
    description: "أضف منشورات للتقويم",
    iconBg: "bg-success-400/15 text-success-400",
    href: "/dashboard/content",
  },
  {
    icon: Megaphone,
    title: "إطلاق حملة إعلانية",
    description: "أنشئ حملة على أي منصة",
    iconBg: "bg-accent-400/15 text-accent-400",
    href: "/dashboard/campaigns",
  },
  {
    icon: FileText,
    title: "إنشاء تقرير",
    description: "أنشئ تقرير أداء شهري PDF",
    iconBg: "bg-amber-300/15 text-amber-300",
    href: "/dashboard/reports",
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
  facebook: "bg-blue-500/15 text-blue-400",
  instagram: "bg-pink-500/15 text-pink-400",
  meta: "bg-blue-500/15 text-blue-400",
  tiktok: "bg-zinc-500/15 text-zinc-300",
  snapchat: "bg-yellow-500/15 text-yellow-400",
  x: "bg-sky-500/15 text-sky-400",
  linkedin: "bg-indigo-500/15 text-indigo-400",
  youtube: "bg-red-500/15 text-red-400",
  google_ads: "bg-green-500/15 text-green-400",
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

function StatCard({
  label,
  value,
  icon: Icon,
  subtitle,
  iconBg,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  subtitle: string;
  iconBg: string;
}) {
  return (
    <Card className="group hover:border-border-default transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-text-muted">{label}</p>
            <p className="mt-2 text-3xl font-bold text-text-primary">{value}</p>
          </div>
          <div className={cn("rounded-xl p-3", iconBg)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-3 text-sm text-text-muted">{subtitle}</p>
      </CardContent>
    </Card>
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
          <h1 className="text-2xl font-bold text-text-primary">{pageTitle}</h1>
          <p className="mt-1 text-text-muted">{pageSubtitle}</p>
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
          <StatCard
            label="العملاء"
            value={stats?.active_clients || 0}
            icon={Building2}
            iconBg="bg-accent-400/15 text-accent-400"
            subtitle={`إيرادات شهرية: ${formatCurrency(stats?.total_monthly_revenue || 0)}`}
          />
        )}

        <StatCard
          label="المنشورات هذا الشهر"
          value={stats?.total_posts_this_month || 0}
          icon={CalendarDays}
          iconBg="bg-success-400/15 text-success-400"
          subtitle={`منشور: ${stats?.published_posts || 0} • مجدول: ${stats?.scheduled_posts || 0}`}
        />

        <StatCard
          label="الحملات النشطة"
          value={stats?.active_campaigns || 0}
          icon={Megaphone}
          iconBg="bg-purple-500/15 text-purple-400"
          subtitle={`إنفاق: ${formatCurrency(stats?.total_ad_spend || 0)} / ${formatCurrency(stats?.total_ad_budget || 0)}`}
        />

        <StatCard
          label="الحسابات المتصلة"
          value={stats?.connected_accounts || 0}
          icon={TrendingUp}
          iconBg="bg-amber-300/15 text-amber-300"
          subtitle={`${formatNumber(stats?.total_followers || 0)} متابع`}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-text-primary">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="cursor-pointer transition-all hover:border-border-default hover:-translate-y-0.5"
              onClick={() => router.push(action.href)}
            >
              <CardContent className="flex flex-col items-start p-5 text-right">
                <div className={cn("rounded-xl p-3", action.iconBg)}>
                  <action.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-text-primary">{action.title}</h3>
                <p className="mt-1 text-xs text-text-muted">{action.description}</p>
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
              <div className="space-y-3">
                {Object.entries(platformBreakdown).map(([platform, data]) => (
                  <div key={platform} className="flex items-center justify-between rounded-xl border border-border-subtle p-4 hover:bg-surface-hover/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn("rounded-lg p-2", PLATFORM_COLORS[platform] || "bg-surface-elevated text-text-muted")}>
                        <BarChart3 className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-text-secondary">
                        {PLATFORM_LABELS[platform] || platform}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-text-muted">
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
                <BarChart3 className="h-8 w-8 text-text-muted" />
                <p className="text-sm text-text-muted">لا توجد بيانات حالياً</p>
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
                      <div className="rounded-lg bg-purple-500/15 p-2 text-purple-400">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-secondary truncate">
                          {activity.action_type}
                        </p>
                        <p className="text-xs text-text-muted">
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
                  <Clock className="h-8 w-8 text-text-muted" />
                  <p className="text-sm text-text-muted">لا يوجد نشاط بعد</p>
                </div>
              )
            ) : companies.length > 0 ? (
              <div className="space-y-3">
                {companies.map((company: any) => (
                  <button
                    key={company.id}
                    onClick={() => router.push(`/dashboard/clients/${company.id}`)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border-subtle p-3 text-right hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-elevated text-xs font-bold text-text-secondary">
                      {company.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-secondary truncate">{company.name}</p>
                      <p className="text-xs text-text-muted">{company.industry}</p>
                    </div>
                    <Badge variant={company.status === "active" ? "success" : "secondary"}>
                      {company.status === "active" ? "نشط" : company.status}
                    </Badge>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Building2 className="h-8 w-8 text-text-muted" />
                <p className="text-sm text-text-muted">لا يوجد عملاء</p>
                <Button size="sm" onClick={() => router.push("/dashboard/clients")}>
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
