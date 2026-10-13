import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns"
import type { ExpenseRequest } from "@/lib/types"
import { isActiveRequest, type MonthlyPoint } from "@/lib/reports/aggregate"

/**
 * Date ranges for Reports and the dashboard charts. Pure functions (no React, no
 * data source) so they are unit-testable and shared by every screen and export.
 *
 * A range applies to the date a request was SUBMITTED (created, if it was never
 * submitted). The trend chart buckets by that same date, so the headline totals
 * and the chart always add up to the same figure.
 */

export const RANGE_PRESETS = [
  { id: "30d", label: "Last 30 days" },
  { id: "this-month", label: "This month" },
  { id: "last-month", label: "Last month" },
  { id: "3m", label: "Last 3 months" },
  { id: "6m", label: "Last 6 months" },
  { id: "12m", label: "Last 12 months" },
  { id: "this-year", label: "This year" },
  { id: "last-year", label: "Last year" },
  { id: "all", label: "All time" },
] as const

export type PresetId = (typeof RANGE_PRESETS)[number]["id"]

/** What the user picked. Custom dates are plain yyyy-MM-dd strings (what a date input holds). */
export type RangeSelection = { kind: "preset"; preset: PresetId } | { kind: "custom"; from: string; to: string }

export interface ResolvedRange {
  /** Start of the first day, or null for "all time". */
  from: Date | null
  /** End of the last day, or null for "all time". */
  to: Date | null
  /** Short name: "Last 6 months", or the dates for a custom range. */
  label: string
  /** Always the dates themselves, e.g. "May 1 – Oct 13, 2026". */
  dates: string
}

export const DEFAULT_RANGE: RangeSelection = { kind: "preset", preset: "6m" }

const presetLabel = (id: PresetId) => RANGE_PRESETS.find((p) => p.id === id)?.label ?? "Custom range"

/** "Mar 1, 2026", or "Mar 1 – Mar 31, 2026" / across years "Dec 1, 2025 – Jan 31, 2026". */
export function formatSpan(from: Date, to: Date): string {
  if (differenceInCalendarDays(to, from) === 0) return format(from, "MMM d, yyyy")
  if (from.getFullYear() === to.getFullYear()) return `${format(from, "MMM d")} – ${format(to, "MMM d, yyyy")}`
  return `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`
}

/** Parses a yyyy-MM-dd string as a LOCAL date (never shifted by time zone). */
export function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const d = parseISO(value)
  return isValid(d) ? d : null
}

export function toDateInput(d: Date): string {
  return format(d, "yyyy-MM-dd")
}

export function resolveRange(selection: RangeSelection, now: Date = new Date()): ResolvedRange {
  const today = endOfDay(now)
  const make = (from: Date | null, to: Date | null, label: string): ResolvedRange => ({
    from,
    to,
    label,
    dates: from && to ? formatSpan(from, to) : "All time",
  })

  if (selection.kind === "custom") {
    const a = parseDateInput(selection.from)
    const b = parseDateInput(selection.to)
    // An unreadable custom range falls back to the default rather than showing nothing.
    if (!a || !b) return resolveRange(DEFAULT_RANGE, now)
    const [lo, hi] = a <= b ? [a, b] : [b, a]
    const from = startOfDay(lo)
    const to = endOfDay(hi)
    return make(from, to, formatSpan(from, to))
  }

  const label = presetLabel(selection.preset)
  switch (selection.preset) {
    case "30d":
      return make(startOfDay(subDays(now, 29)), today, label)
    case "this-month":
      return make(startOfMonth(now), today, label)
    case "last-month": {
      const m = subMonths(now, 1)
      return make(startOfMonth(m), endOfMonth(m), label)
    }
    // Whole calendar months, so the first month in the trend is never a partial one.
    case "3m":
      return make(startOfMonth(subMonths(now, 2)), today, label)
    case "6m":
      return make(startOfMonth(subMonths(now, 5)), today, label)
    case "12m":
      return make(startOfMonth(subMonths(now, 11)), today, label)
    case "this-year":
      return make(startOfYear(now), today, label)
    case "last-year": {
      const y = subYears(now, 1)
      return make(startOfYear(y), endOfYear(y), label)
    }
    case "all":
      return make(null, null, label)
  }
}

/** The date a request counts under: when it was submitted, else when it was created. */
export function reportDate(r: ExpenseRequest): Date | null {
  const d = new Date(r.submitted_at ?? r.created_at)
  return Number.isNaN(d.getTime()) ? null : d
}

export function filterByRange(requests: ExpenseRequest[], range: Pick<ResolvedRange, "from" | "to">): ExpenseRequest[] {
  if (!range.from && !range.to) return requests
  return requests.filter((r) => {
    const d = reportDate(r)
    if (!d) return false
    if (range.from && d < range.from) return false
    if (range.to && d > range.to) return false
    return true
  })
}

/** A safe-in-a-filename description: "2026-03-01_to_2026-03-31" or "all-time". */
export function rangeFileSuffix(range: Pick<ResolvedRange, "from" | "to">): string {
  if (!range.from || !range.to) return "all-time"
  return `${toDateInput(range.from)}_to_${toDateInput(range.to)}`
}

// ---------------------------------------------------------------- trend

export type Granularity = "day" | "week" | "month"

/** Day-by-day for about a month, week-by-week for a quarter, month-by-month beyond that. */
export function pickGranularity(from: Date, to: Date): Granularity {
  const days = differenceInCalendarDays(to, from) + 1
  if (days <= 31) return "day"
  if (days <= 120) return "week"
  return "month"
}

/** Upper bound on buckets so a silly range (year 1900) can never freeze the page. */
const MAX_BUCKETS = 120

export type SpendTrend = { granularity: Granularity; points: MonthlyPoint[] }

const bucketStart = (d: Date, g: Granularity): Date =>
  g === "day" ? startOfDay(d) : g === "week" ? startOfWeek(d, { weekStartsOn: 1 }) : startOfMonth(d)

const step = (d: Date, g: Granularity): Date => (g === "day" ? addDays(d, 1) : g === "week" ? addWeeks(d, 1) : addMonths(d, 1))

/**
 * Spend over time for the chosen range, bucketed so the chart is always useful:
 * a 10-day range shows days, not a single month-wide dot. Buckets by the same
 * dates as the headline totals (submitted / approved / paid).
 */
export function spendTrend(
  requests: ExpenseRequest[],
  range: Pick<ResolvedRange, "from" | "to">,
  now: Date = new Date(),
): SpendTrend {
  const dates = requests.map(reportDate).filter((d): d is Date => d !== null)
  const earliest = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : null
  const latest = dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null

  const today = endOfDay(now)
  // Never chart empty future months.
  const cap = latest && latest > today ? latest : today
  const start = range.from ?? earliest ?? startOfMonth(now)
  const rawEnd = range.to ?? cap
  const end = rawEnd < cap ? rawEnd : cap

  if (start > end) return { granularity: "month", points: [] }

  const granularity = pickGranularity(start, end)

  const starts: Date[] = []
  for (let d = bucketStart(start, granularity); d <= end; d = step(d, granularity)) starts.push(d)
  const kept = starts.length > MAX_BUCKETS ? starts.slice(starts.length - MAX_BUCKETS) : starts

  const multiYear = kept.length > 0 && kept[0].getFullYear() !== kept[kept.length - 1].getFullYear()
  // The first week starts on a Monday that may be before the chosen range; label it with the range's first day.
  const labelFor = (d: Date, i: number) => {
    if (granularity === "month") return format(d, multiYear ? "MMM ’yy" : "MMM")
    return format(granularity === "week" && i === 0 && start > d ? start : d, "MMM d")
  }
  const keyOf = (d: Date) => format(bucketStart(d, granularity), "yyyy-MM-dd")

  const points: MonthlyPoint[] = kept.map((d, i) => ({ key: keyOf(d), label: labelFor(d, i), submitted: 0, approved: 0, paid: 0 }))
  const index = new Map(points.map((p) => [p.key, p]))

  const keyFor = (iso?: string | null): string | null => {
    if (!iso) return null
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? null : keyOf(d)
  }

  for (const r of requests) {
    if (!isActiveRequest(r)) continue
    const sKey = keyFor(r.submitted_at) ?? keyFor(r.created_at)
    if (sKey) {
      const p = index.get(sKey)
      if (p) p.submitted += r.amount
    }
    if (r.status === "approved" || r.status === "paid") {
      const p = index.get(keyFor(r.approved_at) ?? sKey ?? "")
      if (p) p.approved += r.amount
    }
    if (r.status === "paid") {
      const p = index.get(keyFor(r.payment_date) ?? keyFor(r.approved_at) ?? sKey ?? "")
      if (p) p.paid += r.amount
    }
  }

  return { granularity, points }
}

export const GRANULARITY_LABEL: Record<Granularity, string> = { day: "by day", week: "by week", month: "by month" }
