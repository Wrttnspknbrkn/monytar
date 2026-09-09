import "server-only"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export { LOGOS_BUCKET, MAX_LOGO_BYTES, ALLOWED_LOGO_TYPES, isAllowedLogoType, buildLogoPath, validateLogoMeta } from "@/lib/logo/shared"

import { LOGOS_BUCKET } from "@/lib/logo/shared"

export type LogoUploadTarget = {
  path: string
  token: string
  signedUrl: string
}

/** Creates a signed URL the client can PUT the file to directly (no bytes through our server). */
export async function createLogoUploadTarget(path: string): Promise<LogoUploadTarget | null> {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.storage
    .from(LOGOS_BUCKET)
    .createSignedUploadUrl(path, { upsert: true })

  if (error || !data) {
    console.error("[Logo] createSignedUploadUrl error:", error?.message)
    return null
  }
  return { path: data.path, token: data.token, signedUrl: data.signedUrl }
}

/** The bucket is public — this is a plain constructed URL, no signing/network call. */
export async function getLogoPublicUrl(path: string): Promise<string> {
  const supabase = await getSupabaseServerClient()
  const { data } = supabase.storage.from(LOGOS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/** Removes a logo object from storage. */
export async function deleteLogoObject(path: string): Promise<boolean> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.storage.from(LOGOS_BUCKET).remove([path])
  if (error) {
    console.error("[Logo] remove error:", error.message)
    return false
  }
  return true
}
