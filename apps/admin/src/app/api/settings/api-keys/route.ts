import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("api_keys")
      .select("id, service, key_name, key_value, is_active, created_at, updated_at")
      .order("service")
      .order("key_name");

    if (error) {
      console.error("API keys fetch error:", error);
      return NextResponse.json({ keys: [] });
    }

    const masked = (data || []).map((k) => ({
      ...k,
      key_value: k.key_value
        ? k.key_value.substring(0, 8) + "\u2022".repeat(Math.max(0, k.key_value.length - 12)) + k.key_value.slice(-4)
        : "",
    }));

    return NextResponse.json({ keys: masked });
  } catch (err) {
    console.error("Settings API error:", err);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { service, key_name, key_value } = body;

    if (!service || !key_name || !key_value) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("api_keys")
      .upsert(
        { service, key_name, key_value, is_active: true, created_by: user.id },
        { onConflict: "service,key_name" }
      )
      .select()
      .single();

    if (error) {
      console.error("API key save error:", error);
      return NextResponse.json({ error: "لا تملك صلاحية لحفظ المفاتيح" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      key: {
        ...data,
        key_value: data.key_value.substring(0, 8) + "\u2022".repeat(Math.max(0, data.key_value.length - 12)) + data.key_value.slice(-4),
      },
    });
  } catch (err) {
    console.error("Save API key error:", err);
    return NextResponse.json({ error: "خطأ في حفظ المفتاح" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "المعرّف مطلوب" }, { status: 400 });

    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) {
      console.error("API key delete error:", error);
      return NextResponse.json({ error: "لا تملك صلاحية للحذف" }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete API key error:", err);
    return NextResponse.json({ error: "خطأ في الحذف" }, { status: 500 });
  }
}
