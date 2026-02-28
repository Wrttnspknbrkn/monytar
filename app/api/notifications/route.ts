import { NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ demo: true, message: "Using demo mode" })
  }

  try {
    const { createServerClient } = await import("@/lib/supabase/server")
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
