"use client";

import { useEffect, useState, useCallback } from "react";
import { Building2, Save, Loader2, Globe, Type } from "lucide-react";
import { useOrg } from "@/components/providers/org-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

export default function OrganizationSettingsPage() {
  const { org, refreshOrg, canManage } = useOrg();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    name_en: "",
    slug: "",
    website: "",
    type: "agency" as "agency" | "brand",
  });

  useEffect(() => {
    if (org) {
      setForm({
        name: org.name || "",
        name_en: org.name_en || "",
        slug: org.slug || "",
        website: org.website || "",
        type: org.type || "agency",
      });
    }
  }, [org]);

  const handleSave = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          name_en: form.name_en || null,
          website: form.website || null,
          type: form.type,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      await refreshOrg();
      toast({ title: "تم الحفظ", description: "تم تحديث بيانات المنظمة بنجاح" });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [form, refreshOrg, toast]);

  return (
    <div className="space-y-6">
      <Card className="border-border-subtle bg-surface-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-text-primary">
            <Building2 className="h-5 w-5 text-amber-300" />
            معلومات المنظمة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-text-secondary">اسم المنظمة (عربي)</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1.5 bg-surface-base border-border-default"
                disabled={!canManage}
              />
            </div>
            <div>
              <Label className="text-text-secondary">اسم المنظمة (إنجليزي)</Label>
              <Input
                value={form.name_en}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                className="mt-1.5 bg-surface-base border-border-default"
                dir="ltr"
                disabled={!canManage}
              />
            </div>
          </div>

          <div>
            <Label className="text-text-secondary">المعرّف (Slug)</Label>
            <Input
              value={form.slug}
              className="mt-1.5 bg-surface-inset border-border-subtle text-text-muted"
              dir="ltr"
              disabled
            />
            <p className="mt-1 text-xs text-text-muted">لا يمكن تغيير المعرّف</p>
          </div>

          <div>
            <Label className="text-text-secondary">الموقع الإلكتروني</Label>
            <div className="relative mt-1.5">
              <Globe className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://example.com"
                className="bg-surface-base border-border-default pr-10"
                dir="ltr"
                disabled={!canManage}
              />
            </div>
          </div>

          <div>
            <Label className="text-text-secondary mb-2 block">نوع المنظمة</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => canManage && setForm({ ...form, type: "agency" })}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                  form.type === "agency"
                    ? "border-amber-400 bg-amber-300/10 text-amber-300"
                    : "border-border-default bg-surface-base text-text-secondary hover:border-border-strong"
                }`}
              >
                وكالة تسويق
              </button>
              <button
                type="button"
                onClick={() => canManage && setForm({ ...form, type: "brand" })}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                  form.type === "brand"
                    ? "border-amber-400 bg-amber-300/10 text-amber-300"
                    : "border-border-default bg-surface-base text-text-secondary hover:border-border-strong"
                }`}
              >
                علامة تجارية
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1">
              <p className="text-xs text-text-muted">
                الباقة الحالية:{" "}
                <Badge variant="outline" className="mr-1 border-amber-400/30 text-amber-300">
                  {org?.plan || "free"}
                </Badge>
              </p>
            </div>
            {canManage && (
              <Button onClick={handleSave} disabled={loading} className="btn-primary">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="mr-1">حفظ التغييرات</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
