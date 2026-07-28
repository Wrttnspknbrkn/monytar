import { NextResponse } from "next/server"
import { receiptRecordSchema } from "@/lib/validations"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { authorize } from "@/lib/api/authorize"
import { getReceiptSignedUrl } from "@/lib/receipts/storage"

// POST /api/receipts
// Records a receipt row after the file has been uploaded to storage.
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = receiptRecordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true, success: true })
    }

    const { actor, response } = await authorize()
    if (response) return response
    const { supabase, userId, organizationId } = actor

    // Verify the target request belongs to the caller's organization.
    const { data: expenseRequest } = await supabase
      .from("expense_requests")
      .select("id")
      .eq("id", parsed.data.expense_request_id)
      .eq("organization_id", organizationId)
      .single()

    if (!expenseRequest) {
      return NextResponse.json(
        { error: "Request not found or not in your organization" },
        { status: 403 },
      )
    }

    // The uploaded object's path prefix must match the caller's org (defense-in-depth).
    if (!parsed.data.file_path.startsWith(`${organizationId}/`)) {
      return NextResponse.json({ error: "Invalid receipt path" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("receipts")
      .insert({
        organization_id: organizationId,
        expense_request_id: parsed.data.expense_request_id,
        file_url: parsed.data.file_path,
        file_name: parsed.data.file_name,
        file_type: parsed.data.file_type,
        file_size: parsed.data.file_size,
        uploaded_by: userId,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ receipt: data }, { status: 201 })
  } catch (err) {
    console.error("[Receipts] record error:", err)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

// GET /api/receipts?request_id=<uuid>
// Lists receipts for a request, each with a short-lived signed view URL.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get("request_id")

    if (!requestId) {
      return NextResponse.json({ error: "request_id is required" }, { status: 400 })
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true, receipts: [] })
    }

    const { actor, response } = await authorize()
    if (response) return response
    const { supabase, organizationId } = actor

    const { data: receipts, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("expense_request_id", requestId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Attach a signed URL to each receipt for viewing/downloading.
    const withUrls = await Promise.all(
      (receipts || []).map(async (r) => ({
        ...r,
        signed_url: await getReceiptSignedUrl(r.file_url),
      })),
    )

    return NextResponse.json({ receipts: withUrls })
  } catch (err) {
    console.error("[Receipts] list error:", err)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
