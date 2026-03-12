"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Sparkles,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Target,
  Calendar,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn, formatCurrency, getStatusColor, getStatusLabel, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const platformEmoji: Record<string, string> = {
  facebook: "📘", instagram: "📸", tiktok: "🎵",
  snapchat: "👻", x: "𝕏", linkedin: "💼", youtube: "▶️",
};

const statusBadgeVariant: Record<string, "info" | "success" | "purple" | "secondary"> = {
  pending_approval: "info",
  approved: "success",
  in_progress: "purple",
  completed: "success",
  draft: "secondary",
};

interface Plan {
  id: string;
  company_id: string;
  companies?: { name: string; name_en?: string };
  month: string;
  title: string;
  status: string;
  total_budget: number;
  target_platforms: string[];
  objectives: string[];
  kpis: Record<string, { target: number; current?: number; unit: string }> | null;
  budget_breakdown: Record<string, number> | null;
  ai_analysis: Record<string, unknown> | null;
  pdf_url: string | null;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  name_en: string | null;
  industry: string;
  country: string;
  city: string;
  monthly_budget: number;
  target_audience: string | null;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [planMonth, setPlanMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [planGoals, setPlanGoals] = useState("");
  const [planPlatforms, setPlanPlatforms] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plans");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlans(data.plans || []);

      const clientsRes = await fetch("/api/clients");
      const clientsData = await clientsRes.json();
      setCompanies(clientsData.clients || []);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const generatePlan = async () => {
    const company = companies.find((c) => c.id === selectedCompany);
    if (!company || planPlatforms.length === 0) return;

    setGenerating(true);
    try {
      const aiRes = await fetch("/api/ai/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: company.name,
          industry: company.industry,
          country: company.country,
          city: company.city,
          targetAudience: company.target_audience || "",
          monthlyBudget: company.monthly_budget,
          platforms: planPlatforms,
          goals: planGoals.split("\n").filter(Boolean),
        }),
      });

      const aiData = await aiRes.json();
      if (!aiData.success) throw new Error(aiData.error || "فشل توليد الخطة");

      const plan = aiData.plan;

      const saveRes = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: company.id,
          month: planMonth,
          title: plan.title || `خطة تسويق ${company.name} - ${formatDate(planMonth)}`,
          objectives: plan.objectives || [],
          target_platforms: planPlatforms,
          total_budget: plan.total_budget || company.monthly_budget,
          budget_breakdown: plan.budget_breakdown || {},
          kpis: plan.kpis || {},
          ai_analysis: plan,
          status: "pending_approval",
        }),
      });

      const saveData = await saveRes.json();
      if (saveData.error) throw new Error(saveData.error);

      setShowModal(false);
      setSelectedCompany("");
      setPlanGoals("");
      setPlanPlatforms([]);
      fetchData();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const generatePdf = async (planId: string) => {
    setGeneratingPdf(planId);
    try {
      const res = await fetch("/api/reports/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "plan", id: planId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "فشل توليد PDF");
      toast({ title: "تم", description: "تم توليد PDF بنجاح" });
      if (data.pdf_url) window.open(data.pdf_url, "_blank");
      fetchData();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingPdf(null);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await fetch("/api/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status,
          ...(status === "approved" ? { approved_by: user?.id, approved_at: new Date().toISOString() } : {}),
        }),
      });
      fetchData();
    } catch {}
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-11 w-24" />
            <Skeleton className="h-11 w-56" />
          </div>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-2xl" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="mt-2 h-4 w-64" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="mt-4 flex gap-1.5">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-8 w-8 rounded-lg" />
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Skeleton className="h-8 w-32 rounded-lg" />
                  <Skeleton className="h-8 w-40 rounded-lg" />
                  <Skeleton className="h-8 w-28 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">خطط التسويق</h1>
          <p className="mt-1 text-slate-500">
            {plans.length} خطة • {plans.filter((p) => p.status === "in_progress").length} قيد التنفيذ
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Sparkles className="h-4 w-4" />
            إنشاء خطة بالذكاء الاصطناعي
          </Button>
        </div>
      </div>

      {plans.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <FileText className="h-10 w-10 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-600">لا توجد خطط بعد</h3>
          <p className="text-sm text-slate-400">
            ابدأ بإنشاء خطة تسويقية شهرية باستخدام الذكاء الاصطناعي
          </p>
          <Button onClick={() => setShowModal(true)} className="mt-2">
            <Sparkles className="h-4 w-4" />
            إنشاء أول خطة
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100">
                      <FileText className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{plan.title}</h3>
                      <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                        <span>{plan.companies?.name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(plan.month)}
                        </span>
                        <span>•</span>
                        <span>{formatCurrency(plan.total_budget)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusBadgeVariant[plan.status] || "secondary"}>
                      {getStatusLabel(plan.status)}
                    </Badge>
                    {plan.status === "pending_approval" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(plan.id, "approved")}
                        className="border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        اعتماد
                      </Button>
                    )}
                    {plan.status === "approved" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(plan.id, "in_progress")}
                        className="border-indigo-200 bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                      >
                        بدء التنفيذ
                      </Button>
                    )}
                    {plan.pdf_url ? (
                      <Button variant="outline" size="sm" onClick={() => window.open(plan.pdf_url!, "_blank")}>
                        <Download className="h-4 w-4" />
                        تحميل PDF
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generatePdf(plan.id)}
                        disabled={generatingPdf === plan.id}
                      >
                        {generatingPdf === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        توليد PDF
                      </Button>
                    )}
                  </div>
                </div>

                {plan.target_platforms && plan.target_platforms.length > 0 && (
                  <div className="mt-4 flex gap-1.5">
                    {plan.target_platforms.map((p) => (
                      <span key={p} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-sm">
                        {platformEmoji[p] || "📊"}
                      </span>
                    ))}
                  </div>
                )}

                {plan.objectives && plan.objectives.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-700">الأهداف:</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {plan.objectives.map((obj, i) => (
                        <span key={i} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                          <Target className="h-3 w-3 text-primary-500" />
                          {obj}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {plan.kpis && Object.keys(plan.kpis).length > 0 && (
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">مؤشرات الأداء:</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(plan.kpis).slice(0, 6).map(([key, kpi]) => (
                        <div key={key} className="rounded-xl bg-slate-50 p-3">
                          <span className="text-xs text-slate-500">
                            {key.replace(/_/g, " ")}
                          </span>
                          <p className="mt-1 text-sm font-bold text-slate-700">
                            {typeof kpi === "object" && kpi !== null && "target" in kpi
                              ? `${(kpi as any).target?.toLocaleString("ar-SA")} ${(kpi as any).unit || ""}`
                              : String(kpi)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generate Plan Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Sparkles className="inline h-5 w-5 text-primary-600 ml-2" />
              إنشاء خطة بالذكاء الاصطناعي
            </DialogTitle>
            <DialogDescription>
              اختر العميل والمنصات لتوليد خطة تسويقية شهرية بالذكاء الاصطناعي
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>العميل</Label>
              <Select
                value={selectedCompany || undefined}
                onValueChange={setSelectedCompany}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر العميل..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الشهر</Label>
              <Input
                type="month"
                value={planMonth.substring(0, 7)}
                onChange={(e) => setPlanMonth(e.target.value + "-01")}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label>المنصات</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(platformEmoji).map(([key, emoji]) => (
                  <Button
                    key={key}
                    type="button"
                    variant={planPlatforms.includes(key) ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setPlanPlatforms((prev) =>
                        prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
                      )
                    }
                  >
                    <span>{emoji}</span>
                    {key}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>الأهداف (سطر لكل هدف)</Label>
              <Textarea
                value={planGoals}
                onChange={(e) => setPlanGoals(e.target.value)}
                rows={3}
                placeholder={"زيادة المتابعين 20%\nتحقيق 100 طلب شراء\nرفع معدل التفاعل"}
                className="resize-none"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              إلغاء
            </Button>
            <Button
              onClick={generatePlan}
              disabled={!selectedCompany || planPlatforms.length === 0 || generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري التوليد...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  توليد الخطة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
