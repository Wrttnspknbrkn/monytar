import { NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { serverError } from "@/lib/api/errors"
import { expenseRequestSchema } from "@/lib/validations"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true, id })
    }

    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("expense_requests")
      .select("*, employee:users!employee_id(*), vendor:vendors(*), department:departments(*), receipts(*), approval_workflows(*)")
      .eq("id", id)
      .single()

    if (error) return NextResponse.json({ error: "Request not found" }, { status: 404 })

    return NextResponse.json({ data })
  } catch (err) {
    return serverError(err, { route: "requests.[id].GET" })
  }
}

// Business-field edits only — status transitions (approve/reject/pay/resubmit)
// must go through their dedicated endpoints, which apply the real workflow
// rules (department scoping, no self-approval, valid status transitions).
// RLS also scopes this to the caller's own draft or an admin/finance/manager
// in their org, but that alone doesn't stop a privileged role from writing
// straight to `status: "approved"` here — the allowlist below closes that.
const patchableFields = expenseRequestSchema.partial().omit({ as_draft: true })

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true, success: true })
    }

    const parsed = patchableFields.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("expense_requests")
      .update(parsed.data)
      .eq("id", id)
      .select()
      .single()

    if (error) return serverError(error, { route: "requests.[id].PATCH", id })

    return NextResponse.json({ data })
  } catch (err) {
    return serverError(err, { route: "requests.[id].PATCH" })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true, success: true })
    }

    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // No RLS DELETE policy exists for expense_requests by design (deleting a
    // request is unsupported product-wise) — report that honestly instead of
    // claiming success when RLS silently affects 0 rows.
    const { data, error } = await supabase.from("expense_requests").delete().eq("id", id).select().maybeSingle()
    if (error) return serverError(error, { route: "requests.[id].DELETE", id })
    if (!data) return NextResponse.json({ error: "Request not found or you are not authorized to delete it" }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return serverError(err, { route: "requests.[id].DELETE" })
  }
}
