import { NextResponse } from "next/server"
import { rejectSchema } from "@/lib/validations"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = rejectSchema.safeParse(body)

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
        status: "rejected",
        rejected_by: user.id,
        rejected_at: now,
        manager_comment: parsed.data.comment,
      })
      .eq("id", id)
      .eq("status", "pending")
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (data) {
      await supabase.from("notifications").insert({
        organization_id: data.organization_id,
        user_id: data.employee_id,
        type: "request_rejected",
        title: "Request Rejected",
        message: `Your request ${data.request_number} has been rejected: ${parsed.data.comment}`,
        related_entity_type: "expense_request",
        related_entity_id: id,
      })
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
