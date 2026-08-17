import { NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { serverError } from "@/lib/api/errors"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true, id })
    }

    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("expense_requests")
      .select("*, employee:users!employee_id(*), vendor:vendors(*), department:departments(*), receipts(*), approval_workflows(*)")
      .eq("id", id)
      .single()

    if (error) return NextResponse.json({ error: "Request not found" }, { status: 404 })

    return NextResponse.json({ data })
  } catch (err) {
    return serverError(err, { route: "requests.[id].GET" })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true, success: true })
    }

    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
      .from("expense_requests")
      .update(body)
      .eq("id", id)
      .select()
      .single()

    if (error) return serverError(error, { route: "requests.[id].PATCH", id })

    return NextResponse.json({ data })
  } catch (err) {
    return serverError(err, { route: "requests.[id].PATCH" })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ demo: true, success: true })
    }

    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { error } = await supabase.from("expense_requests").delete().eq("id", id)
    if (error) return serverError(error, { route: "requests.[id].DELETE", id })

    return NextResponse.json({ success: true })
  } catch (err) {
    return serverError(err, { route: "requests.[id].DELETE" })
  }
}
