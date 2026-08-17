import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { enforceRateLimit, getClientIp } from "@/lib/api/rate-limit"
import { getTierLimits } from "@/lib/products"
import type { SubscriptionTier } from "@/lib/types"
import { sendEmail } from "@/lib/notifications/email"
import { invitationEmail } from "@/lib/notifications/templates"
import { z } from "zod"
import { randomBytes } from "crypto"

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["employee", "manager", "finance", "admin"]),
  department_id: z.string().uuid().optional(),
})

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ invitations: [] })
  }

  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's organization
    const { data: dbUser } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single()

    if (!dbUser || dbUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: invitations, error } = await supabase
      .from("user_invitations")
      .select("*, invited_by_user:users!user_invitations_invited_by_fkey(full_name)")
      .eq("organization_id", dbUser.organization_id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 })
  }

  try {
    const body = await request.json()
    const parsed = inviteSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, role, department_id } = parsed.data
    const supabase = await getSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Throttle invitation creation per inviting user.
    const limited = await enforceRateLimit("invitation", user.id)
    if (limited) return limited

    // Get user's organization and verify admin role
    const { data: dbUser } = await supabase
      .from("users")
      .select("organization_id, role, full_name")
      .eq("id", user.id)
      .single()

    if (!dbUser || dbUser.role !== "admin") {
      return NextResponse.json({ error: "Only admins can invite users" }, { status: 403 })
    }

    // Check organization user limit. The seat cap is derived from the current
    // subscription tier (authoritative) rather than a possibly-stale max_users column.
    const { data: org } = await supabase
      .from("organizations")
      .select("max_users, subscription_tier, name")
      .eq("id", dbUser.organization_id)
      .single()

    const { count: currentUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", dbUser.organization_id)
      .eq("is_active", true)

    const { count: pendingInvites } = await supabase
      .from("user_invitations")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", dbUser.organization_id)
      .eq("status", "pending")

    const totalUsers = (currentUsers || 0) + (pendingInvites || 0)

    const tierMax = getTierLimits((org?.subscription_tier as SubscriptionTier) || "free").maxUsers
    // Respect the stricter of tier limit and any stored override.
    const seatLimit = Math.min(tierMax, org?.max_users ?? tierMax)

    if (totalUsers >= seatLimit) {
      return NextResponse.json({
        error: `Your organization has reached the maximum of ${seatLimit} users on the ${org?.subscription_tier || "free"} plan. Please upgrade your subscription to add more users.`,
      }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .eq("organization_id", dbUser.organization_id)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: "User already exists in this organization" }, { status: 400 })
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabase
      .from("user_invitations")
      .select("id")
      .eq("email", email)
      .eq("organization_id", dbUser.organization_id)
      .eq("status", "pending")
      .single()

    if (existingInvite) {
      return NextResponse.json({ error: "An invitation has already been sent to this email" }, { status: 400 })
    }

    // Generate invitation token
    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    const { data: invitation, error } = await supabase
      .from("user_invitations")
      .insert({
        organization_id: dbUser.organization_id,
        email,
        role,
        department_id,
        invited_by: user.id,
        token,
        expires_at: expiresAt.toISOString(),
        status: "pending",
      })
      .select()
      .single()

    if (error) throw error

    // Send the invitation email (best-effort; gracefully no-ops without RESEND_API_KEY).
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/signup?invitation=${token}`
    const emailResult = await sendEmail(
      email,
      invitationEmail({
        organizationName: org?.name || "your organization",
        inviterName: dbUser.full_name,
        role,
        url: inviteUrl,
      }),
    )

    return NextResponse.json({
      success: true,
      invitation,
      emailSent: emailResult.sent,
      // Returned for development so invites work before email is configured.
      inviteUrl,
    })
  } catch (error) {
    console.error("Error creating invitation:", error)
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get("id")

    if (!invitationId) {
      return NextResponse.json({ error: "Invitation ID required" }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin role
    const { data: dbUser } = await supabase
      .from("users")
      .select("organization_id, role")
      .eq("id", user.id)
      .single()

    if (!dbUser || dbUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { error } = await supabase
      .from("user_invitations")
      .update({ status: "revoked" })
      .eq("id", invitationId)
      .eq("organization_id", dbUser.organization_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error revoking invitation:", error)
    return NextResponse.json({ error: "Failed to revoke invitation" }, { status: 500 })
  }
}
