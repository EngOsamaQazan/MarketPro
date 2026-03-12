import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const pattern = `%${q}%`;

    const [companies, plans, campaigns, content] = await Promise.all([
      auth.supabase
        .from("companies")
        .select("id, name, name_en, industry, status")
        .or(`name.ilike.${pattern},name_en.ilike.${pattern}`)
        .limit(5),
      auth.supabase
        .from("marketing_plans")
        .select("id, title, month, status, companies(name)")
        .ilike("title", pattern)
        .limit(5),
      auth.supabase
        .from("ad_campaigns")
        .select("id, name, platform, status, companies(name)")
        .ilike("name", pattern)
        .limit(5),
      auth.supabase
        .from("content_calendar")
        .select("id, text_content, platform, status, scheduled_date")
        .ilike("text_content", pattern)
        .limit(5),
    ]);

    const results = [
      ...(companies.data || []).map((c: any) => ({
        type: "client" as const,
        id: c.id,
        title: c.name,
        subtitle: c.name_en || c.industry,
        status: c.status,
        url: "/clients",
      })),
      ...(plans.data || []).map((p: any) => ({
        type: "plan" as const,
        id: p.id,
        title: p.title,
        subtitle: p.companies?.name || p.month,
        status: p.status,
        url: "/plans",
      })),
      ...(campaigns.data || []).map((c: any) => ({
        type: "campaign" as const,
        id: c.id,
        title: c.name,
        subtitle: `${c.platform} • ${c.companies?.name || ""}`,
        status: c.status,
        url: "/campaigns",
      })),
      ...(content.data || []).map((c: any) => ({
        type: "content" as const,
        id: c.id,
        title: c.text_content?.substring(0, 60) + (c.text_content?.length > 60 ? "..." : ""),
        subtitle: `${c.platform} • ${c.scheduled_date}`,
        status: c.status,
        url: "/content",
      })),
    ];

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
