"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Globe,
  BarChart3,
  RefreshCw,
  Users,
  DollarSign,
  Eye,
  MousePointerClick,
  Megaphone,
  WifiOff,
} from "lucide-react";
import { cn, formatNumber, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClient } from "@/components/providers/client-context";

interface PlatformData {
  source: string;
  connected: boolean;
  stats: Record<string, any> | null;
}

interface TopCampaign {
  id: string;
  name: string;
  source: string;
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
  const [metaData, setMetaData] = useState<any>(null);
  const [googleData, setGoogleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "meta" | "google">("all");
  const { selectedClientId, selectedClient } = useClient();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [metaRes, googleRes] = await Promise.all([
        fetch("/api/meta/overview").then((r) => r.json()).catch(() => ({ connected: false })),
        fetch("/api/google-ads/overview").then((r) => r.json()).catch(() => ({ connected: false })),
      ]);
      setMetaData(metaRes);
      setGoogleData(googleRes);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, [selectedClientId]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent><Skeleton className="h-48 w-full" /></CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent><Skeleton className="h-48 w-full" /></CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const metaConnected = metaData?.connected || false;
  const googleConnected = googleData?.connected || false;

  if (!metaConnected && !googleConnected) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <WifiOff className="h-12 w-12 text-text-muted" />
          <h2 className="text-xl font-bold text-text-secondary">لا توجد بيانات تحليلية</h2>
          <p className="max-w-md text-sm text-text-muted">
            لعرض التحليلات، يرجى ربط المنصات من صفحة الإعدادات
          </p>
        </div>
      </div>
    );
  }

  const mStats = metaData?.stats || {};
  const gStats = googleData?.stats || {};

  const combined = {
    totalReach: (mStats.totalReach || 0) + (gStats.totalImpressions || 0),
    totalClicks: (mStats.totalClicks || 0) + (gStats.totalClicks || 0),
    totalSpend: Math.round(((mStats.totalSpend || 0) + (gStats.totalCost || 0)) * 100) / 100,
    totalFollowers: (mStats.totalFollowers || 0) + (mStats.totalIgFollowers || 0),
    totalCampaigns: (mStats.totalCampaigns || 0) + (gStats.totalCampaigns || 0),
    activeCampaigns: (mStats.activeCampaigns || 0) + (gStats.activeCampaigns || 0),
    totalImpressions: (mStats.totalImpressions || 0) + (gStats.totalImpressions || 0),
    totalConversions: gStats.totalConversions || 0,
  };
  const combinedCtr = combined.totalImpressions > 0
    ? Math.round((combined.totalClicks / combined.totalImpressions) * 10000) / 100
    : 0;

  const showStats = tab === "all" ? combined : tab === "meta"
    ? { totalReach: mStats.totalReach || 0, totalClicks: mStats.totalClicks || 0, totalSpend: mStats.totalSpend || 0, totalFollowers: (mStats.totalFollowers || 0) + (mStats.totalIgFollowers || 0), totalCampaigns: mStats.totalCampaigns || 0, activeCampaigns: mStats.activeCampaigns || 0, totalImpressions: mStats.totalImpressions || 0, totalConversions: 0 }
    : { totalReach: gStats.totalImpressions || 0, totalClicks: gStats.totalClicks || 0, totalSpend: gStats.totalCost || 0, totalFollowers: 0, totalCampaigns: gStats.totalCampaigns || 0, activeCampaigns: gStats.activeCampaigns || 0, totalImpressions: gStats.totalImpressions || 0, totalConversions: gStats.totalConversions || 0 };

  const showCtr = showStats.totalImpressions > 0
    ? Math.round((showStats.totalClicks / showStats.totalImpressions) * 10000) / 100
    : 0;

  const topCampaigns = metaData?.topCampaigns || [];
  const pages = metaData?.pages || [];
  const googleAccounts = googleData?.accounts || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">التحليلات والإحصائيات</h1>
          <p className="mt-1 text-text-muted">
            {[metaConnected && "Meta", googleConnected && "Google Ads"].filter(Boolean).join(" + ")} • آخر 30 يوم
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4" />
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* Platform Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "meta" | "google")}>
        <TabsList>
          <TabsTrigger value="all">الكل</TabsTrigger>
          {metaConnected && <TabsTrigger value="meta">📘 Meta</TabsTrigger>}
          {googleConnected && <TabsTrigger value="google">🔍 Google Ads</TabsTrigger>}
        </TabsList>
      </Tabs>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/15 p-2.5 text-blue-400"><Eye className="h-5 w-5" /></div>
              <div>
                <p className="text-sm text-text-muted">إجمالي الوصول</p>
                <p className="mt-1 text-2xl font-bold text-text-primary">{formatNumber(showStats.totalReach)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-success-400/10 p-2.5 text-success-400"><MousePointerClick className="h-5 w-5" /></div>
              <div>
                <p className="text-sm text-text-muted">إجمالي النقرات</p>
                <p className="mt-1 text-2xl font-bold text-text-primary">{formatNumber(showStats.totalClicks)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-500/15 p-2.5 text-purple-400"><TrendingUp className="h-5 w-5" /></div>
              <div>
                <p className="text-sm text-text-muted">متوسط CTR</p>
                <p className={cn("mt-1 text-2xl font-bold", showCtr >= 1 ? "text-success-400" : "text-amber-400")}>
                  {showCtr}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-error-400/10 p-2.5 text-error-400"><DollarSign className="h-5 w-5" /></div>
              <div>
                <p className="text-sm text-text-muted">إجمالي الإنفاق</p>
                <p className="mt-1 text-2xl font-bold text-text-primary">{formatCurrency(showStats.totalSpend)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {(tab === "all" || tab === "meta") && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-300/15 p-2.5 text-amber-400"><Users className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-text-muted">إجمالي المتابعين</p>
                  <p className="mt-1 text-2xl font-bold text-text-primary">{formatNumber(showStats.totalFollowers)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-500/15 p-2.5 text-indigo-400"><Megaphone className="h-5 w-5" /></div>
              <div>
                <p className="text-sm text-text-muted">الحملات</p>
                <p className="mt-1 text-2xl font-bold text-text-primary">
                  {showStats.activeCampaigns}
                  <span className="text-base font-normal text-text-muted"> / {showStats.totalCampaigns}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {showStats.totalConversions > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-success-400/10 p-2.5 text-success-400"><TrendingUp className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-text-muted">التحويلات</p>
                  <p className="mt-1 text-2xl font-bold text-text-primary">{formatNumber(showStats.totalConversions)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Top Meta Campaigns */}
        {(tab === "all" || tab === "meta") && topCampaigns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-amber-300" />
                أفضل حملات Meta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle text-sm text-text-muted">
                    <th className="pb-3 text-right font-medium">الحملة</th>
                    <th className="pb-3 text-right font-medium">الوصول</th>
                    <th className="pb-3 text-right font-medium">النقرات</th>
                    <th className="pb-3 text-right font-medium">الإنفاق</th>
                    <th className="pb-3 text-right font-medium">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {topCampaigns.map((c: any) => (
                    <tr key={c.id} className="border-b border-border-subtle text-sm">
                      <td className="py-3 font-semibold text-text-primary max-w-[200px] truncate">{c.name}</td>
                      <td className="py-3 text-text-secondary">{formatNumber(c.metrics.reach)}</td>
                      <td className="py-3 text-text-secondary">{formatNumber(c.metrics.clicks)}</td>
                      <td className="py-3 text-text-secondary">${Number(c.metrics.spend).toFixed(2)}</td>
                      <td className="py-3">
                        <Badge
                          variant={
                            Number(c.metrics.ctr) >= 1 ? "success" :
                            Number(c.metrics.ctr) >= 0.5 ? "warning" :
                            "destructive"
                          }
                          className="rounded-full"
                        >
                          {Number(c.metrics.ctr).toFixed(2)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {/* Google Ads Accounts */}
        {(tab === "all" || tab === "google") && googleConnected && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-amber-300" />
                حسابات Google Ads
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {googleAccounts.length > 0 ? (
                googleAccounts.map((account: any) => (
                  <div key={account.id} className="flex items-center justify-between rounded-xl border border-border-subtle p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 text-sm font-bold text-blue-400">
                        G
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-text-secondary">{account.name}</span>
                        <p className="text-xs text-text-muted">{account.currency}</p>
                      </div>
                    </div>
                    <Badge variant="success">متصل</Badge>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-sm text-text-muted">لا توجد حسابات</p>
              )}
              <div className="mt-4 rounded-xl bg-surface-hover p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-text-muted">الحملات</p>
                    <p className="text-lg font-bold text-text-primary">{gStats.totalCampaigns || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">الإنفاق</p>
                    <p className="text-lg font-bold text-text-primary">{formatCurrency(gStats.totalCost || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">التحويلات</p>
                    <p className="text-lg font-bold text-text-primary">{formatNumber(gStats.totalConversions || 0)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pages Performance */}
        {(tab === "all" || tab === "meta") && pages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-amber-300" />
                أداء الصفحات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pages.map((page: PageInfo) => {
                const total = (mStats.totalFollowers || 0) + (mStats.totalIgFollowers || 0);
                const pageTotal = page.followers + page.igFollowers;
                const pct = total > 0 ? Math.round((pageTotal / total) * 100) : 0;

                return (
                  <div key={page.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {page.picture ? (
                          <img src={page.picture} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 text-sm font-bold text-blue-400">
                            {page.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-semibold text-text-secondary">{page.name}</span>
                          {page.igUsername && (
                            <span className="mr-2 text-xs text-text-muted">• IG: @{page.igUsername}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-left text-sm">
                        <span className="font-bold text-text-secondary">{formatNumber(pageTotal)}</span>
                        <span className="text-text-muted mr-1">متابع</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-hover">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
