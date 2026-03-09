"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Megaphone,
  TrendingUp,
  DollarSign,
  ArrowUpLeft,
  CalendarDays,
  FileText,
  Sparkles,
  Eye,
  MousePointerClick,
  UserPlus,
  Loader2,
  WifiOff,
  Link2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";

interface PlatformInfo {
  id: string;
  name: string;
  nameAr: string;
  connected: boolean;
  stats?: Record<string, any>;
}

interface OverviewData {
  connected: boolean;
  stats?: {
    totalPages: number;
    totalFollowers: number;
    totalIgFollowers: number;
    totalAdAccounts: number;
    totalCampaigns: number;
    activeCampaigns: number;
    totalReach: number;
    totalImpressions: number;
    totalClicks: number;
    totalSpend: number;
    avgCtr: number;
  };
  pages?: { id: string; name: string; followers: number; picture?: string; igUsername?: string; igFollowers: number }[];
  topCampaigns?: any[];
}

const platformColors: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  google_ads: "#4285F4",
  youtube: "#FF0000",
  tiktok: "#000000",
  x: "#1DA1F2",
  snapchat: "#FFFC00",
  linkedin: "#0A66C2",
};

const quickActions = [
  {
    icon: Sparkles,
    title: "إنشاء خطة بالذكاء الاصطناعي",
    description: "أنشئ خطة تسويق شهرية كاملة",
    color: "from-purple-500 to-indigo-600",
  },
  {
    icon: CalendarDays,
    title: "جدولة محتوى",
    description: "أضف منشورات للتقويم",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Megaphone,
    title: "إطلاق حملة إعلانية",
    description: "أنشئ حملة على أي منصة",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: FileText,
    title: "إنشاء تقرير",
    description: "أنشئ تقرير أداء شهري PDF",
    color: "from-amber-500 to-orange-600",
  },
];

export default function DashboardPage() {
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [platformsRes, overviewRes] = await Promise.all([
        fetch("/api/platforms", { credentials: "include" }),
        fetch("/api/meta/overview", { credentials: "include" }),
      ]);

      const platformsData = await platformsRes.json();
      const overviewData = await overviewRes.json();

      console.log("[Dashboard] Platforms response:", JSON.stringify(platformsData).substring(0, 500));
      console.log("[Dashboard] Overview response:", JSON.stringify(overviewData).substring(0, 500));

      if (platformsData.error) {
        setError(`Platforms: ${platformsData.error}`);
      }
      if (overviewData.error) {
        setError((prev) => (prev ? `${prev} | Overview: ${overviewData.error}` : `Overview: ${overviewData.error}`));
      }
      if (overviewData.debug) {
        setError((prev) => (prev ? `${prev} | Debug: ${overviewData.debug}` : `Debug: ${overviewData.debug}`));
      }

      setPlatforms(platformsData.platforms || []);
      setOverview(overviewData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const connectedPlatforms = platforms.filter((p) => p.connected);
  const stats = overview?.stats;

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-sm text-slate-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            مرحباً بك في MarketPro 👋
          </h1>
          <p className="mt-1 text-slate-500">
            {connectedPlatforms.length > 0
              ? `${connectedPlatforms.length} منصة متصلة • بيانات حقيقية`
              : "لا توجد منصات متصلة حالياً"}
          </p>
        </div>
        <button onClick={fetchData} className="btn-secondary">
          <RefreshCw className="h-4 w-4" />
          تحديث
        </button>
      </div>

      {/* Debug Error Banner */}
      {error && (
        <div className="card border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-500" />
            <div>
              <h3 className="font-bold text-red-800">خطأ في جلب البيانات</h3>
              <p className="mt-1 text-sm text-red-700 font-mono break-all">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Connected Platforms Banner */}
      {connectedPlatforms.length === 0 && !error && (
        <div className="card border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-amber-100 p-3">
              <Link2 className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-amber-800">لم يتم ربط أي منصة بعد</h3>
              <p className="mt-1 text-sm text-amber-700">
                اذهب إلى الإعدادات وأضف مفاتيح API للمنصات التي تريد إدارتها (Meta, Google, TikTok, etc.)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">إجمالي المتابعين</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {formatNumber((stats?.totalFollowers || 0) + (stats?.totalIgFollowers || 0))}
              </p>
            </div>
            <div className="rounded-xl bg-blue-500 p-3 text-white shadow-lg">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            <span className="text-sm text-slate-400">
              FB: {formatNumber(stats?.totalFollowers || 0)} • IG: {formatNumber(stats?.totalIgFollowers || 0)}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">الحملات النشطة</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {stats?.activeCampaigns || 0}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-500 p-3 text-white shadow-lg">
              <Megaphone className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            <span className="text-sm text-slate-400">
              من أصل {stats?.totalCampaigns || 0} حملة
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">إجمالي الإنفاق</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {formatCurrency(stats?.totalSpend || 0)}
              </p>
            </div>
            <div className="rounded-xl bg-purple-500 p-3 text-white shadow-lg">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            <span className="text-sm text-slate-400">آخر 30 يوم</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">إجمالي الوصول</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {formatNumber(stats?.totalReach || 0)}
              </p>
            </div>
            <div className="rounded-xl bg-amber-500 p-3 text-white shadow-lg">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            <span className="text-sm text-slate-400">
              نقرات: {formatNumber(stats?.totalClicks || 0)} • CTR: {stats?.avgCtr || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-slate-900">إجراءات سريعة</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <button
              key={action.title}
              className="group card flex flex-col items-start p-5 text-right transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <div
                className={cn(
                  "rounded-xl bg-gradient-to-br p-3 text-white shadow-lg",
                  action.color
                )}
              >
                <action.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-900">
                {action.title}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {action.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Platform Performance */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900">حالة المنصات</h2>
          <p className="text-sm text-slate-500">{connectedPlatforms.length} متصلة من {platforms.length}</p>
          <div className="mt-6 space-y-4">
            {platforms.map((platform) => (
              <div key={platform.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: platformColors[platform.id] || "#94a3b8" }}
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    {platform.nameAr}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {platform.connected ? (
                    <>
                      {platform.stats?.followers && (
                        <span className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Users className="h-3.5 w-3.5" />
                          {formatNumber(platform.stats.followers)}
                        </span>
                      )}
                      {platform.stats?.pages && (
                        <span className="flex items-center gap-1.5 text-sm text-slate-500">
                          <FileText className="h-3.5 w-3.5" />
                          {platform.stats.pages} صفحة
                        </span>
                      )}
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        متصل
                      </span>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      {(platform as any).error && (
                        <span className="text-xs text-red-500 max-w-[200px] truncate" title={(platform as any).error}>
                          {(platform as any).error}
                        </span>
                      )}
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                        غير متصل
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pages & Accounts */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-900">الصفحات المتصلة</h2>
          <p className="text-sm text-slate-500">من Meta</p>
          <div className="mt-6 space-y-4">
            {overview?.pages && overview.pages.length > 0 ? (
              overview.pages.map((page) => (
                <div key={page.id} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 overflow-hidden">
                    {page.picture ? (
                      <img src={page.picture} alt={page.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-blue-600">{page.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{page.name}</p>
                    <p className="text-xs text-slate-400">
                      {formatNumber(page.followers)} متابع
                      {page.igUsername && ` • IG: @${page.igUsername}`}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <WifiOff className="h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-400">لم يتم ربط أي صفحة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
