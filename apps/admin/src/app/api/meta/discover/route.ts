import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServiceKeys } from "@/lib/api-keys";
import { discoverPages, discoverAdAccounts } from "@/lib/meta-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const keys = await getServiceKeys("meta");
    const token = keys.access_token;
    if (!token) {
      return NextResponse.json({ connected: false, error: "لم يتم إعداد Meta API بعد" });
    }

    const [pages, adAccounts] = await Promise.all([
      discoverPages(token),
      discoverAdAccounts(token),
    ]);

    return NextResponse.json({
      connected: true,
      pages,
      adAccounts,
      summary: {
        totalPages: pages.length,
        totalAdAccounts: adAccounts.length,
        totalFollowers: pages.reduce((s, p) => s + p.followers, 0),
        totalIgFollowers: pages.reduce((s, p) => s + (p.instagram?.followers || 0), 0),
      },
    });
  } catch (error: any) {
    console.error("Meta discover error:", error);
    return NextResponse.json({ connected: false, error: error.message });
  }
}
