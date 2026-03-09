import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getApiKey } from "@/lib/api-keys";
import { getChannelsByIds, searchChannels, validateApiKey } from "@/lib/youtube-api";

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
    const channelIds = searchParams.get("ids");
    const query = searchParams.get("q");

    if (channelIds) {
      const channels = await getChannelsByIds(apiKey, channelIds);
      return NextResponse.json({ connected: true, channels });
    }

    if (query) {
      const channels = await searchChannels(apiKey, query);
      return NextResponse.json({ connected: true, channels });
    }

    const isValid = await validateApiKey(apiKey);
    return NextResponse.json({ connected: isValid });
  } catch (error: any) {
    console.error("YouTube channels error:", error);
    return NextResponse.json({ connected: false, error: error.message });
  }
}
