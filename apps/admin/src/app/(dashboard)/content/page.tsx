"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Plus,
  Sparkles,
  Image,
  Video,
  FileImage,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Loader2,
  WifiOff,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { cn, formatNumber, formatDate } from "@/lib/utils";

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

interface PostSummary {
  total: number;
  facebook: number;
  instagram: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalImpressions: number;
}

const platformEmoji: Record<string, string> = {
  facebook: "📘", instagram: "📸", tiktok: "🎵",
  snapchat: "👻", x: "𝕏", linkedin: "💼", youtube: "▶️",
};

export default function ContentPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [summary, setSummary] = useState<PostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState<"all" | "facebook" | "instagram">("all");

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meta/posts");
      const data = await res.json();
      setConnected(data.connected);
      setPosts(data.posts || []);
      setSummary(data.summary || null);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const filteredPosts = filter === "all" ? posts : posts.filter((p) => p.platform === filter);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <p className="text-sm text-slate-500">جاري جلب المنشورات...</p>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <WifiOff className="h-12 w-12 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-700">لا توجد منصات متصلة</h2>
          <p className="max-w-md text-sm text-slate-500">
            لعرض المحتوى، يرجى إضافة مفاتيح API للمنصات من صفحة الإعدادات
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة المحتوى</h1>
          <p className="mt-1 text-slate-500">
            {summary?.total || 0} منشور • FB: {summary?.facebook || 0} • IG: {summary?.instagram || 0}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchPosts} className="btn-secondary">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </button>
          <button className="btn-secondary">
            <Sparkles className="h-4 w-4" />
            توليد محتوى AI
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4" />
            إضافة منشور
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="stat-card text-center">
          <Heart className="mx-auto h-5 w-5 text-red-400" />
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatNumber(summary?.totalLikes || 0)}</p>
          <p className="text-xs text-slate-500">إعجاب</p>
        </div>
        <div className="stat-card text-center">
          <MessageCircle className="mx-auto h-5 w-5 text-blue-400" />
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatNumber(summary?.totalComments || 0)}</p>
          <p className="text-xs text-slate-500">تعليق</p>
        </div>
        <div className="stat-card text-center">
          <Share2 className="mx-auto h-5 w-5 text-emerald-400" />
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatNumber(summary?.totalShares || 0)}</p>
          <p className="text-xs text-slate-500">مشاركة</p>
        </div>
        <div className="stat-card text-center">
          <Eye className="mx-auto h-5 w-5 text-purple-400" />
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatNumber(summary?.totalImpressions || 0)}</p>
          <p className="text-xs text-slate-500">ظهور</p>
        </div>
      </div>

      {/* Platform Filter */}
      <div className="flex gap-2">
        {[
          { key: "all" as const, label: "الكل", count: posts.length },
          { key: "facebook" as const, label: "📘 فيسبوك", count: summary?.facebook || 0 },
          { key: "instagram" as const, label: "📸 إنستغرام", count: summary?.instagram || 0 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all",
              filter === tab.key
                ? "bg-primary-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            {tab.label}
            <span className="mr-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Post Cards */}
      {filteredPosts.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <CalendarDays className="h-10 w-10 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-600">لا توجد منشورات</h3>
          <p className="text-sm text-slate-400">لم يتم العثور على منشورات في هذا القسم</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div key={post.id} className="card overflow-hidden">
              <div className="flex">
                {/* Platform Sidebar */}
                <div className="flex w-16 flex-col items-center justify-center border-l border-slate-100 bg-slate-50 p-4 text-center">
                  <span className="text-2xl">{platformEmoji[post.platform]}</span>
                  {post.mediaType && (
                    <>
                      {post.mediaType === "video" ? (
                        <Video className="mt-2 h-4 w-4 text-slate-400" />
                      ) : post.mediaType === "carousel_album" ? (
                        <FileImage className="mt-2 h-4 w-4 text-slate-400" />
                      ) : (
                        <Image className="mt-2 h-4 w-4 text-slate-400" />
                      )}
                    </>
                  )}
                </div>

                {/* Post Body */}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">{post.pageName}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(post.createdAt).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-3">
                        {post.message || "(بدون نص)"}
                      </p>
                    </div>
                    {post.image && (
                      <img
                        src={post.image}
                        alt=""
                        className="mr-4 h-20 w-20 rounded-lg object-cover"
                      />
                    )}
                  </div>

                  {/* Engagement */}
                  <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-4">
                    <span className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Heart className="h-3.5 w-3.5 text-red-400" />
                      {formatNumber(post.metrics.likes)}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-slate-500">
                      <MessageCircle className="h-3.5 w-3.5 text-blue-400" />
                      {formatNumber(post.metrics.comments)}
                    </span>
                    {post.metrics.shares > 0 && (
                      <span className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Share2 className="h-3.5 w-3.5 text-emerald-400" />
                        {formatNumber(post.metrics.shares)}
                      </span>
                    )}
                    {(post.metrics.impressions || 0) > 0 && (
                      <span className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Eye className="h-3.5 w-3.5 text-purple-400" />
                        {formatNumber(post.metrics.impressions!)}
                      </span>
                    )}
                    {post.url && (
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mr-auto flex items-center gap-1 text-xs text-primary-600 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        عرض المنشور
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
