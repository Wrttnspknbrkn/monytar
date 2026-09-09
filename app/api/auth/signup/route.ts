import { NextResponse } from "next/server"
import { signupSchema } from "@/lib/validations"
import { isSupabaseConfigured, getSupabaseUrl, getSupabaseServiceKey } from "@/lib/supabase/config"
import { createClient } from "@supabase/supabase-js"
import { enforceRateLimit, getClientIp } from "@/lib/api/rate-limit"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getTierLimits } from "@/lib/products"
import { sendEmail } from "@/lib/notifications/email"
import { confirmEmailEmail } from "@/lib/notifications/templates"

// Use service role for admin operations
function getAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceKey(), {
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

    const { fullName, email, password, orgName, tier } = parsed.data
    const isPaidTier = tier !== "free"
    const { maxUsers } = getTierLimits(tier)

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, demo: true, email })
    }

    // Supabase is configured for the browser, but creating an org + admin user
    // requires a valid service_role key on the server (getAdminClient throws a
    // clear, actionable error below if it's missing or misconfigured).
    const supabase = getAdminClient()

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create the auth user via generateLink rather than admin.createUser with
    // email_confirm: true. That flag used to auto-confirm every signup
    // regardless of whether the caller actually owns the address — anyone
    // could occupy any email (users.email is UNIQUE, so the real owner is
    // then permanently locked out of signing up with their own address).
    // generateLink both creates the (unconfirmed) user AND returns the exact
    // confirmation link Supabase would otherwise only email on its own via
    // the client-side signUp() path — we send it ourselves below so it goes
    // through the same Resend transport as invitations.
    const { data: linkData, error: authError } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        data: { full_name: fullName },
        redirectTo: `${appUrl}/verify-email`,
      },
    })

    if (authError) {
      console.error("[v0] auth user creation failed:", JSON.stringify({ message: authError.message, code: authError.code, status: authError.status }))
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!linkData?.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    const authData = { user: linkData.user }
    const confirmationUrl = linkData.properties?.action_link

    // Generate organization slug from name
    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      + "-" + Date.now().toString(36)

    // Create organization. Paid tiers land here as "trialing", matching the
    // 14-day no-card-required trial already configured in
    // createCheckoutSession (app/actions/stripe.ts) — the org gets that
    // tier's limits immediately, and the Stripe webhook
    // (checkout.session.completed) flips subscription_status to "active"
    // once the trial converts or payment is collected.
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: orgName,
        slug,
        subscription_tier: tier,
        subscription_status: isPaidTier ? "trialing" : "active",
        max_users: maxUsers,
      })
      .select()
      .single()

    if (orgError) {
      console.error("[v0] org insert failed:", JSON.stringify({ message: orgError.message, code: orgError.code, details: orgError.details, hint: orgError.hint }))
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
      console.error("[v0] user profile insert failed:", JSON.stringify({ message: userError.message, code: userError.code, details: userError.details, hint: userError.hint }))
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

    // Send the confirmation email (best-effort; gracefully no-ops without
    // RESEND_API_KEY, same as invitations — see emailSent/confirmationUrl below).
    const emailResult = confirmationUrl
      ? await sendEmail(email, confirmEmailEmail({ fullName, url: confirmationUrl }))
      : { sent: false }

    // Attempt to establish a browser session immediately. Whether this
    // actually succeeds now depends on the Supabase project's "Confirm
    // email" setting (Authentication → Providers → Email): if it's on,
    // sign-in correctly fails until the link above is clicked; if it's off,
    // the account is usable right away regardless of what this route does —
    // that enforcement lives in Supabase project config, not here.
    const sessionClient = await getSupabaseServerClient()
    const { error: signInError } = await sessionClient.auth.signInWithPassword({ email, password })

    if (signInError) {
      console.error("[v0] post-signup sign-in pending (likely awaiting email confirmation):", JSON.stringify({ message: signInError.message, code: signInError.code, status: signInError.status }))
    }

    return NextResponse.json({
      success: true,
      user: authData.user,
      organization: org,
      signedIn: !signInError,
      emailSent: emailResult.sent,
      // Returned for development so signup works end-to-end before email is
      // configured — never expose this in a real deployment's response.
      confirmationUrl: !emailResult.sent ? confirmationUrl : undefined,
      tier,
      // Paid tiers still need to complete Stripe Checkout — the account and
      // org exist either way, but the client should route to checkout next
      // instead of straight to the dashboard.
      requiresCheckout: isPaidTier,
    })
  } catch (error) {
    console.error("[v0] Signup error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    // Config errors (missing/misconfigured Supabase env vars) are actionable —
    // surface them as-is instead of a generic 500 so setup mistakes are obvious.
    const isConfigError = error instanceof Error && /SUPABASE_|service_role/i.test(error.message)
    return NextResponse.json(
      { error: isConfigError ? message : "Internal server error" },
      { status: 500 },
    )
  }
}
