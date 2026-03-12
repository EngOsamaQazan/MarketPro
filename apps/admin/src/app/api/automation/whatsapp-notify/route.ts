import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getServiceKeys } from "@/lib/api-keys";
import { requireAuth } from "@/lib/auth";

const templates: Record<string, { header?: string; body: string }> = {
  report_ready: {
    header: "📊 التقرير الشهري جاهز",
    body: "مرحباً {{name}}، تقريرك الشهري لشركة {{company}} جاهز للمراجعة. يمكنك الاطلاع عليه من خلال التطبيق.",
  },
  plan_ready: {
    header: "📋 خطة التسويق جاهزة",
    body: "مرحباً {{name}}، خطة التسويق الجديدة لشركة {{company}} جاهزة للمراجعة والموافقة.",
  },
  invoice: {
    header: "🧾 فاتورة جديدة",
    body: "مرحباً {{name}}، تم إصدار فاتورة جديدة لشركة {{company}}. يرجى مراجعتها من خلال التطبيق.",
  },
};

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { company_id, message, template_type } = body;

    if (!company_id) {
      return NextResponse.json(
        { success: false, error: "company_id مطلوب" },
        { status: 400 }
      );
    }

    if (!message && !template_type) {
      return NextResponse.json(
        { success: false, error: "الرسالة أو نوع القالب مطلوب" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const { data: company } = await admin
      .from("companies")
      .select("name")
      .eq("id", company_id)
      .single();

    if (!company) {
      return NextResponse.json(
        { success: false, error: "الشركة غير موجودة" },
        { status: 404 }
      );
    }

    const { data: clientProfiles } = await admin
      .from("profiles")
      .select("id, full_name, phone")
      .eq("company_id", company_id)
      .eq("role", "client");

    if (!clientProfiles?.length) {
      return NextResponse.json(
        { success: false, error: "لا يوجد عملاء مرتبطون بهذه الشركة" },
        { status: 404 }
      );
    }

    const recipientsWithPhone = clientProfiles.filter(
      (p) => p.phone?.trim()
    );

    if (recipientsWithPhone.length === 0) {
      return NextResponse.json(
        { success: false, error: "لا يوجد رقم هاتف مسجل للعملاء" },
        { status: 400 }
      );
    }

    const waKeys = await getServiceKeys("whatsapp");
    const accessToken = waKeys.access_token;
    const phoneNumberId = waKeys.phone_number_id;

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "بيانات WhatsApp API غير مُعدّة. أضف access_token و phone_number_id في إعدادات خدمة whatsapp.",
        },
        { status: 500 }
      );
    }

    const results: {
      profile_id: string;
      phone: string;
      success: boolean;
      error?: string;
    }[] = [];

    for (const recipient of recipientsWithPhone) {
      const phone = recipient.phone!.replace(/[\s\-\+]/g, "");

      let messageText = message;
      if (template_type && templates[template_type]) {
        const tpl = templates[template_type];
        messageText = tpl.body
          .replace("{{name}}", recipient.full_name)
          .replace("{{company}}", company.name);
      }

      try {
        const waResponse = await fetch(
          `https://graph.facebook.com/v24.0/${phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: phone,
              type: "text",
              text: { body: messageText },
            }),
          }
        );

        const waData = await waResponse.json();

        if (waResponse.ok) {
          results.push({
            profile_id: recipient.id,
            phone,
            success: true,
          });
        } else {
          results.push({
            profile_id: recipient.id,
            phone,
            success: false,
            error: waData.error?.message || "فشل إرسال الرسالة",
          });
        }
      } catch (err: any) {
        results.push({
          profile_id: recipient.id,
          phone,
          success: false,
          error: err.message,
        });
      }
    }

    await admin.from("ai_activity_log").insert({
      action_type: "whatsapp_notification",
      action_data: {
        company_id,
        template_type: template_type || "custom",
        recipients_count: recipientsWithPhone.length,
        message_preview:
          (message || templates[template_type!]?.body || "").slice(0, 100),
      },
      result: {
        results,
        total_sent: results.filter((r) => r.success).length,
        total_failed: results.filter((r) => !r.success).length,
      },
      created_by: auth.user!.id,
      company_id,
    });

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        sent: successCount,
        failed: failCount,
      },
      results,
    });
  } catch (error: any) {
    console.error("WhatsApp Notify Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "فشل إرسال الإشعار" },
      { status: 500 }
    );
  }
}
