import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { MarketingPlanPDF, MonthlyReportPDF } from "@satwa/pdf";
import { requireAuth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/api-keys";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { type, id } = await req.json();

    if (!type || !id || !["plan", "report"].includes(type)) {
      return NextResponse.json(
        { error: "مطلوب: type (plan | report) و id" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    if (type === "plan") {
      return await generatePlanPDF(supabase, id);
    } else {
      return await generateReportPDF(supabase, id);
    }
  } catch (error: any) {
    console.error("[generate-pdf] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generatePlanPDF(supabase: ReturnType<typeof getSupabaseAdmin>, id: string) {
  const { data: plan, error } = await supabase
    .from("marketing_plans")
    .select("*, companies(id, name, name_en)")
    .eq("id", id)
    .single();

  if (error || !plan) {
    return NextResponse.json({ error: "الخطة غير موجودة" }, { status: 404 });
  }

  const analysis = plan.ai_analysis || {};

  const pdfElement = React.createElement(MarketingPlanPDF, {
    companyName: plan.companies?.name || "شركة",
    companyNameEn: plan.companies?.name_en,
    month: plan.month,
    executiveSummary: analysis.executive_summary || plan.title || "",
    objectives: Array.isArray(plan.objectives)
      ? plan.objectives.map((o: any) => ({
          goal: o.goal || o.text || String(o),
          metric: o.metric || "",
          target_value: o.target_value || o.target || "",
        }))
      : [],
    platformStrategy: analysis.platform_strategy || buildPlatformStrategy(plan.target_platforms),
    adCampaigns: analysis.ad_campaigns || [],
    budgetBreakdown: plan.budget_breakdown || {},
    kpis: normalizeKPIs(plan.kpis),
  });

  const buffer = await renderToBuffer(pdfElement as any);

  const fileName = `plan-${plan.companies?.name || id}-${plan.month || "draft"}.pdf`.replace(/\s+/g, "-");
  const storagePath = `plans/${id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("reports")
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    console.error("[generate-pdf] Upload error:", uploadError);
    return NextResponse.json(
      { error: "فشل رفع ملف PDF" },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage
    .from("reports")
    .getPublicUrl(storagePath);

  const pdfUrl = urlData.publicUrl;

  await supabase
    .from("marketing_plans")
    .update({ pdf_url: pdfUrl })
    .eq("id", id);

  await notifyClientUsers(supabase, plan.company_id, {
    type: "plan_pdf_ready",
    title: "خطة التسويق جاهزة كملف PDF",
    body: `خطة ${plan.title || plan.month} لـ${plan.companies?.name} جاهزة للتحميل`,
    data: { plan_id: id, pdf_url: pdfUrl },
    action_url: `/plans/${id}`,
  });

  return NextResponse.json({ success: true, pdf_url: pdfUrl });
}

async function generateReportPDF(supabase: ReturnType<typeof getSupabaseAdmin>, id: string) {
  const { data: report, error } = await supabase
    .from("monthly_reports")
    .select("*, companies(id, name, name_en)")
    .eq("id", id)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: "التقرير غير موجود" }, { status: 404 });
  }

  const rd = report.report_data || {};

  const pdfElement = React.createElement(MonthlyReportPDF, {
    companyName: report.companies?.name || "شركة",
    month: report.month,
    overallScore: rd.overall_score ?? 7,
    executiveSummary: rd.summary || "",
    achievements: rd.achievements || [],
    kpiResults: normalizeKPIResults(rd.kpi_results),
    platformStats: rd.platform_stats || [],
    campaignResults: rd.campaign_results || [],
    budgetPlanned: rd.budget_planned ?? 0,
    budgetSpent: rd.budget_spent ?? 0,
    aiRecommendations: rd.next_month_recommendations || rd.ai_insights || [],
  });

  const buffer = await renderToBuffer(pdfElement as any);

  const fileName = `report-${report.companies?.name || id}-${report.month || "monthly"}.pdf`.replace(/\s+/g, "-");
  const storagePath = `reports/${id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("reports")
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    console.error("[generate-pdf] Upload error:", uploadError);
    return NextResponse.json(
      { error: "فشل رفع ملف PDF" },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage
    .from("reports")
    .getPublicUrl(storagePath);

  const pdfUrl = urlData.publicUrl;

  await supabase
    .from("monthly_reports")
    .update({ pdf_url: pdfUrl })
    .eq("id", id);

  await notifyClientUsers(supabase, report.company_id, {
    type: "report_pdf_ready",
    title: "التقرير الشهري جاهز كملف PDF",
    body: `تقرير ${report.month} لـ${report.companies?.name} جاهز للتحميل`,
    data: { report_id: id, pdf_url: pdfUrl },
    action_url: `/reports/${id}`,
  });

  return NextResponse.json({ success: true, pdf_url: pdfUrl });
}

function buildPlatformStrategy(platforms: string[] | null) {
  if (!platforms?.length) return {};
  return Object.fromEntries(
    platforms.map((p) => [
      p,
      { why: "", content_types: [], posting_frequency: "", budget_allocation: "" },
    ])
  );
}

function normalizeKPIs(kpis: any): Array<{ name: string; target: string; measurement: string }> {
  if (!kpis) return [];
  if (Array.isArray(kpis)) {
    return kpis.map((k: any) => ({
      name: k.name || k.label || "",
      target: k.target || k.target_value || "",
      measurement: k.measurement || k.method || "",
    }));
  }
  return Object.entries(kpis).map(([key, val]: [string, any]) => ({
    name: key,
    target: typeof val === "object" ? val.target || "" : String(val),
    measurement: typeof val === "object" ? val.measurement || "" : "",
  }));
}

function normalizeKPIResults(results: any): Array<{ name: string; target: number; actual: number; unit: string }> {
  if (!results) return [];
  if (Array.isArray(results)) {
    return results.map((r: any) => ({
      name: r.name || r.label || "",
      target: Number(r.target) || 0,
      actual: Number(r.actual) || 0,
      unit: r.unit || "",
    }));
  }
  return [];
}

async function notifyClientUsers(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  companyId: string,
  notification: { type: string; title: string; body: string; data: any; action_url: string }
) {
  const { data: clientUsers } = await supabase
    .from("profiles")
    .select("id")
    .eq("company_id", companyId)
    .eq("role", "client");

  if (!clientUsers?.length) return;

  const rows = clientUsers.map((user: any) => ({
    user_id: user.id,
    company_id: companyId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    action_url: notification.action_url,
  }));

  await supabase.from("notifications").insert(rows);
}
