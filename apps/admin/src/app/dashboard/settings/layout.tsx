"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Building2, Users, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const settingsTabs = [
  { href: "/dashboard/settings", label: "الإعدادات العامة", icon: Settings, exact: true },
  { href: "/dashboard/settings/organization", label: "المنظمة", icon: Building2 },
  { href: "/dashboard/settings/team", label: "الفريق", icon: Users },
  { href: "/dashboard/settings/billing", label: "الاشتراك", icon: CreditCard },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">الإعدادات</h1>
        <p className="mt-1 text-sm text-text-secondary">إدارة حسابك ومنظمتك وفريقك</p>
      </div>

      <div className="flex gap-1 rounded-xl bg-surface-base p-1 border border-border-subtle">
        {settingsTabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-amber-300/15 text-amber-300 shadow-sm"
                  : "text-text-muted hover:text-text-secondary hover:bg-surface-hover"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
