import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServiceKeys } from "@/lib/api-keys";
import { discoverPages, metaGet } from "@/lib/meta-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const keys = await getServiceKeys("meta");
    const token = keys.access_token;
    if (!token) return NextResponse.json({ connected: false, posts: [] });

    const pages = await discoverPages(token);
    const allPosts: any[] = [];

    for (const page of pages) {
      const pageToken = page.access_token || token;

      const postsRes = await metaGet<{ data: any[] }>(
        `/${page.id}/posts?fields=id,message,created_time,full_picture,permalink_url,shares,likes.limit(0).summary(true),comments.limit(0).summary(true),insights.metric(post_impressions,post_engaged_users,post_clicks,post_reactions_by_type_total)&limit=30`,
        pageToken
      );

      for (const post of postsRes?.data || []) {
        const insights = post.insights?.data || [];
        const getMetric = (name: string) => {
          const m = insights.find((i: any) => i.name === name);
          return m?.values?.[0]?.value || 0;
        };

        const reactions = getMetric("post_reactions_by_type_total");
        const totalReactions = typeof reactions === "object"
          ? Object.values(reactions).reduce((s: number, v: any) => s + Number(v || 0), 0)
          : Number(reactions || 0);

        allPosts.push({
          id: post.id,
          pageId: page.id,
          pageName: page.name,
          platform: "facebook",
          message: post.message || "",
          image: post.full_picture,
          url: post.permalink_url,
          createdAt: post.created_time,
          metrics: {
            likes: post.likes?.summary?.total_count || 0,
            comments: post.comments?.summary?.total_count || 0,
            shares: post.shares?.count || 0,
            reactions: totalReactions,
            impressions: getMetric("post_impressions"),
            engagement: getMetric("post_engaged_users"),
            clicks: getMetric("post_clicks"),
          },
        });
      }

      if (page.instagram?.id) {
        const igPosts = await metaGet<{ data: any[] }>(
          `/${page.instagram.id}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,insights.metric(impressions,reach,engagement){values}&limit=20`,
          token
        );

        for (const post of igPosts?.data || []) {
          const igInsights = post.insights?.data || [];
          const getIgMetric = (name: string) => {
            const m = igInsights.find((i: any) => i.name === name);
            return m?.values?.[0]?.value || 0;
          };

          allPosts.push({
            id: post.id,
            pageId: page.instagram!.id,
            pageName: `@${page.instagram!.username}`,
            platform: "instagram",
            message: post.caption || "",
            image: post.media_url,
            mediaType: post.media_type?.toLowerCase(),
            url: post.permalink,
            createdAt: post.timestamp,
            metrics: {
              likes: post.like_count || 0,
              comments: post.comments_count || 0,
              shares: 0,
              impressions: getIgMetric("impressions"),
              reach: getIgMetric("reach"),
              engagement: getIgMetric("engagement"),
            },
          });
        }
      }
    }

    allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      connected: true,
      posts: allPosts,
      summary: {
        total: allPosts.length,
        facebook: allPosts.filter((p) => p.platform === "facebook").length,
        instagram: allPosts.filter((p) => p.platform === "instagram").length,
        totalLikes: allPosts.reduce((s, p) => s + (p.metrics.likes || 0), 0),
        totalComments: allPosts.reduce((s, p) => s + (p.metrics.comments || 0), 0),
        totalShares: allPosts.reduce((s, p) => s + (p.metrics.shares || 0), 0),
        totalImpressions: allPosts.reduce((s, p) => s + (p.metrics.impressions || 0), 0),
      },
    });
  } catch (error: any) {
    console.error("Meta posts error:", error);
    return NextResponse.json({ connected: false, posts: [], error: error.message });
  }
}
