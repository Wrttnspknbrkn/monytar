import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { LOGOS_BUCKET, validateLogoMeta } from "@/lib/logo/shared"

export { MAX_LOGO_BYTES, ALLOWED_LOGO_TYPES } from "@/lib/logo/shared"

export function validateLogoFile(file: File): string | null {
  return validateLogoMeta(file.type, file.size)
}

/**
 * Full upload flow for the organization logo, mirroring lib/receipts/client.ts:
 *   1. ask the server for a signed upload target (org-scoped, admin-only)
 *   2. upload the bytes directly to storage using the signed token
 *   3. tell the server to record the resulting public URL on the org
 * Returns the new logo_url (or throws on failure).
 */
export async function uploadOrgLogo(file: File): Promise<string | null> {
  const urlRes = await fetch("/api/logo/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_name: file.name, file_type: file.type, file_size: file.size }),
  })

  const target = await urlRes.json()
  if (!urlRes.ok) {
    throw new Error(target.error || "Could not start upload")
  }

  if (target.demo) {
    return null
  }

  const supabase = getSupabaseBrowserClient()
  const { error: uploadError } = await supabase.storage
    .from(LOGOS_BUCKET)
    .uploadToSignedUrl(target.path, target.token, file, { upsert: true })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const recordRes = await fetch("/api/logo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_path: target.path }),
  })
  const recorded = await recordRes.json()
  if (!recordRes.ok) {
    throw new Error(recorded.error || "Could not save logo")
  }
  return recorded.logo_url as string
}

export async function removeOrgLogo(): Promise<void> {
  const res = await fetch("/api/logo", { method: "DELETE" })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error || "Could not remove logo")
}
