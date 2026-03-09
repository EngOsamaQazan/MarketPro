"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Globe,
  BarChart3,
  Sparkles,
  RefreshCw,
  Users,
  DollarSign,
  Eye,
  MousePointerClick,
  Megaphone,
  Loader2,
  WifiOff,
} from "lucide-react";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";

interface OverviewStats {
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
}

interface TopCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  metrics: {
    reach: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    spend: number;
    conversions: number;
  };
}

interface PageInfo {
  id: string;
  name: string;
  followers: number;
  picture?: string;
  igUsername?: string;
  igFollowers: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [topCampaigns, setTopCampaigns] = useState<TopCampaign[]>([]);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meta/overview");
      const data = await res.json();
      setConnected(data.connected || false);
      setStats(data.stats || null);
      setTopCampaigns(data.topCampaigns || []);
      setPages(data.pages || []);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-sm text-slate-500">جاري جلب التحليلات...</p>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <WifiOff className="h-12 w-12 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-700">لا توجد بيانات تحليلية</h2>
          <p className="max-w-md text-sm text-slate-500">
            لعرض التحليلات، يرجى ربط المنصات من صفحة الإعدادات
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">التحليلات والإحصائيات</h1>
          <p className="mt-1 text-slate-500">بيانات حقيقية • آخر 30 يوم</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchAnalytics} className="btn-secondary">
            <RefreshCw className="h-4 w-4" />
            تحديث البيانات
          </button>
          <button className="btn-primary">
            <Sparkles className="h-4 w-4" />
            تحليل AI شامل
          </button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">إجمالي الوصول</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{formatNumber(stats?.totalReach || 0)}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
              <MousePointerClick className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">إجمالي النقرات</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{formatNumber(stats?.totalClicks || 0)}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-2.5 text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">متوسط CTR</p>
              <p className={cn(
                "mt-1 text-3xl font-bold",
                (stats?.avgCtr || 0) >= 1 ? "text-emerald-600" : "text-amber-600"
              )}>
                {stats?.avgCtr || 0}%
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-2.5 text-amber-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">إجمالي المتابعين</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {formatNumber((stats?.totalFollowers || 0) + (stats?.totalIgFollowers || 0))}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-100 p-2.5 text-red-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">إجمالي الإنفاق</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{formatCurrency(stats?.totalSpend || 0)}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-600">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">الحملات</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {stats?.activeCampaigns || 0}
                <span className="text-base font-normal text-slate-400"> / {stats?.totalCampaigns || 0}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Top Campaigns */}
        <div className="card p-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-bold text-slate-900">أفضل الحملات أداءً</h2>
          </div>
          <div className="mt-6">
            {topCampaigns.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 text-sm text-slate-500">
                    <th className="pb-3 text-right font-medium">الحملة</th>
                    <th className="pb-3 text-right font-medium">الوصول</th>
                    <th className="pb-3 text-right font-medium">النقرات</th>
                    <th className="pb-3 text-right font-medium">الإنفاق</th>
                    <th className="pb-3 text-right font-medium">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {topCampaigns.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50 text-sm">
                      <td className="py-3 font-semibold text-slate-900 max-w-[200px] truncate">{c.name}</td>
                      <td className="py-3 text-slate-600">{formatNumber(c.metrics.reach)}</td>
                      <td className="py-3 text-slate-600">{formatNumber(c.metrics.clicks)}</td>
                      <td className="py-3 text-slate-600">${Number(c.metrics.spend).toFixed(2)}</td>
                      <td className="py-3">
                        <span className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-bold",
                          Number(c.metrics.ctr) >= 1 ? "bg-emerald-100 text-emerald-700" :
                          Number(c.metrics.ctr) >= 0.5 ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        )}>
                          {Number(c.metrics.ctr).toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">لا توجد حملات بعد</p>
            )}
          </div>
        </div>

        {/* Pages Performance */}
        <div className="card p-6">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-bold text-slate-900">أداء الصفحات</h2>
          </div>
          <div className="mt-6 space-y-4">
            {pages.length > 0 ? (
              pages.map((page) => {
                const total = (stats?.totalFollowers || 0) + (stats?.totalIgFollowers || 0);
                const pageTotal = page.followers + page.igFollowers;
                const pct = total > 0 ? Math.round((pageTotal / total) * 100) : 0;

                return (
                  <div key={page.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {page.picture ? (
                          <img src={page.picture} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                            {page.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-semibold text-slate-700">{page.name}</span>
                          {page.igUsername && (
                            <span className="mr-2 text-xs text-slate-400">• IG: @{page.igUsername}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-left text-sm">
                        <span className="font-bold text-slate-700">{formatNumber(pageTotal)}</span>
                        <span className="text-slate-400 mr-1">متابع</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">لا توجد صفحات متصلة</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
