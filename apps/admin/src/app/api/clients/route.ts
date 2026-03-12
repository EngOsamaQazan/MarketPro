import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { data, error } = await auth.supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ clients: data || [] });
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
      .from("companies")
      .insert({
        name: body.name,
        name_en: body.name_en || null,
        industry: body.industry,
        country: body.country,
        city: body.city,
        website: body.website || null,
        description: body.description || null,
        target_audience: body.target_audience || null,
        monthly_budget: body.monthly_budget || 0,
        package_type: body.package_type || "basic",
        contract_start_date: body.contract_start_date,
        contract_end_date: body.contract_end_date || null,
        status: "active",
        assigned_manager_id: body.assigned_manager_id || auth.user!.id,
        organization_id: auth.orgId,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ client: data });
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
      return NextResponse.json({ error: "معرف العميل مطلوب" }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("companies")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ client: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
