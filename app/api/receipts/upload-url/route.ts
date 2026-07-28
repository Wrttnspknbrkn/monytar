import { NextResponse } from "next/server"
import { receiptUploadUrlSchema } from "@/lib/validations"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { authorize } from "@/lib/api/authorize"
import { buildReceiptPath, createReceiptUploadTarget } from "@/lib/receipts/storage"

// POST /api/receipts/upload-url
// Returns a short-lived signed URL the client uses to upload a receipt file
// directly to storage. The storage path is scoped to the caller's organization.
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = receiptUploadUrlSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    if (!isSupabaseConfigured()) {
      // Demo mode: hand back a fake path so the UI flow can proceed.
      return NextResponse.json({
        demo: true,
        path: `demo/${parsed.data.expense_request_id}/${parsed.data.file_name}`,
        token: "demo-token",
        signedUrl: "https://example.com/demo-upload",
      })
    }

    const { actor, response } = await authorize()
    if (response) return response
    const { supabase, organizationId } = actor

    // The request must exist and belong to the caller's organization.
    const { data: expenseRequest } = await supabase
      .from("expense_requests")
      .select("id, organization_id, employee_id")
      .eq("id", parsed.data.expense_request_id)
      .eq("organization_id", organizationId)
      .single()

    if (!expenseRequest) {
      return NextResponse.json(
        { error: "Request not found or you are not authorized to attach receipts to it" },
        { status: 403 },
      )
    }

    const path = buildReceiptPath(organizationId, parsed.data.expense_request_id, parsed.data.file_name)
    const target = await createReceiptUploadTarget(path)

    if (!target) {
      return NextResponse.json({ error: "Could not create upload URL" }, { status: 500 })
    }

    return NextResponse.json(target)
  } catch (err) {
    console.error("[Receipts] upload-url error:", err)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
