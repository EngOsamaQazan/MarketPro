import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { identifier } = await req.json();

    if (!identifier) {
      return NextResponse.json(
        { error: "المعرّف مطلوب" },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim();

    if (trimmed.includes("@")) {
      return NextResponse.json({ email: trimmed });
    }

    const { data, error } = await supabase.rpc("resolve_login_identity", {
      login_identifier: trimmed,
    });

    if (error || !data || data.length === 0) {
      const isPhone = /^[\d\+\-\s()]+$/.test(trimmed) && trimmed.replace(/\D/g, "").length >= 7;
      return NextResponse.json(
        { error: isPhone ? "رقم الهاتف غير مسجل" : "اسم المستخدم غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json({ email: data[0].email });
  } catch {
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    );
  }
}
