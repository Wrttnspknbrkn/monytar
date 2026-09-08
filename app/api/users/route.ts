import { NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ demo: true, message: "Using demo mode - data served from client store" })
  }

  try {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server")
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase.from("users").select("organization_id, role").eq("id", user.id).single()
    if (!profile || !["admin", "finance"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// There is deliberately no POST here. A real, login-capable user can only be
// created via a Supabase Auth admin call (service-role), which a plain insert
// into `users` can't do — `users.id` is a foreign key into `auth.users` with
// no default, so this always failed with an FK violation and was never
// reachable from any UI. Real user creation goes through /api/invitations
// (creates an invitation, the invitee accepts via /api/auth/accept-invitation,
// which does the actual auth.admin.createUser() call).
