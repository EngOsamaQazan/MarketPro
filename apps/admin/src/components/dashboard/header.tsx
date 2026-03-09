"use client";

import { Bell, Search, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "مدير النظام",
  admin: "مدير",
  manager: "مدير حسابات",
  client: "عميل",
};

export function Header() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, username, role")
        .eq("id", authUser.id)
        .single();

      if (profile) {
        setUser({
          name: profile.full_name || profile.username || authUser.email?.split("@")[0] || "مستخدم",
          role: profile.role,
        });
      }
    }
    loadUser();
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-100 bg-white/80 px-8 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث عن عميل، حملة، محتوى..."
            className="w-80 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pe-4 ps-10 text-sm text-slate-600 placeholder:text-slate-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-primary">
          <Plus className="h-4 w-4" />
          إضافة عميل
        </button>

        <button className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700">
          <Bell className="h-5 w-5" />
          <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || "M"}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{user?.name || "..."}</p>
            <p className="text-[11px] text-slate-400">{user ? ROLE_LABELS[user.role] || user.role : "..."}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
