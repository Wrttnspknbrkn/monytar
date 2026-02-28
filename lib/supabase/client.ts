import { createBrowserClient } from "@supabase/ssr"
import { getSupabaseUrl, getSupabaseAnonKey, isSupabaseConfigured } from "./config"

let client: ReturnType<typeof createBrowserClient> | null = null

/**
 * Returns a Supabase browser client (singleton).
 * Only call this when isSupabaseConfigured() is true.
 */
export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Use demo mode instead.")
  }
  if (!client) {
    client = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey())
  }
  return client
}
