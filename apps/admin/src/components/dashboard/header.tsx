"use client";

import { Bell, Search, Plus, X, Loader2, Check, Building2, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { cn, getStatusLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useClient } from "@/components/providers/client-context";
import { useOrg } from "@/components/providers/org-context";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "مدير النظام",
  admin: "مدير",
  manager: "مدير حسابات",
  client: "عميل",
};

const TYPE_ICONS: Record<string, string> = {
  plan_ready: "📋",
  report_ready: "📊",
  approval_needed: "✅",
  alert: "⚠️",
  message: "💬",
};

type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "purple"
  | "outline";

const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  active: "success",
  approved: "success",
  completed: "success",
  published: "success",
  ready: "success",
  paused: "warning",
  ended: "destructive",
  failed: "destructive",
  draft: "secondary",
  pending_approval: "info",
  scheduled: "info",
  sent: "info",
  in_progress: "default",
  generating: "purple",
};

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  status: string;
  url: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const { clients, selectedClient, selectedClientId, setSelectedClientId } = useClient();
  const { org } = useOrg();

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
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread || 0);
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all_read: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }

    setSearching(true);
    setShowSearch(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const onSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => handleSearch(value), 300);
  };

  const onResultClick = (result: SearchResult) => {
    setShowSearch(false);
    setSearchQuery("");
    router.push(result.url);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border-subtle bg-surface-base/80 px-8 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <Popover open={showClientSelector} onOpenChange={setShowClientSelector}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 min-w-[180px] justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-text-muted" />
                <span className="truncate max-w-[140px]">
                  {selectedClient?.name || "كل العملاء"}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-text-muted" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <div className="p-3 border-b border-border-subtle">
              <p className="text-xs font-medium text-text-muted mb-1">
                {org?.name || "المنظمة"}
              </p>
              <p className="text-sm font-semibold text-text-primary">اختر عميلاً</p>
            </div>
            <ScrollArea className="max-h-64">
              <button
                onClick={() => {
                  setSelectedClientId(null);
                  setShowClientSelector(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-right hover:bg-surface-hover transition-colors",
                  !selectedClientId && "bg-amber-300/10 text-amber-300"
                )}
              >
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium">كل العملاء</span>
              </button>
              <Separator />
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    setSelectedClientId(client.id);
                    setShowClientSelector(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-right hover:bg-surface-hover transition-colors",
                    selectedClientId === client.id && "bg-amber-300/10 text-amber-300"
                  )}
                >
                  {client.logo_url ? (
                    <img src={client.logo_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-elevated text-[10px] font-bold text-text-secondary">
                      {client.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{client.name}</p>
                    <p className="text-[10px] text-text-muted">{client.industry}</p>
                  </div>
                  <Badge variant={STATUS_BADGE_VARIANT[client.status] || "secondary"} className="text-[10px]">
                    {getStatusLabel(client.status)}
                  </Badge>
                </button>
              ))}
              {clients.length === 0 && (
                <p className="py-6 text-center text-sm text-text-muted">لا يوجد عملاء</p>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <div className="relative" ref={searchRef}>
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            type="search"
            placeholder="بحث عن عميل، حملة، محتوى..."
            value={searchQuery}
            onChange={(e) => onSearchInput(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
            className="w-72 pe-4 ps-10"
            autoComplete="off"
          />

          {showSearch && (
            <div className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border-default bg-surface-card shadow-xl z-50">
              {searching ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-amber-300" />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => onResultClick(result)}
                    className="flex w-full items-center gap-3 border-b border-border-subtle px-4 py-3 text-right hover:bg-surface-hover transition-colors"
                  >
                    <span className="text-lg">
                      {result.type === "client" ? "🏢" : result.type === "plan" ? "📋" : result.type === "campaign" ? "📣" : "📝"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{result.title}</p>
                      <p className="text-xs text-text-muted truncate">{result.subtitle}</p>
                    </div>
                    {result.status && (
                      <Badge variant={STATUS_BADGE_VARIANT[result.status] || "secondary"}>
                        {getStatusLabel(result.status)}
                      </Badge>
                    )}
                  </button>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-text-muted">لا توجد نتائج</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={() => router.push("/dashboard/clients")}>
          <Plus className="h-4 w-4" />
          إضافة عميل
        </Button>

        <Popover
          open={showNotifications}
          onOpenChange={(open) => {
            setShowNotifications(open);
            if (open) fetchNotifications();
          }}
        >
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="start">
            <div className="flex items-center justify-between px-4 py-3">
              <h3 className="font-bold text-text-primary">الإشعارات</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-amber-300 hover:underline flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  قراءة الكل
                </button>
              )}
            </div>
            <Separator />
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-text-muted">لا توجد إشعارات</p>
            ) : (
              <ScrollArea className="max-h-80">
                {notifications.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (n.action_url) router.push(n.action_url);
                      setShowNotifications(false);
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-border-subtle px-4 py-3 text-right hover:bg-surface-hover transition-colors",
                      !n.is_read && "bg-amber-300/5"
                    )}
                  >
                    <span className="mt-0.5 text-lg">{TYPE_ICONS[n.type] || "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm truncate", !n.is_read ? "font-bold text-text-primary" : "font-medium text-text-secondary")}>
                        {n.title}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-text-muted mt-1">
                        {new Date(n.created_at).toLocaleDateString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {!n.is_read && <div className="mt-2 h-2 w-2 rounded-full bg-amber-300 flex-shrink-0" />}
                  </button>
                ))}
              </ScrollArea>
            )}
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-3 rounded-xl border border-border-default px-3 py-2 hover:bg-surface-hover transition-colors cursor-pointer">
              <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-amber text-xs font-bold text-text-inverse">
                {user?.name?.charAt(0)?.toUpperCase() || "M"}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-text-primary">{user?.name || "..."}</p>
                <p className="text-[11px] text-text-muted">{user ? ROLE_LABELS[user.role] || user.role : "..."}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <button
              onClick={() => router.push("/dashboard/settings")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-text-secondary hover:bg-surface-hover transition-colors"
            >
              <Settings className="h-4 w-4 text-text-muted" />
              الإعدادات
            </button>
            <Separator className="my-1" />
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
                router.refresh();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-error-400 hover:bg-error-400/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
