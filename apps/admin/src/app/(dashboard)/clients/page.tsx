"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Building2,
  Globe,
  DollarSign,
  Calendar,
  Loader2,
  RefreshCw,
  Edit3,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency, getStatusColor, getStatusLabel, formatDate } from "@/lib/utils";
import { INDUSTRIES, COUNTRIES, PACKAGE_TYPES } from "@satwa/shared/src/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface Client {
  id: string;
  name: string;
  name_en?: string;
  industry: string;
  country: string;
  city: string;
  monthly_budget: number;
  package_type: string;
  status: string;
  logo_url?: string;
  website?: string;
  description?: string;
  target_audience?: string;
  contract_start_date: string;
  contract_end_date?: string;
}

const emptyClient: Omit<Client, "id"> = {
  name: "",
  name_en: "",
  industry: "",
  country: "SA",
  city: "",
  monthly_budget: 0,
  package_type: "basic",
  status: "active",
  website: "",
  description: "",
  target_audience: "",
  contract_start_date: new Date().toISOString().split("T")[0],
};

const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  active: "success",
  paused: "warning",
  ended: "destructive",
};

const pkgVariant: Record<string, "warning" | "default" | "secondary"> = {
  enterprise: "warning",
  pro: "default",
  basic: "secondary",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState(emptyClient);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClients(data.clients || []);
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({ ...emptyClient });
    setShowModal(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      name_en: client.name_en || "",
      industry: client.industry,
      country: client.country,
      city: client.city,
      monthly_budget: client.monthly_budget,
      package_type: client.package_type,
      status: client.status,
      website: client.website || "",
      description: client.description || "",
      target_audience: client.target_audience || "",
      contract_start_date: client.contract_start_date,
      contract_end_date: client.contract_end_date,
    });
    setShowModal(true);
  };

  const saveClient = async () => {
    if (!formData.name || !formData.industry || !formData.city) {
      toast({ title: "تنبيه", description: "يرجى ملء الحقول المطلوبة", variant: "warning" });
      return;
    }

    setSaving(true);
    try {
      const method = editingClient ? "PATCH" : "POST";
      const body = editingClient
        ? { id: editingClient.id, ...formData }
        : formData;

      const res = await fetch("/api/clients", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (!editingClient && data.client?.id) {
        fetch("/api/automation/onboard-client", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company_id: data.client.id }),
        }).catch(() => {});
      }

      setShowModal(false);
      setEditingClient(null);
      toast({
        title: "تم بنجاح",
        description: editingClient
          ? "تم تحديث بيانات العميل"
          : "تم إضافة العميل بنجاح - جاري تجهيز الخطة التسويقية تلقائياً...",
        variant: "success",
      });
      fetchClients();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

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
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-11 w-24" />
            <Skeleton className="h-11 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-2xl" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="mt-2 h-4 w-24" />
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة العملاء</h1>
          <p className="mt-1 text-slate-500">
            {clients.length} عميل • {clients.filter((c) => c.status === "active").length} نشط
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchClients}>
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4" />
            إضافة عميل جديد
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="بحث باسم العميل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10"
            autoComplete="off"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "paused", "ended"].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === "all" ? "الكل" : getStatusLabel(status)}
            </Button>
          ))}
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Users className="h-10 w-10 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-600">
            {clients.length === 0 ? "لا يوجد عملاء بعد" : "لا توجد نتائج"}
          </h3>
          <p className="text-sm text-slate-400">
            {clients.length === 0
              ? "ابدأ بإضافة عميل جديد لإدارة حملاته التسويقية"
              : "جرب تغيير معايير البحث"}
          </p>
          {clients.length === 0 && (
            <Button onClick={openAddModal} className="mt-2">
              <Plus className="h-4 w-4" />
              إضافة أول عميل
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {filteredClients.map((client) => {
            const industry = INDUSTRIES.find((i) => i.value === client.industry);
            const country = COUNTRIES.find((c) => c.code === client.country);
            const pkg = PACKAGE_TYPES.find((p) => p.value === client.package_type);

            return (
              <Card
                key={client.id}
                className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <Link href={`/clients/${client.id}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
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
                    </Link>
                    <Badge variant={statusVariant[client.status] || "secondary"}>
                      {getStatusLabel(client.status)}
                    </Badge>
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
                    <Badge variant={pkgVariant[pkg?.value || "basic"] || "secondary"}>
                      {pkg?.label_ar || client.package_type}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); openEditModal(client); }}
                        title="تعديل"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Link href={`/clients/${client.id}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                          تفاصيل وحسابات
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "تعديل عميل" : "إضافة عميل جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingClient ? "قم بتعديل بيانات العميل" : "أضف بيانات العميل الجديد"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>اسم الشركة *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مطعم الفاخر"
                autoComplete="off"
              />
            </div>
            <div>
              <Label>الاسم بالإنجليزية</Label>
              <Input
                value={formData.name_en || ""}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="Al-Fakher Restaurant"
                autoComplete="off"
              />
            </div>
            <div>
              <Label>المجال *</Label>
              <Select
                value={formData.industry}
                onValueChange={(v) => setFormData({ ...formData, industry: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المجال..." />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i.value} value={i.value}>{i.label_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الدولة</Label>
              <Select
                value={formData.country}
                onValueChange={(v) => setFormData({ ...formData, country: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.name_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المدينة *</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="الرياض"
                autoComplete="off"
              />
            </div>
            <div>
              <Label>الموقع الإلكتروني</Label>
              <Input
                type="url"
                value={formData.website || ""}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
                dir="ltr"
                autoComplete="off"
              />
            </div>
            <div>
              <Label>الميزانية الشهرية (USD)</Label>
              <Input
                type="number"
                value={formData.monthly_budget}
                onChange={(e) => setFormData({ ...formData, monthly_budget: Number(e.target.value) })}
                min={0}
                autoComplete="off"
              />
            </div>
            <div>
              <Label>نوع الباقة</Label>
              <Select
                value={formData.package_type}
                onValueChange={(v) => setFormData({ ...formData, package_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PACKAGE_TYPES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>تاريخ بداية العقد</Label>
              <Input
                type="date"
                value={formData.contract_start_date}
                onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })}
              />
            </div>
            <div>
              <Label>تاريخ نهاية العقد</Label>
              <Input
                type="date"
                value={formData.contract_end_date || ""}
                onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value || undefined })}
              />
            </div>
            {editingClient && (
              <div>
                <Label>الحالة</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="paused">متوقف</SelectItem>
                    <SelectItem value="ended">منتهي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="col-span-2">
              <Label>الجمهور المستهدف</Label>
              <Input
                value={formData.target_audience || ""}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                placeholder="شباب 18-35 سنة، مهتمين بالطعام والمطاعم"
                autoComplete="off"
              />
            </div>
            <div className="col-span-2">
              <Label>وصف الشركة</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="نبذة مختصرة عن الشركة ونشاطها..."
                className="resize-none"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              إلغاء
            </Button>
            <Button onClick={saveClient} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                editingClient ? "حفظ التعديلات" : "إضافة العميل"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
