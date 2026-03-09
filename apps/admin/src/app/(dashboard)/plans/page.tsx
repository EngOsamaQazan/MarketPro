"use client";

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
} from "lucide-react";
import { cn, formatCurrency, getStatusColor, getStatusLabel, formatDate } from "@/lib/utils";

const mockPlans = [
  {
    id: "1",
    company: "مطعم الفاخر",
    month: "2026-03-01",
    title: "خطة تسويق مارس 2026 - مطعم الفاخر",
    status: "in_progress",
    total_budget: 2000,
    platforms: ["facebook", "instagram", "tiktok"],
    objectives: [
      "زيادة المتابعين بنسبة 15%",
      "تحقيق 200 حجز عبر الإنترنت",
      "رفع معدل التفاعل إلى 5%",
    ],
    progress: 65,
    pdf_url: "#",
    kpis: {
      followers_target: { target: 18000, current: 16200, unit: "متابع" },
      engagement_rate: { target: 5, current: 4.2, unit: "%" },
      bookings: { target: 200, current: 130, unit: "حجز" },
    },
  },
  {
    id: "2",
    company: "شركة النور للتجارة",
    month: "2026-03-01",
    title: "خطة تسويق مارس 2026 - النور للتجارة",
    status: "approved",
    total_budget: 5000,
    platforms: ["facebook", "instagram", "snapchat", "tiktok", "x"],
    objectives: [
      "إطلاق حملة عروض الربيع",
      "تحقيق ROAS 5x على الإعلانات",
      "زيادة المبيعات الإلكترونية 30%",
    ],
    progress: 40,
    pdf_url: "#",
    kpis: {
      roas: { target: 5, current: 4.2, unit: "x" },
      sales: { target: 150, current: 60, unit: "طلب" },
      reach: { target: 500000, current: 200000, unit: "وصول" },
    },
  },
  {
    id: "3",
    company: "عيادة الشفاء",
    month: "2026-03-01",
    title: "خطة تسويق مارس 2026 - عيادة الشفاء",
    status: "pending_approval",
    total_budget: 3000,
    platforms: ["facebook", "instagram"],
    objectives: [
      "بناء الوعي بالخدمات الجديدة",
      "توليد 50 حجز استشارة",
      "إنتاج 8 فيديوهات توعوية",
    ],
    progress: 0,
    pdf_url: null,
    kpis: {
      consultations: { target: 50, current: 0, unit: "حجز" },
      videos: { target: 8, current: 0, unit: "فيديو" },
      followers: { target: 10000, current: 8900, unit: "متابع" },
    },
  },
];

const platformEmoji: Record<string, string> = {
  facebook: "📘", instagram: "📸", tiktok: "🎵",
  snapchat: "👻", x: "𝕏", linkedin: "💼", youtube: "▶️",
};

export default function PlansPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">خطط التسويق</h1>
          <p className="mt-1 text-slate-500">إنشاء وإدارة الخطط التسويقية الشهرية</p>
        </div>
        <button className="btn-primary">
          <Sparkles className="h-4 w-4" />
          إنشاء خطة بالذكاء الاصطناعي
        </button>
      </div>

      <div className="space-y-6">
        {mockPlans.map((plan) => (
          <div key={plan.id} className="card overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100">
                    <FileText className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{plan.title}</h3>
                    <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
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
                  <span className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    getStatusColor(plan.status)
                  )}>
                    {getStatusLabel(plan.status)}
                  </span>
                  {plan.pdf_url && (
                    <button className="btn-secondary !px-3 !py-2">
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                  <button className="btn-secondary !px-3 !py-2">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Platforms */}
              <div className="mt-4 flex gap-1.5">
                {plan.platforms.map((p) => (
                  <span key={p} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-sm">
                    {platformEmoji[p]}
                  </span>
                ))}
              </div>

              {/* Objectives */}
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

              {/* Progress & KPIs */}
              {plan.progress > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">تقدم التنفيذ</span>
                    <span className="font-bold text-primary-600">{plan.progress}%</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-l from-primary-500 to-primary-600 transition-all"
                      style={{ width: `${plan.progress}%` }}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {Object.entries(plan.kpis).map(([key, kpi]) => {
                      const progress = (kpi.current / kpi.target) * 100;
                      return (
                        <div key={key} className="rounded-xl bg-slate-50 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              {kpi.current.toLocaleString("ar-SA")} / {kpi.target.toLocaleString("ar-SA")} {kpi.unit}
                            </span>
                            <span className={cn(
                              "text-xs font-bold",
                              progress >= 100 ? "text-emerald-600" : progress >= 70 ? "text-amber-600" : "text-red-600"
                            )}>
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
                            <div
                              className={cn(
                                "h-1.5 rounded-full transition-all",
                                progress >= 100 ? "bg-emerald-500" : progress >= 70 ? "bg-amber-500" : "bg-red-500"
                              )}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
