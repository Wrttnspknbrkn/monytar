import { NextResponse } from "next/server"
import { expenseRequestSchema } from "@/lib/validations"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { loadApprovalSettings } from "@/lib/approvals/settings"
import { shouldAutoApprove } from "@/lib/approvals/engine"
import { serverError } from "@/lib/api/errors"
import { clampLimit, decodeCursor, buildPage } from "@/lib/api/pagination"

export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true, message: "Using demo data from client store" })
    }

    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const url = new URL(request.url)
    const status = url.searchParams.get("status")
    const limit = clampLimit(url.searchParams.get("limit"))
    const cursor = decodeCursor(url.searchParams.get("cursor"))

    // Keyset pagination: order by (created_at, id) DESC and fetch limit+1 rows
    // to detect whether another page exists. No OFFSET, no count: "exact".
    let query = supabase
      .from("expense_requests")
      .select("*, employee:users!employee_id(full_name, email), vendor:vendors(name), department:departments(name)")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1)

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    // Fetch rows strictly "after" the cursor in the composite ordering.
    if (cursor) {
      query = query.or(
        `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`,
      )
    }

    const { data, error } = await query

    if (error) return serverError(error, { route: "requests.GET" })

    const { items, nextCursor } = buildPage(data ?? [], limit)

    return NextResponse.json({ data: items, nextCursor, limit })
  } catch (err) {
    return serverError(err, { route: "requests.GET" })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = expenseRequestSchema.safeParse(body)

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

    // Get user's org and next request number
    const { data: dbUser } = await supabase.from("users").select("organization_id, department_id").eq("id", user.id).single()
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Race-safe, per-org request number via the atomic RPC (migration 008).
    // Falls back to a count-based number if the function isn't present yet.
    let requestNumber: string
    const { data: rpcNumber, error: rpcError } = await supabase.rpc("next_request_number", {
      org: dbUser.organization_id,
    })
    if (!rpcError && rpcNumber) {
      requestNumber = rpcNumber as string
    } else {
      const { count } = await supabase
        .from("expense_requests")
        .select("id", { count: "exact" })
        .eq("organization_id", dbUser.organization_id)
      requestNumber = `REQ-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(5, "0")}`
    }

    // as_draft is a client intent signal, not a column — the server alone
    // decides the real status.
    const { as_draft, ...requestFields } = parsed.data
    const now = new Date().toISOString()

    let status: string
    let approvedAt: string | null = null
    let managerComment: string | null = null
    let autoApprove = false

    if (as_draft) {
      status = "draft"
    } else {
      // Apply the org's auto-approval policy: sub-threshold amounts skip review.
      const settings = await loadApprovalSettings(supabase, dbUser.organization_id)
      autoApprove = shouldAutoApprove(parsed.data.amount, settings)
      status = autoApprove ? "approved" : "pending"
      approvedAt = autoApprove ? now : null
      managerComment = autoApprove ? "Auto-approved: amount below approval threshold." : null
    }

    const { data, error } = await supabase.from("expense_requests").insert({
      ...requestFields,
      organization_id: dbUser.organization_id,
      employee_id: user.id,
      department_id: parsed.data.department_id || dbUser.department_id,
      request_number: requestNumber,
      status,
      approved_at: approvedAt,
      manager_comment: managerComment,
      submitted_at: as_draft ? null : now,
      payment_status: "unpaid",
    }).select().single()

    if (error) return serverError(error, { route: "requests.POST" })

    return NextResponse.json({ data, auto_approved: autoApprove }, { status: 201 })
  } catch (err) {
    return serverError(err, { route: "requests.POST" })
  }
}
