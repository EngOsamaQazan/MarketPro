import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { data, error } = await auth.supabase
      .from("monthly_reports")
      .select("*, companies(name, name_en)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ reports: data || [] });
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
      .from("monthly_reports")
      .insert({
        company_id: body.company_id,
        month: body.month,
        plan_id: body.plan_id || null,
        report_data: body.report_data || {},
        status: body.status || "generating",
        organization_id: auth.orgId,
      })
      .select("*, companies(name, name_en)")
      .single();

    if (error) throw error;

    return NextResponse.json({ report: data });
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
      return NextResponse.json({ error: "معرف التقرير مطلوب" }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("monthly_reports")
      .update(updates)
      .eq("id", id)
      .select("*, companies(name, name_en)")
      .single();

    if (error) throw error;

    return NextResponse.json({ report: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
