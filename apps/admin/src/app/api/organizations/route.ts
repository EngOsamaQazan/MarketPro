import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { supabase, orgId } = auth;

  const { data: org, error } = await supabase
    .from("organizations")
    .select("*, organization_members(id, user_id, role, accepted_at, profiles:user_id(full_name, email, avatar_url))")
    .eq("id", orgId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ organization: org });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  if (!["owner", "admin"].includes(auth.orgRole)) {
    return NextResponse.json({ error: "غير مصرح بالتعديل" }, { status: 403 });
  }

  const body = await request.json();
  const { name, name_en, logo_url, website, settings } = body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (name_en !== undefined) updates.name_en = name_en;
  if (logo_url !== undefined) updates.logo_url = logo_url;
  if (website !== undefined) updates.website = website;
  if (settings !== undefined) updates.settings = settings;

  const { data, error } = await auth.supabase
    .from("organizations")
    .update(updates)
    .eq("id", auth.orgId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ organization: data });
}
