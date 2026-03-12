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

const mainNav = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "العملاء", icon: Users },
  { href: "/dashboard/plans", label: "خطط التسويق", icon: FileText },
  { href: "/dashboard/content", label: "المحتوى", icon: CalendarDays },
  { href: "/dashboard/campaigns", label: "الحملات الإعلانية", icon: Megaphone },
];

const insightsNav = [
  { href: "/dashboard/reports", label: "التقارير", icon: BarChart3 },
  { href: "/dashboard/analytics", label: "التحليلات", icon: TrendingUp },
  { href: "/dashboard/automation", label: "الأتمتة", icon: Bot },
];

const systemNav = [
  { href: "/dashboard/billing", label: "الفوترة", icon: Receipt },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Settings },
];

function NavSection({
  items,
  label,
  pathname,
  collapsed,
}: {
  items: typeof mainNav;
  label?: string;
  pathname: string;
  collapsed: boolean;
}) {
  return (
    <div className="space-y-1">
      {label && !collapsed && (
        <p className="mb-2 px-4 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </p>
      )}
      {collapsed && label && <div className="mx-auto my-2 h-px w-8 bg-border-subtle" />}
      {items.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "sidebar-link group relative",
              isActive && "active",
              collapsed && "justify-center px-3"
            )}
            title={collapsed ? item.label : undefined}
          >
            {isActive && (
              <span className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-s-full bg-amber-300" />
            )}
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </div>
  );
}

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
        "fixed right-0 top-0 z-40 flex h-screen flex-col border-l border-border-subtle bg-surface-base transition-all duration-300",
        collapsed ? "w-20" : "w-72"
      )}
    >
      <div className="flex h-20 items-center justify-between border-b border-border-subtle px-6">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-amber glow-amber-sm">
              <Sparkles className="h-5 w-5 text-text-inverse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">سطوة</h1>
              <p className="text-[11px] text-text-muted">مركز قيادة التسويق</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl gradient-amber glow-amber-sm">
            <Sparkles className="h-5 w-5 text-text-inverse" />
          </div>
        )}
        <button
          onClick={toggle}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-secondary"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <NavSection items={mainNav} pathname={pathname} collapsed={collapsed} />
        <NavSection items={insightsNav} label="التحليلات والتقارير" pathname={pathname} collapsed={collapsed} />
        <NavSection items={systemNav} label="النظام" pathname={pathname} collapsed={collapsed} />
      </nav>

      <div className="border-t border-border-subtle p-3">
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-error-400 transition-colors hover:bg-error-400/10",
            collapsed && "justify-center px-3"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}
