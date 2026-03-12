import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const companyId = new URL(request.url).searchParams.get("company_id");
    if (!companyId) {
      return NextResponse.json({ error: "معرف الشركة مطلوب" }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("social_accounts")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ accounts: data || [] });
  } catch (error: any) {
    console.error("[social-accounts] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await request.json();

    if (!body.company_id || !body.platform || !body.account_id || !body.account_name) {
      return NextResponse.json(
        { error: "الحقول المطلوبة: company_id, platform, account_id, account_name" },
        { status: 400 }
      );
    }

    const { data, error } = await auth.supabase
      .from("social_accounts")
      .upsert(
        {
          company_id: body.company_id,
          platform: body.platform,
          account_id: body.account_id,
          account_name: body.account_name,
          access_token: body.access_token,
          refresh_token: body.refresh_token || null,
          token_expires_at: body.token_expires_at || null,
          permissions: body.permissions || null,
          is_connected: true,
          last_synced_at: new Date().toISOString(),
          organization_id: auth.orgId,
        },
        { onConflict: "company_id,platform,account_id" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ account: data });
  } catch (error: any) {
    console.error("[social-accounts] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "معرف الحساب مطلوب" }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("social_accounts")
      .update({
        is_connected: false,
        access_token: null,
        refresh_token: null,
        token_expires_at: null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ account: data });
  } catch (error: any) {
    console.error("[social-accounts] DELETE error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
