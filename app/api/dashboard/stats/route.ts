import { NextResponse } from "next/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ demo: true, message: "Using demo mode" })
  }

  try {
    const { getSupabaseServerClient } = await import("@/lib/supabase/server")
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase.from("users").select("organization_id, role").eq("id", user.id).single()
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

    const { data: requests } = await supabase
      .from("expense_requests")
      .select("id, amount, status, category, expense_date, department_id")
      .eq("organization_id", profile.organization_id)

    const allReqs = requests || []
    const totalRequests = allReqs.length
    const pendingCount = allReqs.filter(r => r.status === "pending").length
    const approvedCount = allReqs.filter(r => r.status === "approved" || r.status === "paid").length
    const totalSpend = allReqs
      .filter(r => r.status === "approved" || r.status === "paid")
      .reduce((sum, r) => sum + r.amount, 0)

    return NextResponse.json({
      totalRequests,
      pendingCount,
      approvedCount,
      totalSpend,
      categoryBreakdown: getCategoryBreakdown(allReqs),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function getCategoryBreakdown(requests: Array<{ amount: number; status: string; category: string }>) {
  const categories: Record<string, number> = {}
  requests
    .filter(r => r.status === "approved" || r.status === "paid")
    .forEach(r => {
      categories[r.category] = (categories[r.category] || 0) + r.amount
    })
  return Object.entries(categories).map(([name, value]) => ({ name, value }))
}
