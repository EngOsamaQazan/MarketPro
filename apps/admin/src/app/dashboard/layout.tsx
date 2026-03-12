"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { SidebarProvider, useSidebar } from "@/components/dashboard/sidebar-context";
import { OrgProvider } from "@/components/providers/org-context";
import { ClientProvider } from "@/components/providers/client-context";
import { cn } from "@/lib/utils";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <main
      className={cn(
        "transition-all duration-300",
        collapsed ? "mr-20" : "mr-72"
      )}
    >
      <Header />
      <div className="p-8">{children}</div>
    </main>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrgProvider>
      <ClientProvider>
        <SidebarProvider>
          <div className="min-h-screen bg-surface-void">
            <Sidebar />
            <DashboardContent>{children}</DashboardContent>
          </div>
        </SidebarProvider>
      </ClientProvider>
    </OrgProvider>
  );
}
