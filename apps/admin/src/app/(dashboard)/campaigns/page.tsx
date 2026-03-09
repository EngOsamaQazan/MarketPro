"use client";

import { useEffect, useState } from "react";
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointerClick,
  Target,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Loader2,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { cn, formatCurrency, formatNumber, getStatusColor, getStatusLabel } from "@/lib/utils";

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  platform: string;
  adAccountName?: string;
  dailyBudget: number;
  totalBudget: number;
  budgetRemaining: number;
  spentAmount: number;
  startDate?: string;
  endDate?: string;
  health: "healthy" | "warning" | "critical";
  metrics: {
    reach: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    cpm: number;
    spend: number;
    frequency: number;
    conversions: number;
    cpa: number;
    roas: number;
  };
}

interface CampaignSummary {
  total: number;
  active: number;
  paused: number;
  totalReach: number;
  totalClicks: number;
  totalSpend: number;
  totalConversions: number;
}

const healthIcons = {
  healthy: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
  critical: { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
};

const platformEmoji: Record<string, string> = {
  facebook: "📘", instagram: "📸", tiktok: "🎵",
  snapchat: "👻", x: "𝕏",
};

const objectiveLabels: Record<string, string> = {
  OUTCOME_AWARENESS: "وعي بالعلامة",
  OUTCOME_TRAFFIC: "زيارات",
  OUTCOME_ENGAGEMENT: "تفاعل",
  OUTCOME_LEADS: "عملاء محتملين",
  OUTCOME_SALES: "مبيعات",
  OUTCOME_APP_PROMOTION: "ترويج تطبيق",
  awareness: "وعي بالعلامة",
  traffic: "زيارات",
  engagement: "تفاعل",
  leads: "عملاء محتملين",
  sales: "مبيعات",
  conversions: "تحويلات",
  LINK_CLICKS: "نقرات الروابط",
  REACH: "وصول",
  IMPRESSIONS: "ظهور",
  POST_ENGAGEMENT: "تفاعل المنشورات",
  PAGE_LIKES: "إعجابات الصفحة",
  LEAD_GENERATION: "توليد عملاء",
  MESSAGES: "رسائل",
  CONVERSIONS: "تحويلات",
  VIDEO_VIEWS: "مشاهدات فيديو",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [summary, setSummary] = useState<CampaignSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meta/campaigns");
      const data = await res.json();
      setConnected(data.connected);
      setCampaigns(data.campaigns || []);
      setSummary(data.summary || null);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-sm text-slate-500">جاري جلب بيانات الحملات...</p>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <WifiOff className="h-12 w-12 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-700">لا توجد منصات إعلانية متصلة</h2>
          <p className="max-w-md text-sm text-slate-500">
            لعرض الحملات الإعلانية، يرجى إضافة مفاتيح API للمنصات الإعلانية (Meta, Google Ads) من صفحة الإعدادات
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">الحملات الإعلانية</h1>
          <p className="mt-1 text-slate-500">
            {summary?.total || 0} حملة • {summary?.active || 0} نشطة
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchCampaigns} className="btn-secondary">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </button>
          <button className="btn-secondary">
            <Sparkles className="h-4 w-4" />
            تحسين تلقائي AI
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4" />
            إنشاء حملة جديدة
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">إجمالي الوصول</p>
              <p className="text-xl font-bold">{formatNumber(summary?.totalReach || 0)}</p>
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
              <p className="text-xl font-bold">{formatNumber(summary?.totalClicks || 0)}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-2.5 text-purple-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">إجمالي الإنفاق</p>
              <p className="text-xl font-bold">{formatCurrency(summary?.totalSpend || 0)}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-2.5 text-amber-600">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">التحويلات</p>
              <p className="text-xl font-bold">{formatNumber(summary?.totalConversions || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Cards */}
      {campaigns.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <Megaphone className="h-10 w-10 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-600">لا توجد حملات إعلانية</h3>
          <p className="text-sm text-slate-400">لم يتم العثور على أي حملات في حساباتك الإعلانية</p>
        </div>
      ) : (
        <div className="space-y-6">
          {campaigns.map((campaign) => {
            const health = healthIcons[campaign.health];
            const HealthIcon = health.icon;
            const totalBudget = campaign.totalBudget || campaign.dailyBudget * 30;
            const spentPercentage = totalBudget > 0 ? (campaign.spentAmount / totalBudget) * 100 : 0;

            return (
              <div key={campaign.id} className="card overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{platformEmoji[campaign.platform] || "📊"}</span>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{campaign.name}</h3>
                        <p className="text-sm text-slate-500">
                          {campaign.adAccountName && `${campaign.adAccountName} • `}
                          {objectiveLabels[campaign.objective] || campaign.objective}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={cn("rounded-lg p-1.5", health.bg)}>
                        <HealthIcon className={cn("h-4 w-4", health.color)} />
                      </div>
                      <span className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        getStatusColor(campaign.status)
                      )}>
                        {getStatusLabel(campaign.status)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-6">
                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                      <p className="text-xs text-slate-500">الوصول</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{formatNumber(campaign.metrics.reach)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                      <p className="text-xs text-slate-500">النقرات</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{formatNumber(campaign.metrics.clicks)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                      <p className="text-xs text-slate-500">CTR</p>
                      <p className={cn(
                        "mt-1 text-lg font-bold",
                        campaign.metrics.ctr >= 1 ? "text-emerald-600" : campaign.metrics.ctr >= 0.5 ? "text-amber-600" : "text-red-600"
                      )}>
                        {Number(campaign.metrics.ctr).toFixed(2)}%
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                      <p className="text-xs text-slate-500">CPC</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">${Number(campaign.metrics.cpc).toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                      <p className="text-xs text-slate-500">التحويلات</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{campaign.metrics.conversions}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                      <p className="text-xs text-slate-500">الإنفاق</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">${Number(campaign.metrics.spend).toFixed(2)}</p>
                    </div>
                  </div>

                  {totalBudget > 0 && (
                    <div className="mt-5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">
                          الميزانية: {formatCurrency(campaign.spentAmount)} / {formatCurrency(totalBudget)}
                        </span>
                        <span className="font-semibold text-slate-700">{Math.round(spentPercentage)}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all",
                            spentPercentage > 90 ? "bg-red-500" : spentPercentage > 70 ? "bg-amber-500" : "bg-primary-500"
                          )}
                          style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {campaign.startDate && (
                    <div className="mt-3 text-xs text-slate-400">
                      بدأت: {new Date(campaign.startDate).toLocaleDateString("ar-SA")}
                      {campaign.endDate && ` • تنتهي: ${new Date(campaign.endDate).toLocaleDateString("ar-SA")}`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
