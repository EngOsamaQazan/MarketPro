"use client";

import { BarChart3, Download, Eye, Send, Sparkles, Calendar, FileText } from "lucide-react";
import { cn, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";

const mockReports = [
  {
    id: "1",
    company: "مطعم الفاخر",
    month: "2026-02-01",
    status: "sent",
    viewed_by_client: true,
    pdf_url: "#",
    overall_score: 8.5,
    highlights: ["زيادة المتابعين 22%", "ROAS 5.2x على الإعلانات", "أعلى تفاعل على Reels"],
  },
  {
    id: "2",
    company: "شركة النور للتجارة",
    month: "2026-02-01",
    status: "ready",
    viewed_by_client: false,
    pdf_url: "#",
    overall_score: 7.8,
    highlights: ["حملة الشتاء حققت 200% من الهدف", "نمو المبيعات الإلكترونية 45%"],
  },
  {
    id: "3",
    company: "عيادة الشفاء",
    month: "2026-02-01",
    status: "generating",
    viewed_by_client: false,
    pdf_url: null,
    overall_score: 0,
    highlights: [],
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">التقارير الشهرية</h1>
          <p className="mt-1 text-slate-500">إنشاء وإرسال تقارير الأداء للعملاء</p>
        </div>
        <button className="btn-primary">
          <Sparkles className="h-4 w-4" />
          إنشاء تقرير AI
        </button>
      </div>

      <div className="space-y-4">
        {mockReports.map((report) => (
          <div key={report.id} className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl",
                  report.status === "sent" ? "bg-emerald-100" : report.status === "ready" ? "bg-blue-100" : "bg-purple-100"
                )}>
                  <BarChart3 className={cn(
                    "h-6 w-6",
                    report.status === "sent" ? "text-emerald-600" : report.status === "ready" ? "text-blue-600" : "text-purple-600"
                  )} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{report.company}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    تقرير {formatDate(report.month)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {report.overall_score > 0 && (
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold",
                    report.overall_score >= 8 ? "bg-emerald-100 text-emerald-700" :
                    report.overall_score >= 6 ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  )}>
                    {report.overall_score}
                  </div>
                )}
                <span className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  getStatusColor(report.status)
                )}>
                  {getStatusLabel(report.status)}
                </span>
                {report.pdf_url && (
                  <>
                    <button className="btn-secondary !px-3 !py-2" title="تحميل PDF">
                      <Download className="h-4 w-4" />
                    </button>
                    <button className="btn-secondary !px-3 !py-2" title="معاينة">
                      <Eye className="h-4 w-4" />
                    </button>
                    {report.status === "ready" && (
                      <button className="btn-primary !px-3 !py-2" title="إرسال للعميل">
                        <Send className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {report.highlights.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {report.highlights.map((h, i) => (
                  <span key={i} className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                    ✨ {h}
                  </span>
                ))}
              </div>
            )}

            {report.viewed_by_client && (
              <p className="mt-3 text-xs text-emerald-600">✓ شوهد من قبل العميل</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
