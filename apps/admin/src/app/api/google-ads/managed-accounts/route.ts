import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServiceKeys, getSupabaseAdmin } from "@/lib/api-keys";
import {
  refreshAccessToken,
  listAccessibleCustomers,
} from "@/lib/google-ads-api";

export const dynamic = "force-dynamic";

interface ManagedAccount {
  id: string;
  name: string;
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const keys = await getServiceKeys("google_ads");

    const managed: ManagedAccount[] = [];
    if (keys.managed_accounts) {
      try {
        const parsed = JSON.parse(keys.managed_accounts);
        if (Array.isArray(parsed)) managed.push(...parsed);
      } catch {
        /* invalid JSON */
      }
    }

    let allAccessible: string[] = [];
    const { developer_token, client_id, client_secret, refresh_token } = keys;
    if (developer_token && client_id && client_secret && refresh_token) {
      try {
        const accessToken = await refreshAccessToken(
          client_id,
          client_secret,
          refresh_token
        );
        if (accessToken) {
          allAccessible = await listAccessibleCustomers(
            developer_token,
            accessToken
          );
          const mccId = keys.mcc_id?.replace(/-/g, "");
          if (mccId) {
            allAccessible = allAccessible.filter((id) => id !== mccId);
          }
        }
      } catch (e: any) {
        console.error("[managed-accounts] Error fetching accessible:", e.message);
      }
    }

    const managedIds = new Set(managed.map((a) => a.id));
    const allAccounts = allAccessible.map((id) => {
      const m = managed.find((a) => a.id === id);
      return {
        id,
        name: m?.name || "",
        selected: managedIds.has(id),
      };
    });

    for (const m of managed) {
      if (!allAccessible.includes(m.id)) {
        allAccounts.push({ id: m.id, name: m.name, selected: true });
      }
    }

    return NextResponse.json({
      accounts: allAccounts,
      managed,
      mccId: keys.mcc_id || null,
    });
  } catch (error: any) {
    console.error("[managed-accounts] GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const accounts: ManagedAccount[] = body.accounts;

    if (!Array.isArray(accounts)) {
      return NextResponse.json(
        { error: "يجب إرسال مصفوفة حسابات" },
        { status: 400 }
      );
    }

    const valid = accounts
      .filter((a) => a.id && a.name?.trim())
      .map((a) => ({ id: a.id.replace(/-/g, ""), name: a.name.trim() }));

    const admin = getSupabaseAdmin();
    await admin.from("api_keys").upsert(
      {
        service: "google_ads",
        key_name: "managed_accounts",
        key_value: JSON.stringify(valid),
        is_active: true,
        created_by: user.id,
      },
      { onConflict: "service,key_name" }
    );

    return NextResponse.json({
      success: true,
      managed: valid,
      message: `تم حفظ ${valid.length} حساب بنجاح`,
    });
  } catch (error: any) {
    console.error("[managed-accounts] POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
