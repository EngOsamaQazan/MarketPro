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
  WifiOff,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn, formatCurrency, formatNumber, getStatusLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useClient } from "@/components/providers/client-context";

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
  healthy: { icon: CheckCircle2, color: "text-success-400", bg: "bg-success-400/15" },
  warning: { icon: AlertTriangle, color: "text-amber-300", bg: "bg-amber-300/15" },
  critical: { icon: AlertTriangle, color: "text-error-400", bg: "bg-error-400/15" },
};

const platformEmoji: Record<string, string> = {
  facebook: "📘", instagram: "📸", tiktok: "🎵",
  snapchat: "👻", x: "𝕏", google_ads: "🔍",
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
  SEARCH: "بحث جوجل",
  DISPLAY: "شبكة العرض",
  SHOPPING: "تسوّق",
  VIDEO: "فيديو",
  PERFORMANCE_MAX: "أداء أقصى",
  SMART: "ذكية",
  DEMAND_GEN: "توليد الطلب",
  MAXIMIZE_CONVERSIONS: "تحقيق أقصى تحويلات",
  MAXIMIZE_CONVERSION_VALUE: "تحقيق أقصى قيمة تحويل",
  TARGET_CPA: "تكلفة اكتساب مستهدفة",
  TARGET_ROAS: "عائد إنفاق مستهدف",
  MANUAL_CPC: "تكلفة نقرة يدوية",
};

const META_OBJECTIVES = [
  { value: "OUTCOME_AWARENESS", label: "وعي بالعلامة" },
  { value: "OUTCOME_TRAFFIC", label: "زيارات" },
  { value: "OUTCOME_ENGAGEMENT", label: "تفاعل" },
  { value: "OUTCOME_LEADS", label: "عملاء محتملين" },
  { value: "OUTCOME_SALES", label: "مبيعات" },
  { value: "OUTCOME_APP_PROMOTION", label: "ترويج تطبيق" },
];

function getStatusBadgeVariant(status: string): "success" | "warning" | "secondary" {
  if (status === "active" || status === "enabled") return "success";
  if (status === "paused") return "warning";
  return "secondary";
}

interface CreateFormState {
  company_id: string;
  name: string;
  objective: string;
  daily_budget: string;
  total_budget: string;
  start_date: string;
  end_date: string;
  ageMin: string;
  ageMax: string;
  genders: string;
  countries: string;
  interests: string;
}

const defaultCreateForm: CreateFormState = {
  company_id: "",
  name: "",
  objective: "",
  daily_budget: "",
  total_budget: "",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  ageMin: "18",
  ageMax: "65",
  genders: "",
  countries: "SA",
  interests: "",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [summary, setSummary] = useState<CampaignSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showOptimizeDialog, setShowOptimizeDialog] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(defaultCreateForm);
  const [creating, setCreating] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeResults, setOptimizeResults] = useState<any[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const { toast } = useToast();
  const { selectedClientId } = useClient();

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const [metaRes, googleRes] = await Promise.all([
        fetch("/api/meta/campaigns").then((r) => r.json()).catch(() => ({ connected: false, campaigns: [] })),
        fetch("/api/google-ads/campaigns").then((r) => r.json()).catch(() => ({ connected: false, campaigns: [] })),
      ]);

      const anyConnected = metaRes.connected || googleRes.connected;
      setConnected(anyConnected);

      const allCampaigns = [
        ...(metaRes.campaigns || []),
        ...(googleRes.campaigns || []).map((c: any) => ({
          ...c,
          dailyBudget: c.budget || 0,
          totalBudget: c.budgetType === "TOTAL" ? c.budget : (c.budget || 0) * 30,
          budgetRemaining: 0,
          spentAmount: c.metrics?.cost || 0,
          metrics: {
            reach: 0,
            impressions: c.metrics?.impressions || 0,
            clicks: c.metrics?.clicks || 0,
            ctr: c.metrics?.ctr || 0,
            cpc: c.metrics?.averageCpc || 0,
            cpm: c.metrics?.averageCpm || 0,
            spend: c.metrics?.cost || 0,
            frequency: 0,
            conversions: c.metrics?.conversions || 0,
            cpa: c.metrics?.costPerConversion || 0,
            roas: c.metrics?.conversionsValue > 0 && c.metrics?.cost > 0
              ? Math.round((c.metrics.conversionsValue / c.metrics.cost) * 100) / 100
              : 0,
          },
        })),
      ];

      setCampaigns(allCampaigns);

      setSummary({
        total: allCampaigns.length,
        active: allCampaigns.filter((c: Campaign) => c.status === "active" || c.status === "enabled").length,
        paused: allCampaigns.filter((c: Campaign) => c.status === "paused").length,
        totalReach: allCampaigns.reduce((s: number, c: Campaign) => s + (c.metrics.reach || 0), 0),
        totalClicks: allCampaigns.reduce((s: number, c: Campaign) => s + c.metrics.clicks, 0),
        totalSpend: Math.round(allCampaigns.reduce((s: number, c: Campaign) => s + c.metrics.spend, 0) * 100) / 100,
        totalConversions: allCampaigns.reduce((s: number, c: Campaign) => s + c.metrics.conversions, 0),
      });
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (data.clients) {
        setCompanies(data.clients.map((c: any) => ({ id: c.id, name: c.company_name || c.name })));
      }
    } catch {
      // Companies list may not be available
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchCompanies();
  }, [selectedClientId]);

  const handleCreateCampaign = async () => {
    if (!createForm.company_id || !createForm.name || !createForm.objective || !createForm.daily_budget) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const genders = createForm.genders
        ? createForm.genders.split(",").map((g) => parseInt(g.trim())).filter(Boolean)
        : undefined;
      const countries = createForm.countries
        ? createForm.countries.split(",").map((c) => c.trim()).filter(Boolean)
        : ["SA"];

      const res = await fetch("/api/campaigns/create-auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: createForm.company_id,
          name: createForm.name,
          objective: createForm.objective,
          daily_budget: parseFloat(createForm.daily_budget),
          total_budget: createForm.total_budget ? parseFloat(createForm.total_budget) : undefined,
          start_date: createForm.start_date,
          end_date: createForm.end_date || undefined,
          targeting: {
            ageMin: parseInt(createForm.ageMin) || 18,
            ageMax: parseInt(createForm.ageMax) || 65,
            genders,
            countries,
            interests: createForm.interests
              ? createForm.interests.split(",").map((i) => ({ id: i.trim(), name: i.trim() }))
              : undefined,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ title: "خطأ", description: data.error || "فشل في إنشاء الحملة", variant: "destructive" });
        return;
      }

      toast({ title: "تم بنجاح", description: `تم إنشاء حملة "${createForm.name}" على Meta` });
      setShowCreateDialog(false);
      setCreateForm(defaultCreateForm);
      fetchCampaigns();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message || "فشل في إنشاء الحملة", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleOptimizeAll = async () => {
    const activeCampaigns = campaigns.filter(
      (c) => c.status === "active" || c.status === "enabled"
    );

    if (activeCampaigns.length === 0) {
      toast({ title: "لا توجد حملات نشطة", description: "لا توجد حملات نشطة لتحسينها", variant: "destructive" });
      return;
    }

    setOptimizing(true);
    setOptimizeResults([]);
    setShowOptimizeDialog(true);

    const results: any[] = [];

    for (const campaign of activeCampaigns) {
      try {
        const res = await fetch("/api/campaigns/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaign_id: campaign.id }),
        });
        const data = await res.json();
        results.push({
          campaign_name: campaign.name,
          success: data.success,
          score: data.score,
          analysis: data.analysis,
          recommendations: data.recommendations || [],
          autoExecuted: data.autoExecuted || [],
          error: data.error,
        });
      } catch (e: any) {
        results.push({
          campaign_name: campaign.name,
          success: false,
          error: e.message,
        });
      }
    }

    setOptimizeResults(results);
    setOptimizing(false);

    const successCount = results.filter((r) => r.success).length;
    toast({
      title: "اكتمل التحسين",
      description: `تم تحليل ${successCount} من ${activeCampaigns.length} حملة`,
    });

    fetchCampaigns();
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-11 w-24" />
            <Skeleton className="h-11 w-36" />
            <Skeleton className="h-11 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                  <Skeleton className="h-6 w-16 rounded-lg" />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-6">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="rounded-xl bg-surface-hover p-3 text-center">
                    <Skeleton className="mx-auto h-3 w-12" />
                    <Skeleton className="mx-auto mt-2 h-5 w-16" />
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <WifiOff className="h-12 w-12 text-text-muted" />
          <h2 className="text-xl font-bold text-text-secondary">لا توجد منصات إعلانية متصلة</h2>
          <p className="max-w-md text-sm text-text-muted">
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
          <h1 className="text-2xl font-bold text-text-primary">الحملات الإعلانية</h1>
          <p className="mt-1 text-text-muted">
            {summary?.total || 0} حملة • {summary?.active || 0} نشطة
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchCampaigns}>
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          <Button variant="outline" onClick={handleOptimizeAll} disabled={optimizing}>
            {optimizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            تحسين تلقائي AI
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            إنشاء حملة جديدة
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-accent-400/15 p-2.5 text-accent-400">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-text-muted">إجمالي الوصول</p>
                <p className="text-xl font-bold">{formatNumber(summary?.totalReach || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-success-400/15 p-2.5 text-success-400">
                <MousePointerClick className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-text-muted">إجمالي النقرات</p>
                <p className="text-xl font-bold">{formatNumber(summary?.totalClicks || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-500/15 p-2.5 text-purple-400">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-text-muted">إجمالي الإنفاق</p>
                <p className="text-xl font-bold">{formatCurrency(summary?.totalSpend || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-300/15 p-2.5 text-amber-300">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-text-muted">التحويلات</p>
                <p className="text-xl font-bold">{formatNumber(summary?.totalConversions || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Cards */}
      {campaigns.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Megaphone className="h-10 w-10 text-text-muted" />
          <h3 className="text-lg font-bold text-text-secondary">لا توجد حملات إعلانية</h3>
          <p className="text-sm text-text-muted">لم يتم العثور على أي حملات في حساباتك الإعلانية</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {campaigns.map((campaign) => {
            const health = healthIcons[campaign.health];
            const HealthIcon = health.icon;
            const totalBudget = campaign.totalBudget || campaign.dailyBudget * 30;
            const spentPercentage = totalBudget > 0 ? (campaign.spentAmount / totalBudget) * 100 : 0;

            return (
              <Card key={campaign.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl text-xl",
                        campaign.platform === "google_ads" ? "bg-red-500/15 text-red-400" :
                        campaign.platform === "facebook" ? "bg-accent-400/15 text-accent-400" :
                        campaign.platform === "instagram" ? "bg-pink-500/15 text-pink-400" :
                        campaign.platform === "tiktok" ? "bg-surface-hover" :
                        "bg-surface-hover"
                      )}>
                        {platformEmoji[campaign.platform] || "📊"}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text-primary">{campaign.name}</h3>
                        <p className="text-sm text-text-muted">
                          {campaign.adAccountName && `${campaign.adAccountName} • `}
                          {objectiveLabels[campaign.objective] || campaign.objective}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={cn("rounded-lg p-1.5", health.bg)}>
                        <HealthIcon className={cn("h-4 w-4", health.color)} />
                      </div>
                      <Badge variant={getStatusBadgeVariant(campaign.status)}>
                        {getStatusLabel(campaign.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3 lg:grid-cols-6">
                    <div className="rounded-xl bg-surface-hover p-3 text-center">
                      <p className="text-xs text-text-muted">الوصول</p>
                      <p className="mt-1 text-lg font-bold text-text-primary">{formatNumber(campaign.metrics.reach)}</p>
                    </div>
                    <div className="rounded-xl bg-surface-hover p-3 text-center">
                      <p className="text-xs text-text-muted">النقرات</p>
                      <p className="mt-1 text-lg font-bold text-text-primary">{formatNumber(campaign.metrics.clicks)}</p>
                    </div>
                    <div className="rounded-xl bg-surface-hover p-3 text-center">
                      <p className="text-xs text-text-muted">CTR</p>
                      <p className={cn(
                        "mt-1 text-lg font-bold",
                        campaign.metrics.ctr >= 1 ? "text-success-400" : campaign.metrics.ctr >= 0.5 ? "text-amber-300" : "text-error-400"
                      )}>
                        {Number(campaign.metrics.ctr).toFixed(2)}%
                      </p>
                    </div>
                    <div className="rounded-xl bg-surface-hover p-3 text-center">
                      <p className="text-xs text-text-muted">CPC</p>
                      <p className="mt-1 text-lg font-bold text-text-primary">${Number(campaign.metrics.cpc).toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl bg-surface-hover p-3 text-center">
                      <p className="text-xs text-text-muted">التحويلات</p>
                      <p className="mt-1 text-lg font-bold text-text-primary">{campaign.metrics.conversions}</p>
                    </div>
                    <div className="rounded-xl bg-surface-hover p-3 text-center">
                      <p className="text-xs text-text-muted">الإنفاق</p>
                      <p className="mt-1 text-lg font-bold text-text-primary">${Number(campaign.metrics.spend).toFixed(2)}</p>
                    </div>
                  </div>

                  {totalBudget > 0 && (
                    <div className="mt-5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted">
                          الميزانية: {formatCurrency(campaign.spentAmount)} / {formatCurrency(totalBudget)}
                        </span>
                        <span className="font-semibold text-text-secondary">{Math.round(spentPercentage)}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-surface-hover">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all",
                            spentPercentage > 90 ? "bg-error-400" : spentPercentage > 70 ? "bg-amber-300" : "bg-amber-300"
                          )}
                          style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {campaign.startDate && (
                    <div className="mt-3 text-xs text-text-muted">
                      بدأت: {new Date(campaign.startDate).toLocaleDateString("ar-SA")}
                      {campaign.endDate && ` • تنتهي: ${new Date(campaign.endDate).toLocaleDateString("ar-SA")}`}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إنشاء حملة جديدة</DialogTitle>
            <DialogDescription>أنشئ حملة إعلانية على Meta تلقائياً مع إعدادات الاستهداف</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الشركة *</Label>
                <Select
                  value={createForm.company_id}
                  onValueChange={(v) => setCreateForm((p) => ({ ...p, company_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الشركة" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الهدف *</Label>
                <Select
                  value={createForm.objective}
                  onValueChange={(v) => setCreateForm((p) => ({ ...p, objective: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الهدف" />
                  </SelectTrigger>
                  <SelectContent>
                    {META_OBJECTIVES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>اسم الحملة *</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="مثال: حملة رمضان 2026"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الميزانية اليومية (USD) *</Label>
                <Input
                  type="number"
                  value={createForm.daily_budget}
                  onChange={(e) => setCreateForm((p) => ({ ...p, daily_budget: e.target.value }))}
                  placeholder="50"
                  min="1"
                />
              </div>
              <div>
                <Label>الميزانية الإجمالية (USD)</Label>
                <Input
                  type="number"
                  value={createForm.total_budget}
                  onChange={(e) => setCreateForm((p) => ({ ...p, total_budget: e.target.value }))}
                  placeholder="1500"
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>تاريخ البدء *</Label>
                <Input
                  type="date"
                  value={createForm.start_date}
                  onChange={(e) => setCreateForm((p) => ({ ...p, start_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>تاريخ الانتهاء</Label>
                <Input
                  type="date"
                  value={createForm.end_date}
                  onChange={(e) => setCreateForm((p) => ({ ...p, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border-subtle p-4">
              <h4 className="mb-3 text-sm font-semibold text-text-secondary">الاستهداف</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>الحد الأدنى للعمر</Label>
                  <Input
                    type="number"
                    value={createForm.ageMin}
                    onChange={(e) => setCreateForm((p) => ({ ...p, ageMin: e.target.value }))}
                    min="13"
                    max="65"
                  />
                </div>
                <div>
                  <Label>الحد الأقصى للعمر</Label>
                  <Input
                    type="number"
                    value={createForm.ageMax}
                    onChange={(e) => setCreateForm((p) => ({ ...p, ageMax: e.target.value }))}
                    min="13"
                    max="65"
                  />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <Label>الجنس (1=ذكور، 2=إناث، فارغ=الكل)</Label>
                  <Input
                    value={createForm.genders}
                    onChange={(e) => setCreateForm((p) => ({ ...p, genders: e.target.value }))}
                    placeholder="1,2"
                  />
                </div>
                <div>
                  <Label>الدول (رموز ISO)</Label>
                  <Input
                    value={createForm.countries}
                    onChange={(e) => setCreateForm((p) => ({ ...p, countries: e.target.value }))}
                    placeholder="SA,AE,KW"
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label>الاهتمامات (مفصولة بفاصلة)</Label>
                <Input
                  value={createForm.interests}
                  onChange={(e) => setCreateForm((p) => ({ ...p, interests: e.target.value }))}
                  placeholder="تسوق, تقنية, رياضة"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={creating}>
              إلغاء
            </Button>
            <Button onClick={handleCreateCampaign} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              إنشاء الحملة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Optimize Dialog */}
      <Dialog open={showOptimizeDialog} onOpenChange={setShowOptimizeDialog}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>نتائج التحسين الذكي</DialogTitle>
            <DialogDescription>تحليل AI لجميع الحملات النشطة</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {optimizing ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-amber-300" />
                <p className="text-sm text-text-muted">جاري تحليل الحملات...</p>
              </div>
            ) : optimizeResults.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">لا توجد نتائج</p>
            ) : (
              optimizeResults.map((result, idx) => (
                <div key={idx} className="rounded-xl border border-border-subtle p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-text-primary">{result.campaign_name}</h4>
                    {result.success ? (
                      <Badge variant="success">النتيجة: {result.score}/100</Badge>
                    ) : (
                      <Badge variant="secondary">فشل</Badge>
                    )}
                  </div>
                  {result.success ? (
                    <>
                      <p className="mt-2 text-sm text-text-secondary">{result.analysis}</p>
                      {result.recommendations?.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-text-muted">التوصيات:</p>
                          {result.recommendations.map((rec: any, rIdx: number) => (
                            <div key={rIdx} className="flex items-start gap-2 rounded-lg bg-surface-hover p-2 text-sm">
                              <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                              <div>
                                <span className="font-medium">{rec.action}</span>
                                <span className="text-text-muted"> — {rec.reason}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {result.autoExecuted?.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-medium text-success-400">تم التنفيذ تلقائياً:</p>
                          {result.autoExecuted.map((ae: any, aIdx: number) => (
                            <p key={aIdx} className="text-xs text-success-400">
                              {ae.action}: {ae.result}
                            </p>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-error-400">{result.error}</p>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOptimizeDialog(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
