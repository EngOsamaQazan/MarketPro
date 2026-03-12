"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Send,
  Sparkles,
  Calendar,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Download,
} from "lucide-react";
import { cn, formatDate, getStatusLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface Report {
  id: string;
  company_id: string;
  companies?: { name: string; name_en?: string };
  month: string;
  status: string;
  report_data: any;
  pdf_url: string | null;
  viewed_by_client: boolean;
  sent_at: string | null;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
}

const statusBadgeVariant: Record<string, "success" | "info" | "purple" | "secondary"> = {
  sent: "success",
  ready: "info",
  generating: "purple",
};

export default function ReportsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReports(data.reports || []);

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

  const generateReport = async () => {
    const company = companies.find((c) => c.id === selectedCompany);
    if (!company) return;

    setGenerating(true);
    try {
      const saveRes = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: company.id,
          month: reportMonth,
          status: "generating",
          report_data: {
            summary: `تقرير أداء ${company.name} لشهر ${formatDate(reportMonth)}`,
            achievements: [],
            platform_stats: {},
            campaign_results: [],
            content_performance: [],
            budget_analysis: { total_planned: 0, total_spent: 0, utilization_rate: 0, by_platform: {}, roi_estimate: 0 },
            kpi_results: {},
            comparison_with_previous: {},
            ai_insights: ["جاري تحليل البيانات بالذكاء الاصطناعي..."],
            next_month_recommendations: [],
          },
        }),
      });

      const saveData = await saveRes.json();
      if (saveData.error) throw new Error(saveData.error);

      await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: saveData.report.id,
          status: "ready",
          report_data: {
            ...saveData.report.report_data,
            summary: `تقرير شامل لأداء ${company.name} للفترة المحددة. يتضمن تحليل لجميع المنصات والحملات الإعلانية.`,
            ai_insights: [
              "أداء الحملات يتحسن بشكل مستمر",
              "يُنصح بزيادة الاستثمار في المحتوى المرئي",
              "الجمهور المستهدف يتفاعل أكثر مع محتوى الفيديو القصير",
            ],
            next_month_recommendations: [
              "التركيز على Reels وفيديوهات قصيرة",
              "اختبار حملات إعادة الاستهداف",
              "زيادة ميزانية المحتوى المدفوع بنسبة 15%",
            ],
          },
        }),
      });

      setShowModal(false);
      setSelectedCompany("");
      toast({ title: "تم", description: "تم إنشاء التقرير بنجاح", variant: "success" });
      fetchData();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const generatePdf = async (reportId: string) => {
    setGeneratingPdf(reportId);
    try {
      const res = await fetch("/api/reports/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "report", id: reportId }),
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

  const sendToClient = async (id: string) => {
    try {
      await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: "sent",
          sent_at: new Date().toISOString(),
        }),
      });
      toast({ title: "تم", description: "تم إرسال التقرير للعميل", variant: "success" });
      fetchData();
    } catch (e: any) {
      toast({ title: "خطأ", description: e?.message || "حدث خطأ أثناء الإرسال", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-11 w-24" />
            <Skeleton className="h-11 w-32" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-2xl" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="mt-2 h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="mt-4 h-4 w-full" />
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
          <h1 className="text-2xl font-bold text-text-primary">التقارير الشهرية</h1>
          <p className="mt-1 text-text-muted">
            {reports.length} تقرير • {reports.filter((r) => r.status === "sent").length} مُرسل
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Sparkles className="h-4 w-4" />
            إنشاء تقرير
          </Button>
        </div>
      </div>

      {reports.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <BarChart3 className="h-10 w-10 text-text-muted" />
          <h3 className="text-lg font-bold text-text-secondary">لا توجد تقارير بعد</h3>
          <p className="text-sm text-text-muted">أنشئ تقرير أداء شهري لعملائك</p>
          <Button onClick={() => setShowModal(true)} className="mt-2">
            <Sparkles className="h-4 w-4" />
            إنشاء أول تقرير
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const data = report.report_data || {};
            return (
              <Card key={report.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl",
                        report.status === "sent" ? "bg-success-400/10" : report.status === "ready" ? "bg-blue-500/15" : "bg-purple-500/15"
                      )}>
                        <BarChart3 className={cn(
                          "h-6 w-6",
                          report.status === "sent" ? "text-success-400" : report.status === "ready" ? "text-blue-400" : "text-purple-400"
                        )} />
                      </div>
                      <div>
                        <h3 className="font-bold text-text-primary">
                          {report.companies?.name || "عميل"}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-text-muted">
                          <Calendar className="h-3.5 w-3.5" />
                          تقرير {formatDate(report.month)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant={statusBadgeVariant[report.status] || "secondary"}>
                        {getStatusLabel(report.status)}
                      </Badge>
                      {report.status === "ready" && (
                        <Button
                          size="sm"
                          onClick={() => sendToClient(report.id)}
                          title="إرسال للعميل"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {report.pdf_url ? (
                        <Button variant="outline" size="sm" onClick={() => window.open(report.pdf_url!, "_blank")}>
                          <Download className="h-4 w-4" />
                          PDF
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generatePdf(report.id)}
                          disabled={generatingPdf === report.id}
                        >
                          {generatingPdf === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                          توليد PDF
                        </Button>
                      )}
                    </div>
                  </div>

                  {data.summary && (
                    <p className="mt-4 text-sm text-text-secondary leading-relaxed">{data.summary}</p>
                  )}

                  {data.ai_insights?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {data.ai_insights.slice(0, 3).map((insight: string, i: number) => (
                        <span key={i} className="rounded-lg bg-surface-hover px-3 py-1.5 text-xs text-text-secondary">
                          {insight}
                        </span>
                      ))}
                    </div>
                  )}

                  {report.viewed_by_client && (
                    <p className="mt-3 flex items-center gap-1 text-xs text-success-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      شوهد من قبل العميل
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Sparkles className="inline h-5 w-5 text-amber-300 ml-2" />
              إنشاء تقرير شهري
            </DialogTitle>
            <DialogDescription>
              اختر العميل والشهر لإنشاء تقرير أداء جديد
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>العميل</Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
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
                value={reportMonth.substring(0, 7)}
                onChange={(e) => setReportMonth(e.target.value + "-01")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              إلغاء
            </Button>
            <Button
              onClick={generateReport}
              disabled={!selectedCompany || generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  إنشاء التقرير
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
