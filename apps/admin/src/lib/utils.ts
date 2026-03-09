import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("ar-SA").format(num);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-amber-100 text-amber-700",
    ended: "bg-red-100 text-red-700",
    draft: "bg-slate-100 text-slate-700",
    pending_approval: "bg-blue-100 text-blue-700",
    approved: "bg-emerald-100 text-emerald-700",
    in_progress: "bg-indigo-100 text-indigo-700",
    completed: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
    published: "bg-emerald-100 text-emerald-700",
    scheduled: "bg-blue-100 text-blue-700",
    generating: "bg-purple-100 text-purple-700",
    ready: "bg-emerald-100 text-emerald-700",
    sent: "bg-blue-100 text-blue-700",
  };
  return colors[status] || "bg-slate-100 text-slate-700";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "نشط",
    paused: "متوقف",
    ended: "منتهي",
    draft: "مسودة",
    pending_approval: "بانتظار الموافقة",
    approved: "معتمد",
    in_progress: "قيد التنفيذ",
    completed: "مكتمل",
    failed: "فشل",
    published: "منشور",
    scheduled: "مجدول",
    generating: "جاري الإنشاء",
    ready: "جاهز",
    sent: "مُرسل",
    pending: "بانتظار",
    rejected: "مرفوض",
  };
  return labels[status] || status;
}
