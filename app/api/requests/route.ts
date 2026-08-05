import { NextResponse } from "next/server"
import { expenseRequestSchema } from "@/lib/validations"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { loadApprovalSettings } from "@/lib/approvals/settings"
import { shouldAutoApprove } from "@/lib/approvals/engine"

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
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const offset = (page - 1) * limit

    let query = supabase
      .from("expense_requests")
      .select("*, employee:users!employee_id(full_name, email), vendor:vendors(name), department:departments(name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error, count } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data, total: count, page, limit })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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

    // receipt_urls is not a column on expense_requests — receipts are stored as
    // separate rows via /api/receipts. Strip it from the insert payload.
    const { receipt_urls, ...requestFields } = parsed.data

    // Apply the org's auto-approval policy: sub-threshold amounts skip review.
    const settings = await loadApprovalSettings(supabase, dbUser.organization_id)
    const autoApprove = shouldAutoApprove(parsed.data.amount, settings)
    const now = new Date().toISOString()

    const { data, error } = await supabase.from("expense_requests").insert({
      ...requestFields,
      organization_id: dbUser.organization_id,
      employee_id: user.id,
      department_id: parsed.data.department_id || dbUser.department_id,
      request_number: requestNumber,
      status: autoApprove ? "approved" : "pending",
      approved_at: autoApprove ? now : null,
      manager_comment: autoApprove ? "Auto-approved: amount below approval threshold." : null,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data, auto_approved: autoApprove }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
