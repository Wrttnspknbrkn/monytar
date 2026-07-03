import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { enforceRateLimit, getClientIp } from "@/lib/api/rate-limit"

const acceptSchema = z.object({
  token: z.string().min(1),
  fullName: z.string().min(2),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

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

    // Enforce the organization's seat limit before provisioning.
    const { data: org } = await supabase
      .from("organizations")
      .select("max_users")
      .eq("id", invitation.organization_id)
      .single()

    const { count: userCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", invitation.organization_id)
      .eq("is_active", true)

    if (org && userCount !== null && userCount >= org.max_users) {
      return NextResponse.json(
        { error: "Organization has reached its maximum user limit. Please contact the admin to upgrade." },
        { status: 400 },
      )
    }

    // Server creates the auth account using the invitation's email — this is
    // what guarantees the new user id can only be bound to the invited email.
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create account" },
        { status: 400 },
      )
    }

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

    return NextResponse.json({
      success: true,
      organization_id: invitation.organization_id,
      email: invitation.email,
    })
  } catch (error) {
    console.error("Accept invitation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
