import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { data, error } = await auth.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", auth.user!.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const unread = (data || []).filter((n: any) => !n.is_read).length;

    return NextResponse.json({ notifications: data || [], unread });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await req.json();

    if (body.mark_all_read) {
      await auth.supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", auth.user!.id)
        .eq("is_read", false);

      return NextResponse.json({ success: true });
    }

    if (body.id) {
      await auth.supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", body.id)
        .eq("user_id", auth.user!.id);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "معرف الإشعار مطلوب" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
