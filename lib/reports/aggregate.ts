import type { ExpenseRequest, ExpenseCategory, RequestStatus } from "@/lib/types"

/**
 * Pure reporting aggregations over expense requests. No React, no data source
 * coupling — the same functions power the demo store, the (future) server
 * reporting endpoints, exports, and the test suite.
 */

// Statuses that represent "real" spend activity (drafts/cancelled excluded).
const ACTIVE_STATUSES: RequestStatus[] = ["pending", "approved", "paid"]

export function isActiveRequest(r: ExpenseRequest): boolean {
  return r.status !== "draft" && r.status !== "cancelled"
}

export type Totals = {
  submitted: number
  approved: number
  paid: number
  pending: number
  count: number
  avg: number
}

/** Headline totals across the active requests. */
export function computeTotals(requests: ExpenseRequest[]): Totals {
  const active = requests.filter(isActiveRequest)
  const submitted = active.reduce((s, r) => s + r.amount, 0)
  const approved = requests
    .filter((r) => r.status === "approved" || r.status === "paid")
    .reduce((s, r) => s + r.amount, 0)
  const paid = requests.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0)
  const pending = requests.filter((r) => r.status === "pending").reduce((s, r) => s + r.amount, 0)
  return {
    submitted,
    approved,
    paid,
    pending,
    count: active.length,
    avg: active.length > 0 ? submitted / active.length : 0,
  }
}

export type CategoryRow = { category: ExpenseCategory; count: number; amount: number; pct: number }

/** Spend grouped by category, sorted descending, with share-of-total percentage. */
export function spendByCategory(requests: ExpenseRequest[]): CategoryRow[] {
  const active = requests.filter(isActiveRequest)
  const total = active.reduce((s, r) => s + r.amount, 0)
  const map = new Map<ExpenseCategory, { count: number; amount: number }>()
  for (const r of active) {
    const cur = map.get(r.category) ?? { count: 0, amount: 0 }
    cur.count += 1
    cur.amount += r.amount
    map.set(r.category, cur)
  }
  return Array.from(map.entries())
    .map(([category, v]) => ({
      category,
      count: v.count,
      amount: v.amount,
      pct: total > 0 ? Math.round((v.amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}

export type StatusRow = { status: RequestStatus; count: number; amount: number }

/** Count and amount grouped by status (includes drafts/cancelled for completeness). */
export function countByStatus(requests: ExpenseRequest[]): StatusRow[] {
  const order: RequestStatus[] = ["draft", "pending", "approved", "paid", "rejected", "cancelled"]
  const map = new Map<RequestStatus, { count: number; amount: number }>()
  for (const r of requests) {
    const cur = map.get(r.status) ?? { count: 0, amount: 0 }
    cur.count += 1
    cur.amount += r.amount
    map.set(r.status, cur)
  }
  return order
    .filter((s) => map.has(s))
    .map((status) => ({ status, count: map.get(status)!.count, amount: map.get(status)!.amount }))
}

export type VendorRow = { vendorId: string; count: number; amount: number }

/** Top vendors by spend. Requests without a vendor are ignored. */
export function topVendors(requests: ExpenseRequest[], limit = 8): VendorRow[] {
  const active = requests.filter(isActiveRequest)
  const map = new Map<string, { count: number; amount: number }>()
  for (const r of active) {
    if (!r.vendor_id) continue
    const cur = map.get(r.vendor_id) ?? { count: 0, amount: 0 }
    cur.count += 1
    cur.amount += r.amount
    map.set(r.vendor_id, cur)
  }
  return Array.from(map.entries())
    .map(([vendorId, v]) => ({ vendorId, count: v.count, amount: v.amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
}

export type MonthlyPoint = { key: string; label: string; submitted: number; approved: number; paid: number }

/**
 * Real monthly spend trend derived from request dates (no random values).
 * Buckets by the most relevant date per status and returns the last `months`
 * calendar months up to and including `now`.
 */
export function monthlyTrend(requests: ExpenseRequest[], months = 6, now: Date = new Date()): MonthlyPoint[] {
  const buckets: MonthlyPoint[] = []
  const index = new Map<string, MonthlyPoint>()

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const point: MonthlyPoint = {
      key,
      label: d.toLocaleDateString("en-US", { month: "short" }),
      submitted: 0,
      approved: 0,
      paid: 0,
    }
    buckets.push(point)
    index.set(key, point)
  }

  const keyFor = (iso?: string): string | null => {
    if (!iso) return null
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  }

  for (const r of requests) {
    if (!isActiveRequest(r)) continue
    // Submitted: uses submitted_at, else created_at.
    const sKey = keyFor(r.submitted_at) ?? keyFor(r.created_at)
    if (sKey && index.has(sKey)) index.get(sKey)!.submitted += r.amount
    // Approved bucket (approved + paid).
    if (r.status === "approved" || r.status === "paid") {
      const aKey = keyFor(r.approved_at) ?? sKey
      if (aKey && index.has(aKey)) index.get(aKey)!.approved += r.amount
    }
    // Paid bucket.
    if (r.status === "paid") {
      const pKey = keyFor(r.payment_date) ?? keyFor(r.approved_at) ?? sKey
      if (pKey && index.has(pKey)) index.get(pKey)!.paid += r.amount
    }
  }

  return buckets
}

export type DeptRow = { departmentId: string; spend: number; budget: number; pct: number }

/** Department spend vs budget. Spend counts approved + paid requests. */
export function spendByDepartment(
  requests: ExpenseRequest[],
  departments: { id: string; budget_amount: number }[],
): DeptRow[] {
  return departments.map((d) => {
    const spend = requests
      .filter((r) => r.department_id === d.id && (r.status === "approved" || r.status === "paid"))
      .reduce((s, r) => s + r.amount, 0)
    return {
      departmentId: d.id,
      spend,
      budget: d.budget_amount,
      pct: d.budget_amount > 0 ? Math.round((spend / d.budget_amount) * 100) : 0,
    }
  })
}

export { ACTIVE_STATUSES }
