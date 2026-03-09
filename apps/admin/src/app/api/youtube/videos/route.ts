import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getApiKey } from "@/lib/api-keys";
import { getChannelVideos } from "@/lib/youtube-api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const apiKey = await getApiKey("google", "api_key");
    if (!apiKey) {
      return NextResponse.json({ connected: false, error: "لم يتم إعداد Google API Key" });
    }

    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    const maxResults = Number(searchParams.get("limit") || "20");

    if (!channelId) {
      return NextResponse.json({ error: "channelId مطلوب" }, { status: 400 });
    }

    const videos = await getChannelVideos(apiKey, channelId, maxResults);

    const summary = {
      total: videos.length,
      totalViews: videos.reduce((s, v) => s + v.viewCount, 0),
      totalLikes: videos.reduce((s, v) => s + v.likeCount, 0),
      totalComments: videos.reduce((s, v) => s + v.commentCount, 0),
    };

    return NextResponse.json({ connected: true, videos, summary });
  } catch (error: any) {
    console.error("YouTube videos error:", error);
    return NextResponse.json({ connected: false, error: error.message });
  }
}
