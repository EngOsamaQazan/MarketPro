import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { data, error } = await auth.supabase
      .from("ai_activity_log")
      .select("id, action_type, company_id, tokens_used, cost_estimate, created_at, action_data, result")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ activities: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
