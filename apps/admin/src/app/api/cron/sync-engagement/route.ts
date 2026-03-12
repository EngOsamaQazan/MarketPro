import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServiceKeys } from "@/lib/api-keys";
import { TikTokClient, XClient } from "@satwa/social";

const META_API_BASE = "https://graph.facebook.com/v24.0";
const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

async function fetchMetaApi(accessToken: string, path: string) {
  const separator = path.includes("?") ? "&" : "?";
  const url = `${META_API_BASE}${path}${separator}access_token=${accessToken}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Meta API Error: ${JSON.stringify(err)}`);
  }
  return res.json();
}

async function fetchLinkedInApi(accessToken: string, path: string) {
  const res = await fetch(`${LINKEDIN_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Restli-Protocol-Version": "2.0.0",
    },
  });
  if (!res.ok) throw new Error(`LinkedIn API Error: ${res.status}`);
  return res.json();
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: publishedContent, error } = await supabase
      .from("content_calendar")
      .select("*")
      .eq("status", "published")
      .not("published_post_id", "is", null);

    if (error) throw error;

    const dueForSync = (publishedContent || []).filter((c) => {
      if (!c.engagement_data) return true;
      const lastChecked = c.engagement_data?.last_checked_at;
      return !lastChecked || lastChecked < oneHourAgo;
    });

    if (!dueForSync.length) {
      return NextResponse.json({
        message: "No content due for engagement sync",
        synced: 0,
        errors: 0,
      });
    }

    let synced = 0;
    let errors = 0;

    for (const content of dueForSync) {
      try {
        const { data: account } = await supabase
          .from("social_accounts")
          .select("*")
          .eq("company_id", content.company_id)
          .eq("platform", content.platform)
          .eq("is_connected", true)
          .single();

        if (!account) {
          errors++;
          continue;
        }

        let engagement: Record<string, any> = {};

        switch (content.platform) {
          case "facebook":
          case "meta": {
            const data = await fetchMetaApi(
              account.access_token,
              `/${content.published_post_id}?fields=shares,reactions.summary(true),comments.summary(true),insights.metric(post_impressions,post_engaged_users){values}`
            );
            engagement = {
              shares: data.shares?.count || 0,
              reactions: data.reactions?.summary?.total_count || 0,
              comments: data.comments?.summary?.total_count || 0,
              impressions:
                data.insights?.data?.[0]?.values?.[0]?.value || 0,
              engaged_users:
                data.insights?.data?.[1]?.values?.[0]?.value || 0,
            };
            break;
          }

          case "instagram": {
            const data = await fetchMetaApi(
              account.access_token,
              `/${content.published_post_id}?fields=like_count,comments_count,media_type,timestamp`
            );
            engagement = {
              likes: data.like_count || 0,
              comments: data.comments_count || 0,
              media_type: data.media_type,
            };
            break;
          }

          case "tiktok": {
            const tiktokKeys = await getServiceKeys("tiktok");
            const client = new TikTokClient({
              clientKey: tiktokKeys.client_key,
              clientSecret: tiktokKeys.client_secret,
              accessToken: account.access_token,
            });
            const data = (await client.getVideoInsights([
              content.published_post_id,
            ])) as any;
            const video = data?.data?.videos?.[0];
            engagement = {
              views: video?.view_count || 0,
              likes: video?.like_count || 0,
              comments: video?.comment_count || 0,
              shares: video?.share_count || 0,
            };
            break;
          }

          case "x": {
            const xKeys = await getServiceKeys("x");
            const client = new XClient({
              bearerToken: account.access_token,
              apiKey: xKeys.api_key,
              apiSecret: xKeys.api_secret,
              accessToken: account.access_token,
              accessTokenSecret: xKeys.access_token_secret || "",
            });
            const data = (await client.getTweetMetrics(
              content.published_post_id
            )) as any;
            const metrics = data?.data?.public_metrics || {};
            engagement = {
              likes: metrics.like_count || 0,
              retweets: metrics.retweet_count || 0,
              replies: metrics.reply_count || 0,
              impressions: metrics.impression_count || 0,
              quotes: metrics.quote_count || 0,
            };
            break;
          }

          case "linkedin": {
            const data = await fetchLinkedInApi(
              account.access_token,
              `/socialActions/urn:li:share:${content.published_post_id}`
            );
            engagement = {
              likes: data.likesSummary?.totalLikes || 0,
              comments:
                data.commentsSummary?.totalFirstLevelComments || 0,
            };
            break;
          }

          default:
            continue;
        }

        engagement.last_checked_at = new Date().toISOString();

        await supabase
          .from("content_calendar")
          .update({ engagement_data: engagement })
          .eq("id", content.id);

        await supabase
          .from("social_accounts")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", account.id);

        synced++;
      } catch (err: any) {
        console.error(
          `Failed to sync engagement for content ${content.id}:`,
          err
        );
        errors++;
      }
    }

    return NextResponse.json({ synced, errors });
  } catch (error: any) {
    console.error("Sync engagement cron error:", error);
    return NextResponse.json(
      { error: "Sync engagement cron failed" },
      { status: 500 }
    );
  }
}
