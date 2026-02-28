import { NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, demo: true })
    }

    const supabase = await getSupabaseServerClient()
    await supabase.auth.signOut()

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
