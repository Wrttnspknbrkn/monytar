import { NextResponse } from "next/server"
import { paymentSchema } from "@/lib/validations"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = paymentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true, success: true })
    }

    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("expense_requests")
      .update({
        status: "paid",
        payment_status: "paid",
        payment_date: now,
        payment_reference: parsed.data.payment_reference,
        payment_method: parsed.data.payment_method,
      })
      .eq("id", id)
      .eq("status", "approved")
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (data) {
      await supabase.from("notifications").insert({
        organization_id: data.organization_id,
        user_id: data.employee_id,
        type: "payment_processed",
        title: "Payment Processed",
        message: `Payment for ${data.request_number} has been processed. Ref: ${parsed.data.payment_reference}`,
        related_entity_type: "expense_request",
        related_entity_id: id,
      })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
