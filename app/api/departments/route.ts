import { NextResponse } from "next/server"
import { departmentSchema } from "@/lib/validations"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { serverError } from "@/lib/api/errors"
import { getTierLimits, normalizeLimit } from "@/lib/products"
import type { SubscriptionTier } from "@/lib/types"

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true })
    }

    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("departments")
      .select("*, manager:users!manager_id(full_name)")
      .order("name")

    if (error) return serverError(error, { route: "departments.GET" })
    return NextResponse.json({ data })
  } catch (err) {
    return serverError(err, { route: "departments.GET" })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = departmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true, success: true })
    }

    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: dbUser } = await supabase.from("users").select("organization_id").eq("id", user.id).single()
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // Enforce the plan's department cap, mirroring the seat-limit check in
    // app/api/invitations/route.ts.
    const { data: org } = await supabase
      .from("organizations")
      .select("subscription_tier")
      .eq("id", dbUser.organization_id)
      .single()

    const deptLimit = normalizeLimit(getTierLimits((org?.subscription_tier as SubscriptionTier) || "free").maxDepartments)
    const { count: currentDepartments } = await supabase
      .from("departments")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", dbUser.organization_id)

    if ((currentDepartments || 0) >= deptLimit) {
      return NextResponse.json({
        error: `Your organization has reached the maximum of ${deptLimit} departments on the ${org?.subscription_tier || "free"} plan. Please upgrade your subscription to add more.`,
      }, { status: 400 })
    }

    const { data, error } = await supabase.from("departments").insert({
      ...parsed.data,
      organization_id: dbUser.organization_id,
    }).select().single()

    if (error) return serverError(error, { route: "departments.POST" })
    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    return serverError(err, { route: "departments.POST" })
  }
}
