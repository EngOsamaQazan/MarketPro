import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServiceKeys } from "@/lib/api-keys";
import {
  MetaClient,
  TikTokClient,
  XClient,
  LinkedInClient,
} from "@satwa/social";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 5);

    const { data: pendingContent, error } = await supabase
      .from("content_calendar")
      .select("*")
      .is("published_post_id", null)
      .or("status.eq.approved,approval_status.eq.approved")
      .lte("scheduled_date", today);

    if (error) throw error;

    const dueContent = (pendingContent || []).filter((c) => {
      if (c.scheduled_date < today) return true;
      return !c.scheduled_time || c.scheduled_time <= currentTime;
    });

    if (!dueContent.length) {
      return NextResponse.json({
        message: "No content due for publishing",
        published: 0,
        failed: 0,
        skipped: 0,
      });
    }

    let published = 0;
    let failed = 0;
    let skipped = 0;

    for (const content of dueContent) {
      try {
        const { data: account } = await supabase
          .from("social_accounts")
          .select("*")
          .eq("company_id", content.company_id)
          .eq("platform", content.platform)
          .eq("is_connected", true)
          .single();

        if (!account) {
          await supabase
            .from("content_calendar")
            .update({
              status: "failed",
              engagement_data: {
                error: "No connected social account found for this platform",
              },
            })
            .eq("id", content.id);
          failed++;
          await notifyManager(
            supabase,
            content,
            false,
            "No connected social account"
          );
          continue;
        }

        const hashtags = Array.isArray(content.hashtags)
          ? content.hashtags.join(" ")
          : content.hashtags || "";
        const fullText = [content.text_content, hashtags]
          .filter(Boolean)
          .join("\n");
        let response: any;

        switch (content.platform) {
          case "facebook":
          case "meta": {
            const client = new MetaClient({
              accessToken: account.access_token,
              pageId: account.account_id,
            });
            response = await client.createPost({
              message: fullText,
              media_url: content.media_urls?.[0],
            });
            break;
          }

          case "instagram": {
            const client = new MetaClient({
              accessToken: account.access_token,
            });
            const isVideo = content.content_type === "video";
            response = await client.createInstagramPost({
              igUserId: account.account_id,
              caption: fullText,
              ...(isVideo
                ? {
                    videoUrl: content.media_urls?.[0],
                    mediaType: "VIDEO" as const,
                  }
                : { imageUrl: content.media_urls?.[0] }),
            });
            break;
          }

          case "tiktok": {
            if (content.content_type !== "video" || !content.media_urls?.[0]) {
              skipped++;
              continue;
            }
            const tiktokKeys = await getServiceKeys("tiktok");
            const client = new TikTokClient({
              clientKey: tiktokKeys.client_key,
              clientSecret: tiktokKeys.client_secret,
              accessToken: account.access_token,
            });
            response = await client.uploadVideo({
              videoUrl: content.media_urls[0],
              title: fullText,
            });
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
            response = await client.createTweet(fullText);
            break;
          }

          case "linkedin": {
            const client = new LinkedInClient({
              accessToken: account.access_token,
              organizationId: account.account_id,
            });
            response = await client.createPost(fullText);
            break;
          }

          default:
            skipped++;
            continue;
        }

        const postId =
          response?.id ||
          response?.data?.publish_id ||
          JSON.stringify(response);

        await supabase
          .from("content_calendar")
          .update({ status: "published", published_post_id: postId })
          .eq("id", content.id);

        await notifyManager(supabase, content, true);
        published++;
      } catch (err: any) {
        console.error(`Failed to publish content ${content.id}:`, err);
        await supabase
          .from("content_calendar")
          .update({
            status: "failed",
            engagement_data: { error: err.message },
          })
          .eq("id", content.id);
        await notifyManager(supabase, content, false, err.message);
        failed++;
      }
    }

    return NextResponse.json({ published, failed, skipped });
  } catch (error: any) {
    console.error("Publish content cron error:", error);
    return NextResponse.json(
      { error: "Publish content cron failed" },
      { status: 500 }
    );
  }
}

async function notifyManager(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  content: any,
  success: boolean,
  errorMsg?: string
) {
  const { data: company } = await supabase
    .from("companies")
    .select("assigned_manager")
    .eq("id", content.company_id)
    .single();

  if (!company?.assigned_manager) return;

  await supabase.from("notifications").insert({
    user_id: company.assigned_manager,
    company_id: content.company_id,
    title: success ? "تم نشر المحتوى" : "فشل نشر المحتوى",
    body: success
      ? `تم نشر المحتوى على ${content.platform} بنجاح`
      : `فشل نشر المحتوى على ${content.platform}: ${errorMsg}`,
    type: success ? "content_published" : "content_failed",
    action_url: `/content/${content.id}`,
    data: {
      content_id: content.id,
      platform: content.platform,
      ...(errorMsg && { error: errorMsg }),
    },
  });
}
