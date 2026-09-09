import { NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { authorize } from "@/lib/api/authorize"
import { serverError } from "@/lib/api/errors"
import { loadApprovalSettings } from "@/lib/approvals/settings"
import { shouldAutoApprove, isReceiptRequired } from "@/lib/approvals/engine"

// POST /api/requests/[id]/submit
// Moves a request the caller owns from draft (or rejected — a resubmission)
// into the real approval workflow: pending, or auto-approved if it's under
// the org's threshold. This is the missing other half of drafts — until now
// "Save as Draft" was a one-way door (audit P2-10): no edit form, no way to
// ever move it forward, so it had to be recreated from scratch.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true, success: true })
    }

    const { actor, response } = await authorize()
    if (response) return response
    const { supabase, userId, organizationId } = actor

    const { data: existing } = await supabase
      .from("expense_requests")
      .select("id, amount, status, employee_id, organization_id")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .eq("employee_id", userId)
      .in("status", ["draft", "rejected"])
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: "Request not found, not yours, or already submitted" },
        { status: 404 },
      )
    }

    const settings = await loadApprovalSettings(supabase, organizationId)

    // Same receipt-threshold enforcement as fresh creation (POST /api/requests)
    // — a draft can sit unsubmitted with no receipt, but can't be submitted
    // past the org's threshold without one, closing the same gap for the
    // resubmit path.
    if (isReceiptRequired(Number(existing.amount), settings)) {
      const { count } = await supabase
        .from("receipts")
        .select("id", { count: "exact", head: true })
        .eq("expense_request_id", id)
      if (!count) {
        return NextResponse.json(
          { error: `A receipt is required for expenses of ${settings.receipt_required_above_amount} or more. Attach one before submitting.` },
          { status: 400 },
        )
      }
    }

    const autoApprove = shouldAutoApprove(Number(existing.amount), settings)
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("expense_requests")
      .update({
        status: autoApprove ? "approved" : "pending",
        approved_at: autoApprove ? now : null,
        manager_comment: autoApprove ? "Auto-approved: amount below approval threshold." : null,
        submitted_at: now,
      })
      .eq("id", id)
      .eq("employee_id", userId)
      .in("status", ["draft", "rejected"])
      .select()
      .single()

    if (error) return serverError(error, { route: "requests.[id].submit", id })

    return NextResponse.json({ data, auto_approved: autoApprove })
  } catch (err) {
    return serverError(err, { route: "requests.[id].submit" })
  }
}
