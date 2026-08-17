import { NextResponse } from "next/server"
import { approvalSchema } from "@/lib/validations"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { authorize } from "@/lib/api/authorize"
import { serverError } from "@/lib/api/errors"
import { captureException } from "@/lib/observability/capture"
import { computeBudgetStatus, budgetLevelToAlertType } from "@/lib/budgets/calc"
import { notify } from "@/lib/notifications/service"
import { requestApprovedEmail } from "@/lib/notifications/templates"
import { formatMoney } from "@/lib/currency"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = approvalSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true, success: true })
    }

    // Only managers, finance, and admins may approve.
    const { actor, response } = await authorize(["manager", "finance", "admin"])
    if (response) return response
    const { supabase, userId, organizationId, departmentId, role } = actor

    const now = new Date().toISOString()

    let updateQuery = supabase
      .from("expense_requests")
      .update({
        status: "approved",
        approved_by: userId,
        approved_at: now,
        manager_comment: parsed.data.comment || null,
      })
      .eq("id", id)
      .eq("status", "pending")
      // Defense-in-depth: never act on another tenant's data.
      .eq("organization_id", organizationId)

    // Managers may only approve requests within their own department.
    if (role === "manager") {
      updateQuery = updateQuery.eq("department_id", departmentId)
    }

    const { data, error } = await updateQuery.select().single()

    if (error && error.code === "PGRST116") {
      // No matching row: wrong tenant/department, not pending, or not found.
      return NextResponse.json(
        { error: "Request not found or you are not authorized to approve it" },
        { status: 403 },
      )
    }
    if (error) return serverError(error, { route: "requests.[id].approve", id })

    // Update approval workflow
    await supabase
      .from("approval_workflows")
      .update({ status: "approved", comment: parsed.data.comment, actioned_at: now })
      .eq("expense_request_id", id)
      .eq("status", "pending")

    // Notify the requester (in-app + best-effort email).
    if (data) {
      const { data: employee } = await supabase
        .from("users")
        .select("email, full_name")
        .eq("id", data.employee_id)
        .single()
      const { data: approver } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", userId)
        .single()

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
      await notify(supabase, {
        organizationId: data.organization_id,
        userId: data.employee_id,
        type: "request_approved",
        title: "Request Approved",
        message: `Your request ${data.request_number} has been approved`,
        relatedEntityType: "expense_request",
        relatedEntityId: id,
        email: employee?.email
          ? {
              to: employee.email,
              content: requestApprovedEmail({
                recipientName: employee.full_name,
                requestNumber: data.request_number,
                amount: formatMoney(Number(data.amount), data.currency || "USD"),
                approverName: approver?.full_name,
                url: appUrl ? `${appUrl}/requests/${id}` : undefined,
              }),
            }
          : undefined,
      })
    }

    // Best-effort budget alerting: recompute department spend and raise an alert
    // if the newly-approved amount pushes the department past a threshold.
    if (data?.department_id) {
      try {
        const [{ data: dept }, { data: spendRows }] = await Promise.all([
          supabase
            .from("departments")
            .select("budget_amount")
            .eq("id", data.department_id)
            .single(),
          supabase
            .from("expense_requests")
            .select("amount")
            .eq("department_id", data.department_id)
            .in("status", ["approved", "paid"]),
        ])

        const spend = (spendRows ?? []).reduce((sum, r) => sum + Number(r.amount || 0), 0)
        const status = computeBudgetStatus(spend, Number(dept?.budget_amount || 0))
        const alertType = budgetLevelToAlertType(status.level)

        if (alertType) {
          await supabase.from("budget_alerts").insert({
            organization_id: data.organization_id,
            department_id: data.department_id,
            alert_type: alertType, // 'approaching_limit' | 'over_budget'
            threshold_percentage: status.percentage,
            message: `Department spend is at ${status.percentage}% of budget after approving ${data.request_number}.`,
          })
        }
      } catch (err) {
        // Non-fatal: log but never fail the approval over a best-effort alert.
        void captureException(err, { route: "requests.[id].approve", stage: "budget-alert" })
      }
    }

    return NextResponse.json({ data })
  } catch (err) {
    return serverError(err, { route: "requests.[id].approve" })
  }
}
