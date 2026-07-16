import { NextResponse } from "next/server"
import { signupSchema } from "@/lib/validations"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { createClient } from "@supabase/supabase-js"
import { enforceRateLimit, getClientIp } from "@/lib/api/rate-limit"

// Use service role for admin operations
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    throw new Error("Supabase admin credentials not configured")
  }
  
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: Request) {
  try {
    const limited = await enforceRateLimit("signup", getClientIp(request))
    if (limited) return limited

    const body = await request.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { fullName, email, password, orgName } = parsed.data

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, demo: true, email })
    }

    const supabase = getAdminClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for now
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Generate organization slug from name
    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      + "-" + Date.now().toString(36)

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: orgName,
        slug,
        subscription_tier: "free",
        subscription_status: "active",
        max_users: 5,
      })
      .select()
      .single()

    if (orgError) {
      // Clean up: delete the auth user if org creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: "Failed to create organization" }, { status: 500 })
    }

    // Create organization settings
    await supabase
      .from("organization_settings")
      .insert({
        organization_id: org.id,
        default_currency: "USD",
        require_receipts: true,
        receipt_required_above_amount: 25,
        require_manager_approval: true,
        require_finance_approval: true,
        auto_approve_under_amount: 100,
      })

    // Create user record with admin role
    const { error: userError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        organization_id: org.id,
        email,
        full_name: fullName,
        role: "admin",
        is_active: true,
      })

    if (userError) {
      // Clean up
      await supabase.from("organizations").delete().eq("id", org.id)
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
    }

    // Create default department
    await supabase
      .from("departments")
      .insert({
        organization_id: org.id,
        name: "General",
        budget_amount: 10000,
        budget_period: "monthly",
        is_active: true,
      })

    return NextResponse.json({ 
      success: true, 
      user: authData.user,
      organization: org,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
