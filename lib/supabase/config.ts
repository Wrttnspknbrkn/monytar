/**
 * Supabase configuration helper.
 * Returns true when the required env vars are present,
 * allowing the app to use real Supabase — otherwise the
 * app falls back to the in-memory demo store.
 */

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set")
  return url
}

export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set")
  return key
}

/**
 * Decodes the `role` claim of a legacy Supabase JWT (anon / service_role key),
 * without verifying the signature — used only to sanity-check which kind of
 * key is present. Returns null for the new sb_secret_/sb_publishable_ key
 * format (not a JWT) or anything else that fails to parse.
 */
function decodeJwtRole(key: string): string | null {
  try {
    const [, payloadSegment] = key.split(".")
    if (!payloadSegment) return null
    const payload = JSON.parse(Buffer.from(payloadSegment, "base64").toString("utf8"))
    return typeof payload.role === "string" ? payload.role : null
  } catch {
    return null
  }
}

/**
 * Returns the Supabase service_role key, used for privileged server-side
 * operations (creating auth users, bypassing RLS during signup, etc).
 *
 * Some projects have accidentally saved SUPABASE_SERVICE_ROLE_KEY as a copy
 * of the anon key. If we detect that (legacy JWT with role "anon"), we fall
 * back to the `JWT` env var, which some Supabase setups populate with the
 * real service_role secret under that name. New-format keys
 * (sb_secret_.../sb_publishable_...) aren't JWTs and are trusted as-is.
 */
export function getSupabaseServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")

  const role = decodeJwtRole(key)
  if (role === "anon") {
    const fallback = process.env.JWT
    const fallbackRole = fallback ? decodeJwtRole(fallback) : null
    if (fallback && fallbackRole === "service_role") {
      return fallback
    }
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is set to the anon key, not the service_role key. " +
        "Copy the 'service_role' secret from Supabase Dashboard → Settings → API and update the env var.",
    )
  }

  return key
}

export const isDemoMode = (): boolean => !isSupabaseConfigured()
