import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicKey, getSupabaseAdmin } from "@/lib/api-keys";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const apiKey = await getAnthropicKey();
    const anthropic = new Anthropic({ apiKey });

    const { data: companies } = await supabase
      .from("companies")
      .select("*")
      .eq("status", "active");

    if (!companies?.length) {
      return NextResponse.json({ message: "No active companies" });
    }

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthStr = lastMonth.toISOString().split("T")[0];

    const results = [];

    for (const company of companies) {
      const [campaignsRes, contentRes, planRes] = await Promise.all([
        supabase.from("ad_campaigns").select("*").eq("company_id", company.id),
        supabase.from("content_calendar").select("*").eq("company_id", company.id).gte("scheduled_date", monthStr),
        supabase.from("marketing_plans").select("*").eq("company_id", company.id).eq("month", monthStr).single(),
      ]);

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: "أنت محلل تسويق رقمي. أنشئ تقرير أداء شهري شامل بالعربية. أجب بـ JSON.",
        messages: [{
          role: "user",
          content: `شركة: ${company.name}\nحملات: ${JSON.stringify(campaignsRes.data)}\nمحتوى: ${JSON.stringify(contentRes.data)}\nخطة: ${JSON.stringify(planRes.data)}\n\nأنشئ تقرير بصيغة: {"summary": "ملخص", "achievements": [], "overall_score": 0, "ai_insights": [], "next_month_recommendations": []}`,
        }],
      });

      const textContent = message.content.find((c) => c.type === "text");
      const responseText = textContent?.type === "text" ? textContent.text : "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const reportData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      const { data: report } = await supabase.from("monthly_reports").upsert({
        company_id: company.id,
        month: monthStr,
        report_data: reportData,
        status: "ready",
        plan_id: planRes.data?.id,
      }, { onConflict: "company_id,month" }).select().single();

      const { data: clientUsers } = await supabase
        .from("profiles")
        .select("id")
        .eq("company_id", company.id)
        .eq("role", "client");

      for (const user of clientUsers || []) {
        await supabase.from("notifications").insert({
          user_id: user.id,
          company_id: company.id,
          type: "report_ready",
          title: "تقرير الشهر جاهز",
          body: `تقرير أداء ${company.name} لشهر ${monthStr} جاهز للمراجعة`,
          data: { report_id: report?.id },
          action_url: `/reports/${report?.id}`,
        });
      }

      await supabase.from("ai_activity_log").insert({
        company_id: company.id,
        action_type: "report_generated",
        output_data: reportData,
        model_used: "claude-sonnet-4-20250514",
        tokens_used: message.usage.input_tokens + message.usage.output_tokens,
      });

      results.push({ company: company.name, report_id: report?.id });
    }

    return NextResponse.json({ success: true, reports_generated: results.length, results });
  } catch (error) {
    console.error("Monthly report error:", error);
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}
