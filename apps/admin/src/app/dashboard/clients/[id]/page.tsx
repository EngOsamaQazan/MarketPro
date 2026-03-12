"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Globe,
  DollarSign,
  Calendar,
  Loader2,
  RefreshCw,
  Users,
  FileText,
  CalendarDays,
  Megaphone,
  Sparkles,
  Plus,
  Unplug,
  Link2,
  Clock,
  Target,
  Package,
  ExternalLink,
  Activity,
} from "lucide-react";
import { cn, formatCurrency, formatDate, getStatusColor, getStatusLabel, formatNumber } from "@/lib/utils";
import { INDUSTRIES, COUNTRIES, PACKAGE_TYPES } from "@satwa/shared/src/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase";

interface Client {
  id: string;
  name: string;
  name_en?: string;
  industry: string;
  country: string;
  city: string;
  monthly_budget: number;
  package_type: string;
  status: string;
  logo_url?: string;
  website?: string;
  description?: string;
  target_audience?: string;
  contract_start_date: string;
  contract_end_date?: string;
}

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  account_id: string;
  is_connected: boolean;
  followers_count?: number;
  last_synced_at?: string;
}

interface ActivityLogEntry {
  id: string;
  action_type: string;
  created_at: string;
  result?: Record<string, any>;
  details?: string;
}

interface ClientStats {
  plans: number;
  reports: number;
  content: number;
  campaigns: number;
}

const PLATFORMS = [
  { id: "meta", name: "Meta (Facebook + Instagram)", emoji: "📘", color: "bg-accent-400/15 text-accent-400" },
  { id: "tiktok", name: "TikTok", emoji: "🎵", color: "bg-surface-elevated text-text-secondary" },
  { id: "x", name: "X (Twitter)", emoji: "𝕏", color: "bg-surface-elevated text-text-secondary" },
  { id: "linkedin", name: "LinkedIn", emoji: "💼", color: "bg-accent-400/15 text-accent-400" },
  { id: "snapchat", name: "Snapchat", emoji: "👻", color: "bg-amber-300/15 text-amber-300" },
  { id: "youtube", name: "YouTube", emoji: "▶️", color: "bg-error-400/15 text-error-400" },
];

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  active: "success",
  paused: "warning",
  ended: "destructive",
};

const pkgVariant: Record<string, "warning" | "default" | "secondary"> = {
  enterprise: "warning",
  pro: "default",
  basic: "secondary",
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  generate_plan: "إنشاء خطة تسويقية",
  generate_content: "إنشاء محتوى",
  optimize_campaign: "تحسين حملة",
  auto_manage: "إدارة تلقائية",
  create_report: "إنشاء تقرير",
  publish_content: "نشر محتوى",
  schedule_content: "جدولة محتوى",
  connect_account: "ربط حساب",
  disconnect_account: "فصل حساب",
};

function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="flex items-center gap-6">
        <Skeleton className="h-20 w-20 rounded-2xl" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-lg" />
            <Skeleton className="h-6 w-20 rounded-lg" />
          </div>
        </div>
      </div>
      <Skeleton className="h-11 w-80 rounded-xl" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-3 h-4 w-48" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ClientStats>({ plans: 0, reports: 0, content: 0, campaigns: 0 });

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoveredPages, setDiscoveredPages] = useState<any[]>([]);
  const [discoveredAds, setDiscoveredAds] = useState<any[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);

  const fetchClient = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients?id=${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const found = data.clients
        ? data.clients.find((c: Client) => c.id === id) || data.clients[0]
        : data.client;
      if (!found) throw new Error("العميل غير موجود");
      setClient(found);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  const fetchStats = useCallback(async () => {
    try {
      const [plansRes, reportsRes, contentRes, campaignsRes] = await Promise.allSettled([
        fetch(`/api/plans?company_id=${id}`).then((r) => r.json()),
        fetch(`/api/reports?company_id=${id}`).then((r) => r.json()),
        fetch(`/api/content?company_id=${id}`).then((r) => r.json()),
        fetch(`/api/google-ads/campaigns?company_id=${id}`).then((r) => r.json()),
      ]);
      setStats({
        plans: plansRes.status === "fulfilled" ? (plansRes.value.plans?.length || 0) : 0,
        reports: reportsRes.status === "fulfilled" ? (reportsRes.value.reports?.length || 0) : 0,
        content: contentRes.status === "fulfilled" ? (contentRes.value.content?.length || 0) : 0,
        campaigns: campaignsRes.status === "fulfilled" ? (campaignsRes.value.campaigns?.length || 0) : 0,
      });
    } catch {
      // Stats are non-critical
    }
  }, [id]);

  const fetchAccounts = useCallback(async () => {
    setAccountsLoading(true);
    try {
      const res = await fetch(`/api/social-accounts?company_id=${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAccounts(data.accounts || []);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
      setAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  }, [id, toast]);

  const fetchActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("ai_activity_log")
        .select("*")
        .eq("company_id", id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setActivities(data || []);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchClient();
    fetchStats();

    const url = new URL(window.location.href);
    if (url.searchParams.get("connected") === "true") {
      fetchAccounts();
      toast({ title: "تم الربط بنجاح", description: "تم ربط الحساب وحفظ البيانات", variant: "success" });
      url.searchParams.delete("connected");
      window.history.replaceState({}, "", url.pathname);
    }
    if (url.searchParams.get("error")) {
      toast({ title: "خطأ في الربط", description: "فشل ربط الحساب. حاول مرة أخرى.", variant: "destructive" });
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [fetchClient, fetchStats]);

  const handleTabChange = (value: string) => {
    if (value === "accounts" && accounts.length === 0 && !accountsLoading) {
      fetchAccounts();
    }
    if (value === "activity" && activities.length === 0 && !activitiesLoading) {
      fetchActivities();
    }
  };

  const connectPlatform = async (platformId: string) => {
    setConnectingPlatform(platformId);
    try {
      const res = await fetch("/api/social-accounts/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: id,
          platform: platformId,
          redirect_uri: window.location.origin + "/api/social-accounts/callback",
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.oauth_url) {
        window.location.href = data.oauth_url;
      } else {
        toast({ title: "تم", description: "تم ربط الحساب بنجاح", variant: "success" });
        setShowConnectDialog(false);
        fetchAccounts();
      }
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setConnectingPlatform(null);
    }
  };

  const discoverPages = async () => {
    setDiscoverLoading(true);
    try {
      const res = await fetch("/api/social-accounts/discover");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDiscoveredPages(data.pages || []);
      setDiscoveredAds(data.ad_accounts || []);
      setSelectedPages(new Set());
      setSelectedAds(new Set());
      setShowAssignDialog(true);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setDiscoverLoading(false);
    }
  };

  const assignSelected = async () => {
    setAssigning(true);
    try {
      const pages = discoveredPages.filter((p) => selectedPages.has(p.id));
      const ads = discoveredAds.filter((a) => selectedAds.has(a.id));
      const res = await fetch("/api/social-accounts/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: id,
          selected_pages: pages,
          selected_ad_accounts: ads,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: "تم بنجاح", description: `تم تعيين ${data.count} حساب للعميل`, variant: "success" });
      setShowAssignDialog(false);
      fetchAccounts();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

  const togglePage = (pageId: string) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  };

  const toggleAd = (adId: string) => {
    setSelectedAds((prev) => {
      const next = new Set(prev);
      if (next.has(adId)) next.delete(adId);
      else next.add(adId);
      return next;
    });
  };

  const disconnectAccount = async (accountId: string) => {
    setDisconnecting(accountId);
    try {
      const res = await fetch(`/api/social-accounts?id=${accountId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast({ title: "تم", description: "تم فصل الحساب بنجاح", variant: "success" });
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setDisconnecting(null);
    }
  };

  if (loading) return <PageSkeleton />;

  if (!client) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Users className="h-12 w-12 text-text-muted" />
        <h2 className="text-xl font-bold text-text-secondary">العميل غير موجود</h2>
        <p className="text-sm text-text-muted">لم يتم العثور على العميل المطلوب</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/clients")}>
          <ArrowRight className="h-4 w-4" />
          العودة للعملاء
        </Button>
      </div>
    );
  }

  const industry = INDUSTRIES.find((i) => i.value === client.industry);
  const country = COUNTRIES.find((c) => c.code === client.country);
  const pkg = PACKAGE_TYPES.find((p) => p.value === client.package_type);

  const statCards = [
    { label: "الخطط", value: stats.plans, icon: Sparkles, color: "from-purple-500 to-indigo-600" },
    { label: "التقارير", value: stats.reports, icon: FileText, color: "from-amber-500 to-orange-600" },
    { label: "المحتوى المجدول", value: stats.content, icon: CalendarDays, color: "from-emerald-500 to-teal-600" },
    { label: "الحملات", value: stats.campaigns, icon: Megaphone, color: "from-blue-500 to-cyan-600" },
  ];

  const quickActions = [
    { label: "إنشاء خطة", icon: Sparkles, href: `/dashboard/plans?company_id=${id}` },
    { label: "إنشاء محتوى", icon: CalendarDays, href: `/dashboard/content?company_id=${id}` },
    { label: "إنشاء تقرير", icon: FileText, href: `/dashboard/reports?company_id=${id}` },
  ];

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/clients")} className="gap-2 text-text-muted hover:text-text-secondary">
        <ArrowRight className="h-4 w-4" />
        العودة للعملاء
      </Button>

      {/* Client Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-elevated text-4xl font-bold text-amber-300 overflow-hidden shadow-sm">
            {client.logo_url ? (
              <img src={client.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              client.name.charAt(0)
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{client.name}</h1>
            {client.name_en && (
              <p className="mt-0.5 text-sm text-text-muted">{client.name_en}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant[client.status] || "secondary"}>
                {getStatusLabel(client.status)}
              </Badge>
              <Badge variant={pkgVariant[pkg?.value || "basic"] || "secondary"}>
                {pkg?.label_ar || client.package_type}
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => { fetchClient(); fetchStats(); }}>
          <RefreshCw className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" dir="rtl" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="accounts">الحسابات المتصلة</TabsTrigger>
          <TabsTrigger value="activity">سجل النشاط</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statCards.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-text-muted">{stat.label}</p>
                      <p className="mt-2 text-3xl font-bold text-text-primary">{formatNumber(stat.value)}</p>
                    </div>
                    <div className={cn("rounded-xl bg-gradient-to-br p-3 text-white shadow-lg", stat.color)}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => (
              <Button key={action.label} variant="outline" onClick={() => router.push(action.href)}>
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </div>

          <Separator />

          {/* Client Details */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-5 w-5 text-text-muted" />
                  معلومات الشركة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailRow label="المجال" value={industry?.label_ar || client.industry} />
                <DetailRow
                  label="الموقع"
                  value={`${country?.name_ar || client.country}${client.city ? ` - ${client.city}` : ""}`}
                />
                {client.website && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">الموقع الإلكتروني</span>
                    <a
                      href={client.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-medium text-amber-300 hover:underline"
                      dir="ltr"
                    >
                      {client.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-5 w-5 text-text-muted" />
                  تفاصيل الباقة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailRow label="نوع الباقة" value={pkg?.label_ar || client.package_type} />
                <DetailRow label="الميزانية الشهرية" value={formatCurrency(client.monthly_budget)} />
                {pkg && (
                  <>
                    <DetailRow label="المنصات المتاحة" value={`${pkg.platforms} منصات`} />
                    <DetailRow label="المنشورات/شهر" value={`${pkg.posts_per_month} منشور`} />
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-5 w-5 text-text-muted" />
                  العقد
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailRow label="تاريخ البداية" value={formatDate(client.contract_start_date)} />
                <DetailRow
                  label="تاريخ النهاية"
                  value={client.contract_end_date ? formatDate(client.contract_end_date) : "غير محدد"}
                />
                <DetailRow label="الحالة" value={getStatusLabel(client.status)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-5 w-5 text-text-muted" />
                  الاستهداف
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-text-muted">الجمهور المستهدف</span>
                  <p className="mt-1 text-sm font-medium text-text-secondary">
                    {client.target_audience || "غير محدد"}
                  </p>
                </div>
                {client.description && (
                  <div>
                    <span className="text-sm text-text-muted">وصف الشركة</span>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">{client.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Connected Accounts */}
        <TabsContent value="accounts" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-primary">الحسابات المتصلة</h2>
              <p className="mt-1 text-sm text-text-muted">
                {accounts.filter((a) => a.is_connected).length} حساب متصل
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={fetchAccounts} disabled={accountsLoading}>
                <RefreshCw className={cn("h-4 w-4", accountsLoading && "animate-spin")} />
                تحديث
              </Button>
              <Button variant="outline" onClick={discoverPages} disabled={discoverLoading}>
                {discoverLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                تعيين من حسابك
              </Button>
              <Button onClick={() => setShowConnectDialog(true)}>
                <Plus className="h-4 w-4" />
                ربط حساب جديد (OAuth)
              </Button>
            </div>
          </div>

          {accountsLoading ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-8 w-20 rounded-lg" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-12 text-center">
              <Link2 className="h-10 w-10 text-text-muted" />
              <h3 className="text-lg font-bold text-text-secondary">لا توجد حسابات متصلة</h3>
              <p className="text-sm text-text-muted">قم بربط حسابات التواصل الاجتماعي لإدارتها من هنا</p>
              <Button onClick={() => setShowConnectDialog(true)} className="mt-2">
                <Plus className="h-4 w-4" />
                ربط حساب جديد
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {accounts.map((account) => {
                const platform = PLATFORMS.find((p) => p.id === account.platform);
                return (
                  <Card key={account.id} className="transition-all hover:shadow-md">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-xl", platform?.color || "bg-surface-elevated")}>
                          {platform?.emoji || "🔗"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-text-primary truncate">{account.account_name}</h4>
                            <Badge variant={account.is_connected ? "success" : "secondary"}>
                              {account.is_connected ? "متصل" : "غير متصل"}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-text-muted" dir="ltr">
                            {platform?.name || account.platform} • {account.account_id}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-text-muted">
                            {account.followers_count != null && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {formatNumber(account.followers_count)} متابع
                              </span>
                            )}
                            {account.last_synced_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(account.last_synced_at)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-error-400 hover:bg-error-400/15 hover:text-error-400"
                          disabled={disconnecting === account.id}
                          onClick={() => disconnectAccount(account.id)}
                        >
                          {disconnecting === account.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Unplug className="h-4 w-4" />
                          )}
                          فصل
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Connect Dialog */}
          <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>ربط حساب جديد</DialogTitle>
                <DialogDescription>
                  اختر المنصة التي تريد ربطها بحساب العميل
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => connectPlatform(platform.id)}
                    disabled={connectingPlatform !== null}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border border-border-subtle p-4 text-right transition-all hover:border-amber-400 hover:bg-amber-300/10 hover:shadow-sm disabled:opacity-50",
                      connectingPlatform === platform.id && "border-amber-400 bg-amber-300/10"
                    )}
                  >
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-lg", platform.color)}>
                      {platform.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-secondary truncate">{platform.name}</p>
                    </div>
                    {connectingPlatform === platform.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
                    )}
                  </button>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
                  إلغاء
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Assign Pages Dialog */}
          <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>تعيين صفحات وحسابات للعميل</DialogTitle>
                <DialogDescription>
                  اختر الصفحات والحسابات الإعلانية من حسابك المربوط لتعيينها لهذا العميل
                </DialogDescription>
              </DialogHeader>

              {discoveredPages.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-text-secondary mb-3">📘 الصفحات ({discoveredPages.length})</h4>
                  <div className="space-y-2">
                    {discoveredPages.map((page) => (
                      <label
                        key={page.id}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                          selectedPages.has(page.id)
                            ? "border-accent-400 bg-accent-400/15"
                            : "border-border-subtle hover:border-border-default"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedPages.has(page.id)}
                          onChange={() => togglePage(page.id)}
                          className="h-4 w-4 rounded border-border-default text-accent-400"
                        />
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-400/15 overflow-hidden">
                          {page.picture ? (
                            <img src={page.picture} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-lg">📘</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">{page.name}</p>
                          <p className="text-xs text-text-muted" dir="ltr">
                            {page.category || "Page"} • ID: {page.id}
                            {page.business && ` • ${page.business}`}
                          </p>
                        </div>
                        {page.followers > 0 && (
                          <span className="text-xs text-text-muted flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {formatNumber(page.followers)}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {discoveredAds.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-bold text-text-secondary mb-3">📊 الحسابات الإعلانية ({discoveredAds.length})</h4>
                  <div className="space-y-2">
                    {discoveredAds.map((ad) => (
                      <label
                        key={ad.id}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                          selectedAds.has(ad.id)
                            ? "border-success-400 bg-success-400/15"
                            : "border-border-subtle hover:border-border-default"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAds.has(ad.id)}
                          onChange={() => toggleAd(ad.id)}
                          className="h-4 w-4 rounded border-border-default text-success-400"
                        />
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-400/15">
                          <DollarSign className="h-5 w-5 text-success-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">{ad.name || ad.id}</p>
                          <p className="text-xs text-text-muted" dir="ltr">
                            {ad.currency || ""} • ID: {ad.id}
                            {ad.business && ` • ${ad.business}`}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {discoveredPages.length === 0 && discoveredAds.length === 0 && (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <Link2 className="h-10 w-10 text-text-muted" />
                  <p className="text-sm text-text-muted">لم يتم العثور على صفحات أو حسابات إعلانية</p>
                  <p className="text-xs text-text-muted">تأكد من ربط حسابك على Meta من صفحة الإعدادات أولاً</p>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                  إلغاء
                </Button>
                <Button
                  onClick={assignSelected}
                  disabled={assigning || (selectedPages.size === 0 && selectedAds.size === 0)}
                >
                  {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  تعيين ({selectedPages.size + selectedAds.size}) للعميل
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tab 3: Activity Log */}
        <TabsContent value="activity" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-primary">سجل النشاط</h2>
              <p className="mt-1 text-sm text-text-muted">آخر الأنشطة والعمليات لهذا العميل</p>
            </div>
            <Button variant="outline" onClick={fetchActivities} disabled={activitiesLoading}>
              <RefreshCw className={cn("h-4 w-4", activitiesLoading && "animate-spin")} />
              تحديث
            </Button>
          </div>

          {activitiesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-12 text-center">
              <Activity className="h-10 w-10 text-text-muted" />
              <h3 className="text-lg font-bold text-text-secondary">لا يوجد نشاط بعد</h3>
              <p className="text-sm text-text-muted">ستظهر هنا جميع العمليات التي تتم على هذا العميل</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <Card key={activity.id} className="transition-all hover:shadow-sm">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", getStatusColor(activity.action_type))}>
                      <Activity className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-secondary">
                        {ACTION_TYPE_LABELS[activity.action_type] || activity.action_type}
                      </p>
                      {activity.result && (
                        <p className="mt-0.5 text-xs text-text-muted truncate">
                          {typeof activity.result === "object"
                            ? activity.result.summary || activity.result.message || JSON.stringify(activity.result).slice(0, 80)
                            : String(activity.result)}
                        </p>
                      )}
                      {activity.details && !activity.result && (
                        <p className="mt-0.5 text-xs text-text-muted truncate">{activity.details}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-text-muted shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(activity.created_at)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-sm font-medium text-text-secondary">{value}</span>
    </div>
  );
}
