import { NextResponse } from "next/server"
import { z } from "zod"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { serverError, clientError } from "@/lib/api/errors"

const categorySchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name must be under 50 characters"),
})

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ data: [] })
    }

    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: dbUser } = await supabase.from("users").select("organization_id").eq("id", user.id).single()
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // System defaults (organization_id IS NULL) + this org's own custom
    // categories — the RLS policy already scopes this, .or() just makes the
    // intent explicit and avoids relying on RLS alone for the read shape.
    const { data, error } = await supabase
      .from("expense_categories")
      .select("*")
      .or(`organization_id.is.null,organization_id.eq.${dbUser.organization_id}`)
      .eq("is_active", true)
      .order("organization_id", { nullsFirst: true })
      .order("name")

    if (error) return serverError(error, { route: "categories.GET" })
    return NextResponse.json({ data })
  } catch (err) {
    return serverError(err, { route: "categories.GET" })
  }
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true, success: true })
    }

    const body = await request.json()
    const parsed = categorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: dbUser } = await supabase.from("users").select("organization_id, role").eq("id", user.id).single()
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (dbUser.role !== "admin" && dbUser.role !== "finance") {
      return clientError("Only admins and finance users can manage expense categories.", 403)
    }

    // Custom categories are a Starter-and-up feature — RLS doesn't know
    // about pricing tiers, so this is enforced here (mirrors the
    // maxUsers/maxDepartments tier checks in invitations/departments).
    const { data: org } = await supabase.from("organizations").select("subscription_tier").eq("id", dbUser.organization_id).single()
    if (!org || org.subscription_tier === "free") {
      return clientError("Custom expense categories require a Starter plan or higher. Upgrade to add your own.", 403)
    }

    const { data, error } = await supabase
      .from("expense_categories")
      .insert({
        organization_id: dbUser.organization_id,
        name: parsed.data.name,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return clientError("A category with this name already exists.", 409)
      }
      return serverError(error, { route: "categories.POST" })
    }
    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    return serverError(err, { route: "categories.POST" })
  }
}

export async function DELETE(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true, success: true })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return clientError("Category id required")

    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: dbUser } = await supabase.from("users").select("organization_id, role").eq("id", user.id).single()
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (dbUser.role !== "admin" && dbUser.role !== "finance") {
      return clientError("Only admins and finance users can manage expense categories.", 403)
    }

    // Soft-delete (is_active = false) rather than a hard DELETE — existing
    // expense_requests rows keep referencing the category name for history/
    // reporting even after it's retired from the picker, same rationale as
    // departments/vendors' is_active columns.
    const { error } = await supabase
      .from("expense_categories")
      .update({ is_active: false })
      .eq("id", id)
      .eq("organization_id", dbUser.organization_id) // never touch system defaults (organization_id IS NULL)

    if (error) return serverError(error, { route: "categories.DELETE" })
    return NextResponse.json({ success: true })
  } catch (err) {
    return serverError(err, { route: "categories.DELETE" })
  }
}
