import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { RECEIPTS_BUCKET, validateReceiptMeta } from "@/lib/receipts/shared"

export { RECEIPTS_BUCKET, MAX_RECEIPT_BYTES, ALLOWED_RECEIPT_TYPES } from "@/lib/receipts/shared"

export function validateReceiptFile(file: File): string | null {
  return validateReceiptMeta(file.type, file.size)
}

/**
 * Full production upload flow for a single receipt:
 *   1. ask the server for a signed upload target (org-scoped path)
 *   2. upload the bytes directly to storage using the signed token
 *   3. record the receipt row
 * Returns the created receipt (or throws on failure).
 */
export async function uploadReceipt(expenseRequestId: string, file: File) {
  const urlRes = await fetch("/api/receipts/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      expense_request_id: expenseRequestId,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    }),
  })

  const target = await urlRes.json()
  if (!urlRes.ok) {
    throw new Error(target.error || "Could not start upload")
  }

  // Demo mode short-circuit: nothing is actually stored.
  if (target.demo) {
    return { demo: true as const, file_name: file.name }
  }

  const supabase = getSupabaseBrowserClient()
  const { error: uploadError } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .uploadToSignedUrl(target.path, target.token, file)

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const recordRes = await fetch("/api/receipts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      expense_request_id: expenseRequestId,
      file_path: target.path,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    }),
  })

  const recorded = await recordRes.json()
  if (!recordRes.ok) {
    throw new Error(recorded.error || "Could not record receipt")
  }
  return recorded.receipt
}

/** Uploads several receipts, resolving once all have completed. */
export async function uploadReceipts(expenseRequestId: string, files: File[]) {
  return Promise.all(files.map((f) => uploadReceipt(expenseRequestId, f)))
}
