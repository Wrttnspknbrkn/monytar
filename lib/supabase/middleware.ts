import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseUrl, getSupabaseAnonKey, isSupabaseConfigured } from "./config"

type CookieToSet = { name: string; value: string; options?: CookieOptions }

/**
 * Refreshes the Supabase auth session on each request and
 * returns the (possibly updated) response with fresh cookies.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  if (!isSupabaseConfigured()) {
    return supabaseResponse
  }

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Refresh session — do NOT remove this
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes — redirect unauthenticated users
  const protectedPaths = ["/dashboard", "/requests", "/approvals", "/vendors", "/departments", "/users", "/reports", "/settings", "/notifications", "/demo-leads"]
  const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p))

  // Demo mode is always accessible without auth
  const isDemo = request.nextUrl.pathname === "/demo" || request.cookies.get("demo_mode")?.value === "true"

  if (isProtected && !user && !isDemo) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login/signup (but allow demo page)
  const authPaths = ["/login", "/signup"]
  const isAuthPage = authPaths.some((p) => request.nextUrl.pathname === p)

  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  // Onboarding page requires authentication but not completed onboarding
  if (request.nextUrl.pathname === "/onboarding" && !user && !isDemo) {
    const url = request.nextUrl.clone()
    url.pathname = "/signup"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
