import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

const acceptSchema = z.object({
  token: z.string().min(1),
  userId: z.string().uuid(),
  fullName: z.string().min(2),
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
    const body = await request.json()
    const parsed = acceptSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { token, userId, fullName } = parsed.data
    const supabase = getAdminClient()

    // Find the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("user_invitations")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 })
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from("user_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id)
      
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 })
    }

    // Check organization user limit
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
      return NextResponse.json({ 
        error: "Organization has reached maximum user limit. Please contact the admin to upgrade." 
      }, { status: 400 })
    }

    // Create user record
    const { error: userError } = await supabase
      .from("users")
      .insert({
        id: userId,
        organization_id: invitation.organization_id,
        email: invitation.email,
        full_name: fullName,
        role: invitation.role,
        department_id: invitation.department_id,
        is_active: true,
      })

    if (userError) {
      console.error("Error creating user:", userError)
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    // Mark invitation as accepted
    await supabase
      .from("user_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id)

    return NextResponse.json({ 
      success: true,
      organization_id: invitation.organization_id,
    })
  } catch (error) {
    console.error("Accept invitation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
