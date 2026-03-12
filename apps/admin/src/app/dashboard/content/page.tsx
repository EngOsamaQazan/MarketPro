"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Plus,
  Sparkles,
  Image,
  Video,
  FileImage,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Loader2,
  WifiOff,
  RefreshCw,
  ExternalLink,
  Clock,
  Send,
} from "lucide-react";
import { cn, formatNumber, formatDate } from "@/lib/utils";
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
import { useClient } from "@/components/providers/client-context";

interface Post {
  id: string;
  pageId: string;
  pageName: string;
  platform: "facebook" | "instagram";
  message: string;
  image?: string;
  mediaType?: string;
  url?: string;
  createdAt: string;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    impressions?: number;
    engagement?: number;
    reach?: number;
    clicks?: number;
    reactions?: number;
  };
}

interface ScheduledItem {
  id: string;
  company_id: string;
  companies?: { name: string };
  platform: string;
  content_type: string;
  text_content: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  approval_status: string;
  hashtags: string[];
  ai_generated: boolean;
}

interface PostSummary {
  total: number;
  facebook: number;
  instagram: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalImpressions: number;
}

interface Company {
  id: string;
  name: string;
}

const platformEmoji: Record<string, string> = {
  facebook: "📘", instagram: "📸", tiktok: "🎵",
  snapchat: "👻", x: "𝕏", linkedin: "💼", youtube: "▶️",
};

export default function ContentPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [summary, setSummary] = useState<PostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState<"all" | "published" | "scheduled">("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const { selectedClientId, clients } = useClient();

  const [form, setForm] = useState({
    company_id: "",
    platform: "facebook",
    content_type: "post",
    text_content: "",
    scheduled_date: new Date().toISOString().split("T")[0],
    scheduled_time: "12:00",
    hashtags: "",
  });

  const [aiForm, setAiForm] = useState({
    company_id: "",
    platform: "facebook",
    contentType: "post",
    topic: "",
    tone: "professional",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const contentUrl = selectedClientId
        ? `/api/content?company_id=${selectedClientId}`
        : "/api/content";

      const [metaRes, contentRes, clientsRes] = await Promise.all([
        fetch("/api/meta/posts").then((r) => r.json()).catch(() => ({ connected: false })),
        fetch(contentUrl).then((r) => r.json()).catch(() => ({ content: [] })),
        fetch("/api/clients").then((r) => r.json()).catch(() => ({ clients: [] })),
      ]);

      setConnected(metaRes.connected || false);
      setPosts(metaRes.posts || []);
      setSummary(metaRes.summary || null);
      setScheduled(contentRes.content || []);
      setCompanies(clientsRes.clients || []);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedClientId]);

  const createContent = async () => {
    if (!form.company_id || !form.text_content) return;
    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          hashtags: form.hashtags.split(" ").filter(Boolean),
          status: "scheduled",
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowModal(false);
      setForm({ company_id: "", platform: "facebook", content_type: "post", text_content: "", scheduled_date: new Date().toISOString().split("T")[0], scheduled_time: "12:00", hashtags: "" });
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "خطأ", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const generateWithAi = async () => {
    const company = companies.find((c) => c.id === aiForm.company_id);
    if (!company || !aiForm.topic) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: company.name,
          platform: aiForm.platform,
          contentType: aiForm.contentType,
          topic: aiForm.topic,
          tone: aiForm.tone,
          language: "ar",
          includeHashtags: true,
          includeCTA: true,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const content = data.content;
      setForm({
        company_id: aiForm.company_id,
        platform: aiForm.platform,
        content_type: aiForm.contentType,
        text_content: content.text || content.caption || content.post || "",
        scheduled_date: new Date().toISOString().split("T")[0],
        scheduled_time: "12:00",
        hashtags: (content.hashtags || []).join(" "),
      });
      setShowAiModal(false);
      setShowModal(true);
    } catch (e: any) {
      toast({ variant: "destructive", title: "خطأ", description: e.message });
    } finally {
      setGenerating(false);
    }
  };

  const filteredPosts = posts.filter((p) => platformFilter === "all" || p.platform === platformFilter);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-11 w-24" />
            <Skeleton className="h-11 w-36" />
            <Skeleton className="h-11 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">إدارة المحتوى</h1>
          <p className="mt-1 text-text-muted">
            {(summary?.total || 0) + scheduled.length} عنصر •
            {summary ? ` FB: ${summary.facebook} • IG: ${summary.instagram}` : ""} •
            {scheduled.length} مجدول
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          <Button variant="outline" onClick={() => setShowAiModal(true)}>
            <Sparkles className="h-4 w-4" />
            توليد محتوى AI
          </Button>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            إضافة منشور
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Heart className="mx-auto h-5 w-5 text-red-400" />
              <p className="mt-2 text-2xl font-bold text-text-primary">{formatNumber(summary.totalLikes)}</p>
              <p className="text-xs text-text-muted">إعجاب</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <MessageCircle className="mx-auto h-5 w-5 text-blue-400" />
              <p className="mt-2 text-2xl font-bold text-text-primary">{formatNumber(summary.totalComments)}</p>
              <p className="text-xs text-text-muted">تعليق</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Share2 className="mx-auto h-5 w-5 text-emerald-400" />
              <p className="mt-2 text-2xl font-bold text-text-primary">{formatNumber(summary.totalShares)}</p>
              <p className="text-xs text-text-muted">مشاركة</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Eye className="mx-auto h-5 w-5 text-purple-400" />
              <p className="mt-2 text-2xl font-bold text-text-primary">{formatNumber(summary.totalImpressions)}</p>
              <p className="text-xs text-text-muted">ظهور</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex gap-2">
        {[
          { key: "all" as const, label: "الكل" },
          { key: "published" as const, label: "المنشور" },
          { key: "scheduled" as const, label: "المجدول" },
        ].map((t) => (
          <Button
            key={t.key}
            variant={filter === t.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Scheduled Content */}
      {(filter === "all" || filter === "scheduled") && scheduled.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-text-primary">
            <Clock className="inline h-5 w-5 ml-2 text-blue-500" />
            المحتوى المجدول ({scheduled.length})
          </h2>
          {scheduled.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex items-start gap-4">
                <span className="text-2xl">{platformEmoji[item.platform] || "📱"}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-text-secondary">
                      {item.companies?.name || ""}
                    </span>
                    <span className="text-text-muted">•</span>
                    <span className="text-text-muted">
                      {item.scheduled_date} {item.scheduled_time}
                    </span>
                    {item.ai_generated && (
                      <Badge variant="purple" className="text-[10px] px-1.5 py-0.5">AI</Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-2">
                    {item.text_content}
                  </p>
                  {item.hashtags?.length > 0 && (
                    <p className="mt-1 text-xs text-blue-500">{item.hashtags.join(" ")}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant={
                      item.status === "scheduled" ? "info" :
                      item.approval_status === "pending" ? "warning" :
                      item.status === "published" ? "success" :
                      "secondary"
                    }
                    className="rounded-full"
                  >
                    {item.status === "scheduled" ? "مجدول" : item.status === "draft" ? "مسودة" : "منشور"}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Published Posts */}
      {(filter === "all" || filter === "published") && (
        <>
          {!connected && posts.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 p-12 text-center">
              <WifiOff className="h-10 w-10 text-text-muted" />
              <h3 className="text-lg font-bold text-text-secondary">لا توجد منصات متصلة</h3>
              <p className="text-sm text-text-muted">لعرض المنشورات المنشورة، اربط المنصات من الإعدادات</p>
            </Card>
          ) : filteredPosts.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-text-primary">
                <Send className="inline h-5 w-5 ml-2 text-emerald-500" />
                المنشور ({filteredPosts.length})
              </h2>
              {filteredPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <div className="flex">
                    <div className="flex w-16 flex-col items-center justify-center border-l border-border-subtle bg-surface-hover p-4 text-center">
                      <span className="text-2xl">{platformEmoji[post.platform]}</span>
                      {post.mediaType && (
                        post.mediaType === "video" ? <Video className="mt-2 h-4 w-4 text-text-muted" /> :
                        post.mediaType === "carousel_album" ? <FileImage className="mt-2 h-4 w-4 text-text-muted" /> :
                        <Image className="mt-2 h-4 w-4 text-text-muted" />
                      )}
                    </div>
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-text-secondary">{post.pageName}</span>
                            <span className="text-xs text-text-muted">
                              {new Date(post.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-text-secondary leading-relaxed line-clamp-3">
                            {post.message || "(بدون نص)"}
                          </p>
                        </div>
                        {post.image && (
                          <img src={post.image} alt="" className="mr-4 h-20 w-20 rounded-lg object-cover" />
                        )}
                      </div>
                      <div className="mt-4 flex items-center gap-4 border-t border-border-subtle pt-4">
                        <span className="flex items-center gap-1.5 text-sm text-text-muted">
                          <Heart className="h-3.5 w-3.5 text-red-400" />{formatNumber(post.metrics.likes)}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-text-muted">
                          <MessageCircle className="h-3.5 w-3.5 text-blue-400" />{formatNumber(post.metrics.comments)}
                        </span>
                        {post.metrics.shares > 0 && (
                          <span className="flex items-center gap-1.5 text-sm text-text-muted">
                            <Share2 className="h-3.5 w-3.5 text-emerald-400" />{formatNumber(post.metrics.shares)}
                          </span>
                        )}
                        {post.url && (
                          <a href={post.url} target="_blank" rel="noopener noreferrer" className="mr-auto flex items-center gap-1 text-xs text-amber-300 hover:underline">
                            <ExternalLink className="h-3 w-3" />عرض
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Content Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة منشور</DialogTitle>
            <DialogDescription>أنشئ منشوراً جديداً وحدد موعد النشر</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>العميل</Label>
              <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>المنصة</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(platformEmoji).map(([k, e]) => (
                      <SelectItem key={k} value={k}>{e} {k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>النوع</Label>
                <Select value={form.content_type} onValueChange={(v) => setForm({ ...form, content_type: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post">منشور</SelectItem>
                    <SelectItem value="story">ستوري</SelectItem>
                    <SelectItem value="reel">ريلز</SelectItem>
                    <SelectItem value="video">فيديو</SelectItem>
                    <SelectItem value="carousel">كاروسيل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>المحتوى</Label>
              <Textarea
                value={form.text_content}
                onChange={(e) => setForm({ ...form, text_content: e.target.value })}
                rows={4}
                className="mt-1 resize-none"
                placeholder="اكتب محتوى المنشور..."
                autoComplete="off"
              />
            </div>
            <div>
              <Label>هاشتاغات</Label>
              <Input
                type="text"
                value={form.hashtags}
                onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
                className="mt-1"
                placeholder="#تسويق #محتوى"
                dir="ltr"
                autoComplete="off"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>تاريخ النشر</Label>
                <Input
                  type="date"
                  value={form.scheduled_date}
                  onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>وقت النشر</Label>
                <Input
                  type="time"
                  value={form.scheduled_time}
                  onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>إلغاء</Button>
            <Button onClick={createContent} disabled={saving || !form.company_id || !form.text_content}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" />جاري الحفظ...</> : "جدولة المنشور"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Content Modal */}
      <Dialog open={showAiModal} onOpenChange={setShowAiModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Sparkles className="inline h-5 w-5 text-amber-300 ml-2" />
              توليد محتوى بالذكاء الاصطناعي
            </DialogTitle>
            <DialogDescription>استخدم الذكاء الاصطناعي لتوليد محتوى جاهز للنشر</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>العميل</Label>
              <Select value={aiForm.company_id} onValueChange={(v) => setAiForm({ ...aiForm, company_id: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>المنصة</Label>
                <Select value={aiForm.platform} onValueChange={(v) => setAiForm({ ...aiForm, platform: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(platformEmoji).map(([k, e]) => (
                      <SelectItem key={k} value={k}>{e} {k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>النغمة</Label>
                <Select value={aiForm.tone} onValueChange={(v) => setAiForm({ ...aiForm, tone: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">احترافي</SelectItem>
                    <SelectItem value="casual">عفوي</SelectItem>
                    <SelectItem value="humorous">فكاهي</SelectItem>
                    <SelectItem value="inspirational">ملهم</SelectItem>
                    <SelectItem value="educational">تعليمي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>الموضوع</Label>
              <Input
                type="text"
                value={aiForm.topic}
                onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                className="mt-1"
                placeholder="مثال: عرض خاص على منتجات الصيف"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAiModal(false)}>إلغاء</Button>
            <Button onClick={generateWithAi} disabled={generating || !aiForm.company_id || !aiForm.topic}>
              {generating ? <><Loader2 className="h-4 w-4 animate-spin" />جاري التوليد...</> : <><Sparkles className="h-4 w-4" />توليد</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
