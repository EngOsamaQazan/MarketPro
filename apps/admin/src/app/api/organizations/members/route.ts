import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireOrgAdmin } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { data: members, error } = await auth.supabase
    .from("organization_members")
    .select("id, user_id, role, invited_at, accepted_at, profiles:user_id(full_name, email, avatar_url, phone)")
    .eq("organization_id", auth.orgId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members });
}

export async function POST(request: NextRequest) {
  const auth = await requireOrgAdmin();
  if (auth.error) return auth.error;

  const { email, role = "viewer" } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "البريد الإلكتروني مطلوب" }, { status: 400 });
  }

  if (!["admin", "manager", "viewer"].includes(role)) {
    return NextResponse.json({ error: "دور غير صالح" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: existingUser } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (existingUser) {
    const { data: existingMember } = await admin
      .from("organization_members")
      .select("id")
      .eq("organization_id", auth.orgId)
      .eq("user_id", existingUser.id)
      .single();

    if (existingMember) {
      return NextResponse.json({ error: "المستخدم عضو بالفعل في المنظمة" }, { status: 409 });
    }

    const { error: insertError } = await admin
      .from("organization_members")
      .insert({
        organization_id: auth.orgId,
        user_id: existingUser.id,
        role,
        invited_by: auth.user.id,
        accepted_at: new Date().toISOString(),
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "تمت إضافة العضو بنجاح" });
  }

  const { data: newUser, error: signupError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { role: "viewer", org_name: "Invited" },
  });

  if (signupError || !newUser.user) {
    return NextResponse.json({ error: signupError?.message || "فشل إنشاء المستخدم" }, { status: 500 });
  }

  const { error: memberError } = await admin
    .from("organization_members")
    .insert({
      organization_id: auth.orgId,
      user_id: newUser.user.id,
      role,
      invited_by: auth.user.id,
    });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "تمت الدعوة بنجاح، سيتم إرسال بريد التأكيد" });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireOrgAdmin();
  if (auth.error) return auth.error;

  const { member_id, role } = await request.json();

  if (!member_id || !role) {
    return NextResponse.json({ error: "البيانات ناقصة" }, { status: 400 });
  }

  if (!["admin", "manager", "viewer"].includes(role)) {
    return NextResponse.json({ error: "دور غير صالح" }, { status: 400 });
  }

  const { data: member } = await auth.supabase
    .from("organization_members")
    .select("role, user_id")
    .eq("id", member_id)
    .eq("organization_id", auth.orgId)
    .single();

  if (!member) {
    return NextResponse.json({ error: "العضو غير موجود" }, { status: 404 });
  }

  if (member.role === "owner") {
    return NextResponse.json({ error: "لا يمكن تغيير دور المالك" }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("organization_members")
    .update({ role })
    .eq("id", member_id)
    .eq("organization_id", auth.orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireOrgAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("id");

  if (!memberId) {
    return NextResponse.json({ error: "معرف العضو مطلوب" }, { status: 400 });
  }

  const { data: member } = await auth.supabase
    .from("organization_members")
    .select("role, user_id")
    .eq("id", memberId)
    .eq("organization_id", auth.orgId)
    .single();

  if (!member) {
    return NextResponse.json({ error: "العضو غير موجود" }, { status: 404 });
  }

  if (member.role === "owner") {
    return NextResponse.json({ error: "لا يمكن حذف المالك" }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("organization_members")
    .delete()
    .eq("id", memberId)
    .eq("organization_id", auth.orgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
