import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseUrl, getSupabaseAnonKey, isSupabaseConfigured } from "./config"

/**
 * Creates a Supabase server client using cookie-based auth.
 * For use in Server Components, Server Actions, and Route Handlers.
 */
export async function getSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Use demo mode instead.")
  }

  const cookieStore = await cookies()

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Can't set cookies in Server Components — that's OK
        }
      },
    },
  })
}
