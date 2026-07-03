import { NextResponse } from "next/server"
import { z } from "zod"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { enforceRateLimit, getClientIp } from "@/lib/api/rate-limit"

const resetSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().url().optional(),
})

export async function POST(request: Request) {
  try {
    // Throttle reset requests per IP to prevent enumeration / email bombing.
    const limited = await enforceRateLimit("passwordReset", getClientIp(request))
    if (limited) return limited

    const body = await request.json()
    const parsed = resetSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { email, redirectTo } = parsed.data

    // Always return success to avoid leaking which emails have accounts.
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, demo: true })
    }

    const supabase = await getSupabaseServerClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    })

    return NextResponse.json({ success: true })
  } catch {
    // Still return success shape to avoid enumeration; log server-side.
    return NextResponse.json({ success: true })
  }
}
