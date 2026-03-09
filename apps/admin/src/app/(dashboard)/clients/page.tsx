"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Building2,
  Globe,
  DollarSign,
  Calendar,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { cn, formatCurrency, getStatusColor, getStatusLabel, formatDate } from "@/lib/utils";
import { INDUSTRIES, COUNTRIES, PACKAGE_TYPES } from "@marketpro/shared/src/constants";
import { createClient } from "@/lib/supabase";

const platformIcons: Record<string, string> = {
  facebook: "📘", instagram: "📸", tiktok: "🎵",
  snapchat: "👻", x: "𝕏", linkedin: "💼", youtube: "▶️",
};

interface Client {
  id: string;
  name: string;
  name_en?: string;
  industry: string;
  country: string;
  city?: string;
  monthly_budget: number;
  package_type: string;
  status: string;
  logo_url?: string;
  contract_start_date?: string;
  platforms: string[];
  followers_total: number;
  active_campaigns: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: dbError } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (dbError) throw dbError;

      const mapped: Client[] = (data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        name_en: c.name_en,
        industry: c.industry || "other",
        country: c.country || "JO",
        city: c.city,
        monthly_budget: c.monthly_budget || 0,
        package_type: c.package_type || "basic",
        status: c.status || "active",
        logo_url: c.logo_url,
        contract_start_date: c.contract_start_date,
        platforms: c.platforms || [],
        followers_total: c.followers_total || 0,
        active_campaigns: c.active_campaigns || 0,
      }));

      setClients(mapped);
    } catch (e: any) {
      setError(e.message);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.includes(searchQuery) ||
      client.name_en?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-sm text-slate-500">جاري تحميل العملاء...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة العملاء</h1>
          <p className="mt-1 text-slate-500">
            {clients.length} عميل • {clients.filter((c) => c.status === "active").length} نشط
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchClients} className="btn-secondary">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </button>
          <button className="btn-secondary">
            <Sparkles className="h-4 w-4" />
            توليد خطة AI
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4" />
            إضافة عميل جديد
          </button>
        </div>
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>خطأ في جلب البيانات: {error}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث باسم العميل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field ps-10"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "paused", "ended"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                statusFilter === status
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              )}
            >
              {status === "all" ? "الكل" : getStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Client Cards */}
      {filteredClients.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <Users className="h-10 w-10 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-600">
            {clients.length === 0 ? "لا يوجد عملاء بعد" : "لا توجد نتائج"}
          </h3>
          <p className="text-sm text-slate-400">
            {clients.length === 0
              ? "ابدأ بإضافة عميل جديد لإدارة حملاته التسويقية"
              : "جرب تغيير معايير البحث"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredClients.map((client) => {
            const industry = INDUSTRIES.find((i) => i.value === client.industry);
            const country = COUNTRIES.find((c) => c.code === client.country);
            const pkg = PACKAGE_TYPES.find((p) => p.value === client.package_type);

            return (
              <div
                key={client.id}
                className="card group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 text-2xl font-bold text-primary-700 overflow-hidden">
                        {client.logo_url ? (
                          <img src={client.logo_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          client.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{client.name}</h3>
                        {client.name_en && (
                          <p className="text-sm text-slate-500">{client.name_en}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        getStatusColor(client.status)
                      )}>
                        {getStatusLabel(client.status)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Building2 className="h-4 w-4" />
                      <span>{industry?.label_ar || client.industry}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Globe className="h-4 w-4" />
                      <span>
                        {country?.name_ar || client.country}
                        {client.city && ` - ${client.city}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatCurrency(client.monthly_budget)}/شهر</span>
                    </div>
                    {client.contract_start_date && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(client.contract_start_date)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
                    <div className="flex gap-1.5">
                      {(client.platforms || []).map((p) => (
                        <span
                          key={p}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-sm"
                          title={p}
                        >
                          {platformIcons[p] || "📊"}
                        </span>
                      ))}
                      {(!client.platforms || client.platforms.length === 0) && (
                        <span className="text-xs text-slate-400">لم يتم تحديد منصات</span>
                      )}
                    </div>
                    <div className="flex items-center gap-5 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-slate-900">
                          {client.followers_total.toLocaleString("ar-SA")}
                        </p>
                        <p className="text-[11px] text-slate-400">متابع</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-900">{client.active_campaigns}</p>
                        <p className="text-[11px] text-slate-400">حملة نشطة</p>
                      </div>
                      <span className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-semibold",
                        pkg?.value === "enterprise"
                          ? "bg-amber-100 text-amber-700"
                          : pkg?.value === "pro"
                          ? "bg-primary-100 text-primary-700"
                          : "bg-slate-100 text-slate-600"
                      )}>
                        {pkg?.label_ar || client.package_type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
