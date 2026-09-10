import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { enforceRateLimit, getClientIp } from "@/lib/api/rate-limit"
import { getTierLimits, normalizeLimit } from "@/lib/products"
import { getSupabaseUrl, getSupabaseServiceKey } from "@/lib/supabase/config"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/notifications/email"
import { confirmEmailEmail } from "@/lib/notifications/templates"
import type { SubscriptionTier } from "@/lib/types"

const acceptSchema = z.object({
  token: z.string().min(1),
  fullName: z.string().min(2),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

function getAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Read-only preview so the acceptance page can show "join {org} as {role}"
// before the invitee fills in a name/password. Never mutates the invitation.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 })
    }

    const supabase = getAdminClient()
    const { data: invitation, error } = await supabase
      .from("user_invitations")
      .select("email, role, status, expires_at, organization:organizations(name)")
      .eq("token", token)
      .single()

    if (error || !invitation) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 })
    }
    if (invitation.status !== "pending") {
      return NextResponse.json({ error: "This invitation has already been used or revoked" }, { status: 400 })
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: "This invitation has expired" }, { status: 400 })
    }

    const org = invitation.organization as unknown as { name: string } | { name: string }[] | null
    const organizationName = Array.isArray(org) ? org[0]?.name : org?.name

    return NextResponse.json({
      email: invitation.email,
      role: invitation.role,
      organizationName: organizationName || "your organization",
    })
  } catch (error) {
    console.error("Invitation preview error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const limited = await enforceRateLimit("acceptInvitation", getClientIp(request))
    if (limited) return limited

    const body = await request.json()
    const parsed = acceptSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { token, fullName, password } = parsed.data
    const supabase = getAdminClient()

    // Find the invitation. The identity (email, org, role) is taken ONLY from
    // this server-trusted record — never from client-supplied fields.
    const { data: invitation, error: inviteError } = await supabase
      .from("user_invitations")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 })
    }

    // Reject expired invitations.
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase.from("user_invitations").update({ status: "expired" }).eq("id", invitation.id)
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 })
    }

    // Enforce the organization's seat limit before provisioning. The cap is
    // derived from the current subscription tier (authoritative).
    const { data: org } = await supabase
      .from("organizations")
      .select("max_users, subscription_tier")
      .eq("id", invitation.organization_id)
      .single()

    const { count: userCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", invitation.organization_id)
      .eq("is_active", true)

    // -1 means "unlimited" on both the tier definition and the stored column —
    // normalize before Math.min (see the identical fix in app/api/invitations/route.ts).
    const tierMax = normalizeLimit(getTierLimits((org?.subscription_tier as SubscriptionTier) || "free").maxUsers)
    const storedMax = org?.max_users != null ? normalizeLimit(org.max_users) : tierMax
    const seatLimit = Math.min(tierMax, storedMax)

    if (userCount !== null && userCount >= seatLimit) {
      return NextResponse.json(
        { error: "Organization has reached its maximum user limit. Please contact the admin to upgrade." },
        { status: 400 },
      )
    }

    // Server creates the auth account using the invitation's email — this is
    // what guarantees the new user id can only be bound to the invited email.
    // Uses generateLink rather than admin.createUser + email_confirm: true —
    // see the identical change (and the reasoning) in app/api/auth/signup/route.ts.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const { data: linkData, error: authError } = await supabase.auth.admin.generateLink({
      type: "signup",
      email: invitation.email,
      password,
      options: {
        data: { full_name: fullName },
        redirectTo: `${appUrl}/verify-email`,
      },
    })

    if (authError || !linkData?.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create account" },
        { status: 400 },
      )
    }

    const authData = { user: linkData.user }
    const confirmationUrl = linkData.properties?.action_link

    // Create the organization-scoped profile row.
    const { error: userError } = await supabase.from("users").insert({
      id: authData.user.id,
      organization_id: invitation.organization_id,
      email: invitation.email,
      full_name: fullName,
      role: invitation.role,
      department_id: invitation.department_id,
      is_active: true,
    })

    if (userError) {
      // Roll back the auth user so the invitation can be retried cleanly.
      await supabase.auth.admin.deleteUser(authData.user.id)
      console.error("Error creating user:", userError)
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Mark the invitation as consumed (single-use).
    await supabase
      .from("user_invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invitation.id)

    // Best-effort confirmation email (no-ops without RESEND_API_KEY — see
    // confirmationUrl fallback below, matching the invitation-send route).
    const emailResult = confirmationUrl
      ? await sendEmail(invitation.email, confirmEmailEmail({ fullName, url: confirmationUrl }))
      : { sent: false }

    // Best-effort sign-in, same as signup: succeeds immediately if the
    // Supabase project doesn't enforce email confirmation, fails gracefully
    // (and the client falls back to the "check your email" step) if it does.
    const sessionClient = await getSupabaseServerClient()
    const { error: signInError } = await sessionClient.auth.signInWithPassword({
      email: invitation.email,
      password,
    })

    return NextResponse.json({
      success: true,
      organization_id: invitation.organization_id,
      email: invitation.email,
      signedIn: !signInError,
      emailSent: emailResult.sent,
      emailDomainNotVerified: "domainNotVerified" in emailResult ? (emailResult.domainNotVerified ?? false) : false,
      confirmationUrl: !emailResult.sent ? confirmationUrl : undefined,
    })
  } catch (error) {
    console.error("Accept invitation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
