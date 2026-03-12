import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/api-keys";
import { requireAuth } from "@/lib/auth";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("company_id");
    const status = searchParams.get("status");

    const admin = getSupabaseAdmin();

    let query = admin
      .from("invoices")
      .select("*, companies(name, name_en)")
      .eq("organization_id", auth.orgId)
      .order("created_at", { ascending: false });

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Fetch invoices error:", error);
      return NextResponse.json(
        { success: false, error: "فشل تحميل الفواتير" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, invoices: data || [] });
  } catch (error: any) {
    console.error("Billing GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { company_id, amount, month, description, due_date, items } = body;

    if (!company_id || !amount || !month || !due_date) {
      return NextResponse.json(
        { success: false, error: "البيانات المطلوبة ناقصة" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const calculatedAmount =
      items && Array.isArray(items)
        ? items.reduce(
            (sum: number, item: InvoiceItem) =>
              sum + item.quantity * item.unit_price,
            0
          )
        : amount;

    const { data, error } = await admin
      .from("invoices")
      .insert({
        company_id,
        amount: calculatedAmount,
        month,
        description: description || null,
        due_date,
        items: items || null,
        status: "draft",
        organization_id: auth.orgId,
      })
      .select()
      .single();

    if (error) {
      console.error("Create invoice error:", error);
      return NextResponse.json(
        { success: false, error: "فشل إنشاء الفاتورة" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, invoice: data });
  } catch (error: any) {
    console.error("Billing POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "معرف الفاتورة والحالة مطلوبان" },
        { status: 400 }
      );
    }

    const validStatuses = ["draft", "sent", "paid", "overdue", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "حالة غير صالحة" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "sent") {
      updateData.sent_at = new Date().toISOString();
    }

    if (status === "paid") {
      updateData.paid_at = new Date().toISOString();
    }

    const { data, error } = await admin
      .from("invoices")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update invoice error:", error);
      return NextResponse.json(
        { success: false, error: "فشل تحديث الفاتورة" },
        { status: 500 }
      );
    }

    if (status === "sent") {
      const { data: invoice } = await admin
        .from("invoices")
        .select("company_id, amount, month")
        .eq("id", id)
        .single();

      if (invoice) {
        const { data: clients } = await admin
          .from("profiles")
          .select("id")
          .eq("company_id", invoice.company_id)
          .eq("role", "client");

        if (clients?.length) {
          const notifications = clients.map((client: any) => ({
            user_id: client.id,
            company_id: invoice.company_id,
            title: "فاتورة جديدة",
            body: `تم إصدار فاتورة بقيمة ${invoice.amount} دولار لشهر ${invoice.month}`,
            type: "invoice",
            action_url: "/billing",
          }));

          await admin.from("notifications").insert(notifications);
        }
      }
    }

    return NextResponse.json({ success: true, invoice: data });
  } catch (error: any) {
    console.error("Billing PATCH Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
