"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  Plus,
  Loader2,
  Trash2,
  Crown,
  Shield,
  UserCheck,
  Eye,
  Mail,
} from "lucide-react";
import { useOrg } from "@/components/providers/org-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface Member {
  id: string;
  user_id: string;
  role: string;
  invited_at: string | null;
  accepted_at: string | null;
  profiles: {
    full_name: string;
    email: string;
    avatar_url: string | null;
    phone: string | null;
  };
}

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  owner: { label: "مالك", icon: Crown, color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  admin: { label: "مدير", icon: Shield, color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  manager: { label: "مشرف", icon: UserCheck, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
  viewer: { label: "مشاهد", icon: Eye, color: "text-slate-400 bg-slate-400/10 border-slate-400/30" },
};

export default function TeamSettingsPage() {
  const { canManage } = useOrg();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/organizations/members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    try {
      const res = await fetch("/api/organizations/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "تم", description: data.message });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("viewer");
      fetchMembers();
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (memberId: string, role: string) => {
    try {
      const res = await fetch("/api/organizations/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "تم تحديث الدور" });
      fetchMembers();
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("هل تريد حذف هذا العضو من المنظمة؟")) return;
    try {
      const res = await fetch(`/api/organizations/members?id=${memberId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "تم حذف العضو" });
      fetchMembers();
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border-subtle bg-surface-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-text-primary">
            <Users className="h-5 w-5 text-amber-300" />
            أعضاء الفريق
            <Badge variant="outline" className="mr-2 border-border-default text-text-muted">
              {members.length}
            </Badge>
          </CardTitle>
          {canManage && (
            <Button onClick={() => setInviteOpen(true)} className="btn-primary" size="sm">
              <Plus className="h-4 w-4" />
              دعوة عضو
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
            </div>
          ) : members.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-muted">لا يوجد أعضاء</p>
          ) : (
            <div className="divide-y divide-border-subtle">
              {members.map((member) => {
                const role = roleConfig[member.role] || roleConfig.viewer;
                const RoleIcon = role.icon;
                return (
                  <div key={member.id} className="flex items-center gap-4 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-elevated text-sm font-bold text-text-secondary">
                      {member.profiles?.full_name?.[0] || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {member.profiles?.full_name || "—"}
                      </p>
                      <p className="text-xs text-text-muted truncate">{member.profiles?.email}</p>
                    </div>
                    <Badge variant="outline" className={`${role.color} gap-1`}>
                      <RoleIcon className="h-3 w-3" />
                      {role.label}
                    </Badge>
                    {canManage && member.role !== "owner" && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(val) => handleChangeRole(member.id, val)}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs bg-surface-base border-border-default">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">مدير</SelectItem>
                            <SelectItem value="manager">مشرف</SelectItem>
                            <SelectItem value="viewer">مشاهد</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(member.id)}
                          className="h-8 w-8 p-0 text-error-400 hover:bg-error-400/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="bg-surface-card border-border-subtle">
          <DialogHeader>
            <DialogTitle className="text-text-primary">دعوة عضو جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-text-secondary">البريد الإلكتروني</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member@example.com"
                  className="bg-surface-base border-border-default pr-10"
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <Label className="text-text-secondary">الدور</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1.5 bg-surface-base border-border-default">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مدير — صلاحيات كاملة</SelectItem>
                  <SelectItem value="manager">مشرف — إدارة المحتوى والعملاء</SelectItem>
                  <SelectItem value="viewer">مشاهد — قراءة فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)} className="text-text-secondary">
              إلغاء
            </Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail} className="btn-primary">
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال الدعوة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
