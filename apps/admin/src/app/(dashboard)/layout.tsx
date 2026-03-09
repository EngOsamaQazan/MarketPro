import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="mr-72 transition-all duration-300">
        <Header />
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
