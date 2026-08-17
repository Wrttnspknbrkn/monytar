import { NextResponse } from "next/server"
import { rejectSchema } from "@/lib/validations"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { authorize } from "@/lib/api/authorize"
import { serverError } from "@/lib/api/errors"
import { notify } from "@/lib/notifications/service"
import { requestRejectedEmail } from "@/lib/notifications/templates"
import { formatMoney } from "@/lib/currency"

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

    // Only managers, finance, and admins may reject.
    const { actor, response } = await authorize(["manager", "finance", "admin"])
    if (response) return response
    const { supabase, userId, organizationId, departmentId, role } = actor

    const now = new Date().toISOString()

    let updateQuery = supabase
      .from("expense_requests")
      .update({
        status: "rejected",
        rejected_by: userId,
        rejected_at: now,
        manager_comment: parsed.data.comment,
      })
      .eq("id", id)
      .eq("status", "pending")
      // Defense-in-depth: never act on another tenant's data.
      .eq("organization_id", organizationId)

    // Managers may only reject requests within their own department.
    if (role === "manager") {
      updateQuery = updateQuery.eq("department_id", departmentId)
    }

    const { data, error } = await updateQuery.select().single()

    if (error && error.code === "PGRST116") {
      return NextResponse.json(
        { error: "Request not found or you are not authorized to reject it" },
        { status: 403 },
      )
    }
    if (error) return serverError(error, { route: "requests.[id].reject", id })

    if (data) {
      const { data: employee } = await supabase
        .from("users")
        .select("email, full_name")
        .eq("id", data.employee_id)
        .single()

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
      await notify(supabase, {
        organizationId: data.organization_id,
        userId: data.employee_id,
        type: "request_rejected",
        title: "Request Rejected",
        message: `Your request ${data.request_number} has been rejected: ${parsed.data.comment}`,
        relatedEntityType: "expense_request",
        relatedEntityId: id,
        email: employee?.email
          ? {
              to: employee.email,
              content: requestRejectedEmail({
                recipientName: employee.full_name,
                requestNumber: data.request_number,
                amount: formatMoney(Number(data.amount), data.currency || "USD"),
                reason: parsed.data.comment,
                url: appUrl ? `${appUrl}/requests/${id}` : undefined,
              }),
            }
          : undefined,
      })
    }

    return NextResponse.json({ data })
  } catch (err) {
    return serverError(err, { route: "requests.[id].reject" })
  }
}
