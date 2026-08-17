import { NextResponse } from "next/server"
import { vendorSchema } from "@/lib/validations"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { serverError } from "@/lib/api/errors"

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true })
    }

    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("vendors")
      .select("*")
      .order("name")

    if (error) return serverError(error, { route: "vendors.GET" })
    return NextResponse.json({ data })
  } catch (err) {
    return serverError(err, { route: "vendors.GET" })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = vendorSchema.safeParse(body)
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

    const { data, error } = await supabase.from("vendors").insert({
      ...parsed.data,
      organization_id: dbUser.organization_id,
    }).select().single()

    if (error) return serverError(error, { route: "vendors.POST" })
    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    return serverError(err, { route: "vendors.POST" })
  }
}
