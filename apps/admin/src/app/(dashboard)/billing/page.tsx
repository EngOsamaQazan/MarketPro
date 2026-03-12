"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Receipt,
  Plus,
  Search,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  Loader2,
  RefreshCw,
  Trash2,
  FileText,
  X,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface Invoice {
  id: string;
  company_id: string;
  amount: number;
  month: string;
  description: string | null;
  due_date: string;
  items: InvoiceItem[] | null;
  status: string;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  paid_at: string | null;
  companies?: { name: string; name_en: string | null };
}

interface Company {
  id: string;
  name: string;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  draft: {
    label: "مسودة",
    color: "bg-slate-100 text-slate-700",
    icon: FileText,
  },
  sent: {
    label: "مُرسلة",
    color: "bg-blue-100 text-blue-700",
    icon: Send,
  },
  paid: {
    label: "مدفوعة",
    color: "bg-emerald-100 text-emerald-700",
    icon: CheckCircle2,
  },
  overdue: {
    label: "متأخرة",
    color: "bg-red-100 text-red-700",
    icon: AlertTriangle,
  },
  cancelled: {
    label: "ملغاة",
    color: "bg-gray-100 text-gray-500",
    icon: X,
  },
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const [newInvoice, setNewInvoice] = useState({
    company_id: "",
    month: new Date().toISOString().slice(0, 7),
    due_date: "",
    description: "",
    items: [{ description: "", quantity: 1, unit_price: 0 }] as InvoiceItem[],
  });

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/billing");
      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices);
      }
    } catch {
      toast({
        title: "خطأ",
        description: "فشل تحميل الفواتير",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (data.success) {
        setCompanies(
          data.clients.map((c: any) => ({ id: c.id, name: c.name }))
        );
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchCompanies();
  }, [fetchInvoices, fetchCompanies]);

  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.amount, 0);

  const pendingPayments = invoices
    .filter((i) => i.status === "sent")
    .reduce((sum, i) => sum + i.amount, 0);

  const overdueAmount = invoices
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + i.amount, 0);

  const draftAmount = invoices
    .filter((i) => i.status === "draft")
    .reduce((sum, i) => sum + i.amount, 0);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      !search ||
      inv.companies?.name?.includes(search) ||
      inv.month.includes(search) ||
      inv.description?.includes(search);
    const matchesStatus =
      statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function addLineItem() {
    setNewInvoice((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, unit_price: 0 }],
    }));
  }

  function removeLineItem(index: number) {
    setNewInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  function updateLineItem(
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) {
    setNewInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  const calculatedTotal = newInvoice.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  async function handleCreate() {
    if (!newInvoice.company_id || !newInvoice.month || !newInvoice.due_date) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const validItems = newInvoice.items.filter(
      (item) => item.description && item.unit_price > 0
    );

    if (validItems.length === 0) {
      toast({
        title: "خطأ",
        description: "أضف بنداً واحداً على الأقل بوصف وسعر",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: newInvoice.company_id,
          amount: calculatedTotal,
          month: newInvoice.month,
          due_date: newInvoice.due_date,
          description: newInvoice.description,
          items: validItems,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: "تم", description: "تم إنشاء الفاتورة بنجاح" });
        setShowCreateDialog(false);
        setNewInvoice({
          company_id: "",
          month: new Date().toISOString().slice(0, 7),
          due_date: "",
          description: "",
          items: [{ description: "", quantity: 1, unit_price: 0 }],
        });
        fetchInvoices();
      } else {
        toast({
          title: "خطأ",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "خطأ",
        description: "فشل إنشاء الفاتورة",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(invoiceId: string, status: string) {
    try {
      setActionLoading(invoiceId);
      const res = await fetch("/api/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invoiceId, status }),
      });

      const data = await res.json();
      if (data.success) {
        const statusLabel =
          statusConfig[status]?.label || status;
        toast({
          title: "تم التحديث",
          description: `تم تغيير حالة الفاتورة إلى "${statusLabel}"`,
        });
        fetchInvoices();
      } else {
        toast({
          title: "خطأ",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "خطأ",
        description: "فشل تحديث الفاتورة",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  }

  const stats = [
    {
      label: "إجمالي الإيرادات",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "مدفوعات معلقة",
      value: formatCurrency(pendingPayments),
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "مبالغ متأخرة",
      value: formatCurrency(overdueAmount),
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "مسودات",
      value: formatCurrency(draftAmount),
      icon: FileText,
      color: "text-slate-600",
      bg: "bg-slate-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <Receipt className="h-7 w-7 text-primary-600" />
            الفوترة والمدفوعات
          </h1>
          <p className="text-slate-500 mt-1">إدارة الفواتير والمدفوعات للعملاء</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchInvoices}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 ml-2" />
            فاتورة جديدة
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={cn("p-3 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="بحث في الفواتير..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">الكل</TabsTrigger>
            <TabsTrigger value="draft">مسودة</TabsTrigger>
            <TabsTrigger value="sent">مُرسلة</TabsTrigger>
            <TabsTrigger value="paid">مدفوعة</TabsTrigger>
            <TabsTrigger value="overdue">متأخرة</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Invoices List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600">
              لا توجد فواتير
            </h3>
            <p className="text-slate-400 mt-1">
              ابدأ بإنشاء فاتورة جديدة
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => {
            const config = statusConfig[invoice.status] || statusConfig.draft;
            const StatusIcon = config.icon;
            const isActionLoading = actionLoading === invoice.id;

            return (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={cn(
                          "p-2.5 rounded-xl",
                          config.color.includes("emerald")
                            ? "bg-emerald-50"
                            : config.color.includes("blue")
                              ? "bg-blue-50"
                              : config.color.includes("red")
                                ? "bg-red-50"
                                : "bg-slate-50"
                        )}
                      >
                        <StatusIcon
                          className={cn(
                            "h-5 w-5",
                            config.color.split(" ")[1]
                          )}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-slate-900">
                            {invoice.companies?.name || "—"}
                          </h3>
                          <Badge
                            variant="secondary"
                            className={cn("text-xs", config.color)}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                          <span>شهر: {invoice.month}</span>
                          <span>•</span>
                          <span>
                            الاستحقاق: {formatDate(invoice.due_date)}
                          </span>
                          {invoice.description && (
                            <>
                              <span>•</span>
                              <span>{invoice.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <p className="text-lg font-bold text-slate-900">
                          {formatCurrency(invoice.amount)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDate(invoice.created_at)}
                        </p>
                      </div>
                      <Separator orientation="vertical" className="h-10" />
                      <div className="flex items-center gap-2">
                        {invoice.status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(invoice.id, "sent")}
                            disabled={isActionLoading}
                          >
                            {isActionLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="h-3.5 w-3.5 ml-1.5" />
                                إرسال
                              </>
                            )}
                          </Button>
                        )}
                        {invoice.status === "sent" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => updateStatus(invoice.id, "paid")}
                            disabled={isActionLoading}
                          >
                            {isActionLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 ml-1.5" />
                                تم الدفع
                              </>
                            )}
                          </Button>
                        )}
                        {(invoice.status === "sent" ||
                          invoice.status === "draft") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() =>
                              updateStatus(invoice.id, "cancelled")
                            }
                            disabled={isActionLoading}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Line items preview */}
                  {invoice.items &&
                    Array.isArray(invoice.items) &&
                    invoice.items.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                          {(invoice.items as InvoiceItem[]).map(
                            (item, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between bg-slate-50 rounded-lg p-2"
                              >
                                <span className="truncate">{item.description}</span>
                                <span className="font-medium text-slate-700 mr-2">
                                  {formatCurrency(
                                    item.quantity * item.unit_price
                                  )}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              إنشاء فاتورة جديدة
            </DialogTitle>
            <DialogDescription>
              أنشئ فاتورة جديدة لأحد العملاء مع تفاصيل البنود
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العميل *</Label>
                <Select
                  value={newInvoice.company_id}
                  onValueChange={(val) =>
                    setNewInvoice((p) => ({ ...p, company_id: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر العميل" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الشهر *</Label>
                <Input
                  type="month"
                  value={newInvoice.month}
                  onChange={(e) =>
                    setNewInvoice((p) => ({ ...p, month: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ الاستحقاق *</Label>
                <Input
                  type="date"
                  value={newInvoice.due_date}
                  onChange={(e) =>
                    setNewInvoice((p) => ({ ...p, due_date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Input
                  value={newInvoice.description}
                  onChange={(e) =>
                    setNewInvoice((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  placeholder="وصف اختياري للفاتورة"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">بنود الفاتورة</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                >
                  <Plus className="h-3.5 w-3.5 ml-1" />
                  إضافة بند
                </Button>
              </div>

              <div className="space-y-2">
                {newInvoice.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_80px_100px_36px] gap-2 items-end"
                  >
                    <div>
                      {idx === 0 && (
                        <Label className="text-xs text-slate-500">الوصف</Label>
                      )}
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(idx, "description", e.target.value)
                        }
                        placeholder="وصف البند"
                      />
                    </div>
                    <div>
                      {idx === 0 && (
                        <Label className="text-xs text-slate-500">الكمية</Label>
                      )}
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(
                            idx,
                            "quantity",
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </div>
                    <div>
                      {idx === 0 && (
                        <Label className="text-xs text-slate-500">
                          السعر ($)
                        </Label>
                      )}
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unit_price}
                        onChange={(e) =>
                          updateLineItem(
                            idx,
                            "unit_price",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(idx)}
                      disabled={newInvoice.items.length === 1}
                      className="text-red-400 hover:text-red-600 p-0 h-9"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <span className="text-sm font-medium text-slate-600">
                  الإجمالي
                </span>
                <span className="text-xl font-bold text-slate-900">
                  {formatCurrency(calculatedTotal)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 ml-2" />
                  إنشاء الفاتورة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
