import { NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { authorize } from "@/lib/api/authorize"
import { deleteReceiptObject } from "@/lib/receipts/storage"

// DELETE /api/receipts/[id]
// Removes a receipt (storage object + row). Allowed for the uploader or admin/finance.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true, success: true })
    }

    const { actor, response } = await authorize()
    if (response) return response
    const { supabase, userId, organizationId, role } = actor

    const { data: receipt } = await supabase
      .from("receipts")
      .select("id, file_url, uploaded_by, organization_id")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single()

    if (!receipt) {
      return NextResponse.json({ error: "Receipt not found" }, { status: 404 })
    }

    const isPrivileged = role === "admin" || role === "finance"
    if (receipt.uploaded_by !== userId && !isPrivileged) {
      return NextResponse.json(
        { error: "You are not authorized to delete this receipt" },
        { status: 403 },
      )
    }

    // Remove the stored object first, then the row.
    await deleteReceiptObject(receipt.file_url)

    const { error } = await supabase.from("receipts").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[Receipts] delete error:", err)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
