import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { data, error } = await auth.supabase
      .from("marketing_plans")
      .select("*, companies(name, name_en)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ plans: data || [] });
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
      .from("marketing_plans")
      .insert({
        company_id: body.company_id,
        month: body.month,
        title: body.title,
        objectives: body.objectives || [],
        target_platforms: body.target_platforms || [],
        total_budget: body.total_budget || 0,
        budget_breakdown: body.budget_breakdown || {},
        kpis: body.kpis || {},
        ai_analysis: body.ai_analysis || {},
        status: body.status || "draft",
        created_by: auth.user!.id,
        organization_id: auth.orgId,
      })
      .select("*, companies(name, name_en)")
      .single();

    if (error) throw error;

    return NextResponse.json({ plan: data });
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
      return NextResponse.json({ error: "معرف الخطة مطلوب" }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("marketing_plans")
      .update(updates)
      .eq("id", id)
      .select("*, companies(name, name_en)")
      .single();

    if (error) throw error;

    return NextResponse.json({ plan: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
