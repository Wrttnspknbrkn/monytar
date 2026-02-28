import { NextResponse } from "next/server"
import { loginSchema } from "@/lib/validations"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    if (!isSupabaseConfigured()) {
      // Demo mode — accept any mock user email with any password
      return NextResponse.json({ success: true, demo: true, email })
    }

    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ success: true, user: data.user })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
