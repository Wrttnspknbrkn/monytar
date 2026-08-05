import "server-only"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export {
  RECEIPTS_BUCKET,
  MAX_RECEIPT_BYTES,
  ALLOWED_RECEIPT_TYPES,
  isAllowedReceiptType,
  sanitizeFileName,
  buildReceiptPath,
} from "@/lib/receipts/shared"

import { RECEIPTS_BUCKET } from "@/lib/receipts/shared"

export type ReceiptUploadTarget = {
  path: string
  token: string
  signedUrl: string
}

/** Creates a signed URL the client can PUT the file to directly (no bytes through our server). */
export async function createReceiptUploadTarget(path: string): Promise<ReceiptUploadTarget | null> {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUploadUrl(path)

  if (error || !data) {
    console.error("[Receipts] createSignedUploadUrl error:", error?.message)
    return null
  }
  return { path: data.path, token: data.token, signedUrl: data.signedUrl }
}

/** Generates a short-lived signed URL to view/download a stored receipt. */
export async function getReceiptSignedUrl(path: string, expiresIn = 60 * 30): Promise<string | null> {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(path, expiresIn)

  if (error || !data) {
    console.error("[Receipts] createSignedUrl error:", error?.message)
    return null
  }
  return data.signedUrl
}

/** Removes a receipt object from storage. */
export async function deleteReceiptObject(path: string): Promise<boolean> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.storage.from(RECEIPTS_BUCKET).remove([path])
  if (error) {
    console.error("[Receipts] remove error:", error.message)
    return false
  }
  return true
}
