import { NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { userSchema } from "@/lib/validations"

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

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ demo: true, message: "Demo mode - users managed client-side" })
  }

  try {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server")
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase.from("users").select("organization_id, role").eq("id", user.id).single()
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Only admins can create users" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = userSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from("users")
      .insert({ ...parsed.data, organization_id: profile.organization_id })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
