import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const companyId = req.nextUrl.searchParams.get("company_id");

    let query = auth.supabase
      .from("content_calendar")
      .select("*, companies(name)")
      .order("scheduled_date", { ascending: false })
      .limit(100);

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ content: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await req.json();

    const { data, error } = await auth.supabase
      .from("content_calendar")
      .insert({
        company_id: body.company_id,
        plan_id: body.plan_id || null,
        platform: body.platform,
        scheduled_date: body.scheduled_date,
        scheduled_time: body.scheduled_time,
        content_type: body.content_type || "post",
        text_content: body.text_content,
        media_urls: body.media_urls || [],
        hashtags: body.hashtags || [],
        status: body.status || "draft",
        approval_status: "pending",
        ai_generated: body.ai_generated || false,
        created_by: auth.user!.id,
        organization_id: auth.orgId,
      })
      .select("*, companies(name)")
      .single();

    if (error) throw error;

    return NextResponse.json({ item: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "معرف المحتوى مطلوب" }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("content_calendar")
      .update(updates)
      .eq("id", id)
      .select("*, companies(name)")
      .single();

    if (error) throw error;

    return NextResponse.json({ item: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
