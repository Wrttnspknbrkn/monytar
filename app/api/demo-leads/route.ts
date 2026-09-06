import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseConfigured, getSupabaseUrl, getSupabaseServiceKey } from "@/lib/supabase/config"
import { enforceRateLimit } from "@/lib/api/rate-limit"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

// Platform-admin allowlist for reading marketing leads (demo_leads has no
// organization_id — it's platform-wide, not per-tenant — so gating this on
// "any org's role=admin" would let one customer's admin read every other
// customer's leads. Configure a comma-separated PLATFORM_ADMIN_EMAILS env var
// to grant read access; unset means nobody can read it (fail closed).
function isPlatformAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  const allowlist = (process.env.PLATFORM_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allowlist.includes(email.toLowerCase())
}

const leadSchema = z.object({
  full_name: z.string().min(1).max(120),
  email: z.string().email().max(160),
  company_name: z.string().max(160).optional(),
  phone: z.string().max(40).optional(),
  entry_role: z.enum(["employee", "manager", "finance", "admin"]).default("employee"),
  country: z.string().max(80).optional(),
  device: z.string().max(40).optional(),
  browser: z.string().max(40).optional(),
  referrer: z.string().max(200).optional(),
  utm_source: z.string().max(120).optional(),
  utm_medium: z.string().max(120).optional(),
  utm_campaign: z.string().max(120).optional(),
})

function getClientIp(request: Request): string | undefined {
  const fwd = request.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]?.trim()
  return request.headers.get("x-real-ip") || undefined
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit("demoLead", getClientIp(request) || "unknown")
  if (limited) return limited

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = leadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  // Country can be provided by the edge/CDN where available.
  const country =
    parsed.data.country ||
    request.headers.get("x-vercel-ip-country") ||
    undefined

  // In demo mode there is no database. The client persists the lead in
  // its local sandbox store, so we acknowledge success without writing.
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, demo: true })
  }

  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from("demo_leads")
      .insert({
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        company_name: parsed.data.company_name,
        phone: parsed.data.phone,
        entry_role: parsed.data.entry_role,
        country,
        device: parsed.data.device,
        browser: parsed.data.browser,
        referrer: parsed.data.referrer,
        utm_source: parsed.data.utm_source,
        utm_medium: parsed.data.utm_medium,
        utm_campaign: parsed.data.utm_campaign,
        ip_address: getClientIp(request),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, lead: data })
  } catch (error) {
    console.error("Error saving demo lead:", error)
    // Never block the demo experience on a persistence failure.
    return NextResponse.json({ success: true, persisted: false })
  }
}

export async function GET() {
  // Demo mode: leads live in the visitor's local sandbox store.
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ leads: [] })
  }

  try {
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only platform admins may read demo leads — NOT just any org's admin,
    // since this table has no organization_id and holds every visitor's
    // contact info across every tenant. See isPlatformAdminEmail() above.
    if (!isPlatformAdminEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // demo_leads intentionally has no SELECT RLS policy (nobody should read
    // it through the normal per-tenant client) — read it with the admin
    // client now that we've independently verified the caller is a
    // configured platform admin above.
    const admin = createClient(getSupabaseUrl(), getSupabaseServiceKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: leads, error } = await admin
      .from("demo_leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000)

    if (error) throw error

    return NextResponse.json({ leads })
  } catch (error) {
    console.error("Error fetching demo leads:", error)
    return NextResponse.json({ error: "Failed to fetch demo leads" }, { status: 500 })
  }
}
