"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarDays,
  Megaphone,
  BarChart3,
  TrendingUp,
  Settings,
  Sparkles,
  LogOut,
  ChevronLeft,
  Receipt,
  Bot,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";

const navItems = [
  { href: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/clients", label: "العملاء", icon: Users },
  { href: "/plans", label: "خطط التسويق", icon: FileText },
  { href: "/content", label: "المحتوى", icon: CalendarDays },
  { href: "/campaigns", label: "الحملات الإعلانية", icon: Megaphone },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
  { href: "/analytics", label: "التحليلات", icon: TrendingUp },
  { href: "/automation", label: "الأتمتة", icon: Bot },
  { href: "/billing", label: "الفوترة", icon: Receipt },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed, toggle } = useSidebar();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 z-40 flex h-screen flex-col border-l border-slate-200 bg-white transition-all duration-300",
        collapsed ? "w-20" : "w-72"
      )}
    >
      <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 shadow-lg shadow-primary-600/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">سطوة</h1>
              <p className="text-[11px] text-slate-400">ذكاء اصطناعي يدير تسويقك</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
        )}
        <button
          onClick={toggle}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sidebar-link", isActive && "active")}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}
