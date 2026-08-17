import { NextResponse } from "next/server"
import { loginSchema } from "@/lib/validations"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { enforceRateLimit, getClientIp } from "@/lib/api/rate-limit"
import { serverError } from "@/lib/api/errors"

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

    // Throttle brute-force attempts per IP + email pair.
    const limited = await enforceRateLimit("login", `${getClientIp(request)}:${email.toLowerCase()}`)
    if (limited) return limited

    if (!isSupabaseConfigured()) {
      // Demo mode — accept any mock user email with any password
      return NextResponse.json({ success: true, demo: true, email })
    }

    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Generic message avoids account enumeration (invalid email vs. password).
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    return NextResponse.json({ success: true, user: data.user })
  } catch (err) {
    return serverError(err, { route: "auth.login" })
  }
}
