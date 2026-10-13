import { describe, expect, it } from "vitest"
import type { ExpenseRequest } from "@/lib/types"
import {
  filterByRange,
  formatSpan,
  parseDateInput,
  pickGranularity,
  rangeFileSuffix,
  resolveRange,
  spendTrend,
  type RangeSelection,
} from "@/lib/reports/date-range"

// A fixed "today" so every test is deterministic: Tuesday 13 October 2026, local time.
const NOW = new Date(2026, 9, 13, 14, 30)

function req(overrides: Partial<ExpenseRequest> = {}): ExpenseRequest {
  return {
    id: crypto.randomUUID(),
    organization_id: "org-1",
    request_number: "REQ-2026-00001",
    employee_id: "user-1",
    department_id: "dept-1",
    vendor_id: "vendor-1",
    amount: 100,
    currency: "USD",
    purpose: "Test expense",
    category: "travel",
    status: "approved",
    priority: "medium",
    payment_status: "unpaid",
    metadata: {},
    created_at: new Date(2026, 9, 1, 12).toISOString(),
    updated_at: new Date(2026, 9, 1, 12).toISOString(),
    ...overrides,
  }
}

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).toISOString()
const preset = (p: Extract<RangeSelection, { kind: "preset" }>["preset"]): RangeSelection => ({ kind: "preset", preset: p })
const ymd = (d: Date | null) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : null)

describe("resolveRange: presets", () => {
  it("last 30 days is 30 calendar days including today", () => {
    const r = resolveRange(preset("30d"), NOW)
    expect(ymd(r.from)).toBe("2026-09-14")
    expect(ymd(r.to)).toBe("2026-10-13")
  })
  it("this month and last month", () => {
    expect(ymd(resolveRange(preset("this-month"), NOW).from)).toBe("2026-10-01")
    const last = resolveRange(preset("last-month"), NOW)
    expect([ymd(last.from), ymd(last.to)]).toEqual(["2026-09-01", "2026-09-30"])
  })
  it("last N months start on the 1st of a whole month, so no partial first month", () => {
    expect(ymd(resolveRange(preset("3m"), NOW).from)).toBe("2026-08-01")
    expect(ymd(resolveRange(preset("6m"), NOW).from)).toBe("2026-05-01")
    expect(ymd(resolveRange(preset("12m"), NOW).from)).toBe("2025-11-01")
  })
  it("this year and last year", () => {
    expect(ymd(resolveRange(preset("this-year"), NOW).from)).toBe("2026-01-01")
    const ly = resolveRange(preset("last-year"), NOW)
    expect([ymd(ly.from), ymd(ly.to)]).toEqual(["2025-01-01", "2025-12-31"])
  })
  it("all time has no bounds", () => {
    const r = resolveRange(preset("all"), NOW)
    expect(r.from).toBeNull()
    expect(r.to).toBeNull()
    expect(r.dates).toBe("All time")
  })
})

describe("resolveRange: custom", () => {
  it("covers the whole of both end days", () => {
    const r = resolveRange({ kind: "custom", from: "2025-03-01", to: "2025-03-31" }, NOW)
    expect(r.from?.getHours()).toBe(0)
    expect(r.to?.getHours()).toBe(23)
    expect(r.label).toBe("Mar 1 – Mar 31, 2025")
  })
  it("swaps dates that were entered the wrong way round", () => {
    const r = resolveRange({ kind: "custom", from: "2025-06-30", to: "2025-06-01" }, NOW)
    expect([ymd(r.from), ymd(r.to)]).toEqual(["2025-06-01", "2025-06-30"])
  })
  it("falls back to the default when a date cannot be read", () => {
    const r = resolveRange({ kind: "custom", from: "nonsense", to: "2025-06-01" }, NOW)
    expect(ymd(r.from)).toBe("2026-05-01")
  })
  it("a single day is a valid range", () => {
    const r = resolveRange({ kind: "custom", from: "2026-02-14", to: "2026-02-14" }, NOW)
    expect(r.label).toBe("Feb 14, 2026")
  })
  it("reads date inputs as local dates, not shifted by time zone", () => {
    const d = parseDateInput("2026-03-01")
    expect([d?.getFullYear(), d?.getMonth(), d?.getDate()]).toEqual([2026, 2, 1])
    expect(parseDateInput("2026-13-45")).toBeNull()
    expect(parseDateInput("")).toBeNull()
  })
  it("formats a span across years", () => {
    expect(formatSpan(new Date(2025, 11, 1), new Date(2026, 0, 31))).toBe("Dec 1, 2025 – Jan 31, 2026")
  })
})

describe("filterByRange", () => {
  const range = resolveRange({ kind: "custom", from: "2025-03-01", to: "2025-03-31" }, NOW)

  it("includes both boundary days and excludes the days just outside", () => {
    const kept = filterByRange(
      [
        req({ id: "before", created_at: at(2025, 2, 28, 23) }),
        req({ id: "first", created_at: at(2025, 3, 1, 0) }),
        req({ id: "last", created_at: at(2025, 3, 31, 23) }),
        req({ id: "after", created_at: at(2025, 4, 1, 0) }),
      ],
      range,
    )
    expect(kept.map((r) => r.id)).toEqual(["first", "last"])
  })
  it("uses the submitted date when there is one", () => {
    const r = req({ created_at: at(2025, 2, 20), submitted_at: at(2025, 3, 5) })
    expect(filterByRange([r], range)).toHaveLength(1)
  })
  it("a range reaching years back is not capped", () => {
    const old = req({ created_at: at(2019, 6, 15) })
    const r = resolveRange({ kind: "custom", from: "2019-01-01", to: "2019-12-31" }, NOW)
    expect(filterByRange([old, req()], r)).toEqual([old])
  })
  it("all time keeps everything", () => {
    const all = [req(), req({ created_at: at(2018, 1, 1) })]
    expect(filterByRange(all, resolveRange(preset("all"), NOW))).toHaveLength(2)
  })
})

describe("granularity", () => {
  const g = (a: [number, number, number], b: [number, number, number]) => pickGranularity(new Date(...([a[0], a[1] - 1, a[2]] as const)), new Date(...([b[0], b[1] - 1, b[2]] as const)))
  it("days for about a month, weeks for a quarter, months beyond", () => {
    expect(g([2026, 9, 14], [2026, 10, 13])).toBe("day")
    expect(g([2026, 8, 1], [2026, 10, 13])).toBe("week")
    expect(g([2026, 5, 1], [2026, 10, 13])).toBe("month")
  })
})

describe("spendTrend", () => {
  it("charts exactly the months of a custom range in the past", () => {
    const range = resolveRange({ kind: "custom", from: "2025-01-01", to: "2025-06-30" }, NOW)
    const t = spendTrend(
      [
        req({ status: "paid", amount: 300, submitted_at: at(2025, 2, 10), approved_at: at(2025, 2, 11), payment_date: at(2025, 3, 2) }),
        req({ status: "pending", amount: 50, submitted_at: at(2025, 6, 30, 22) }),
      ],
      range,
      NOW,
    )
    expect(t.granularity).toBe("month")
    expect(t.points.map((p) => p.label)).toEqual(["Jan", "Feb", "Mar", "Apr", "May", "Jun"])
    expect(t.points[1]).toMatchObject({ submitted: 300, approved: 300, paid: 0 })
    expect(t.points[2]).toMatchObject({ paid: 300 })
    expect(t.points[5]).toMatchObject({ submitted: 50 })
  })

  it("shows days when the range is short, instead of one month-wide dot", () => {
    const range = resolveRange({ kind: "custom", from: "2026-10-05", to: "2026-10-11" }, NOW)
    const t = spendTrend([req({ amount: 80, submitted_at: at(2026, 10, 8) })], range, NOW)
    expect(t.granularity).toBe("day")
    expect(t.points).toHaveLength(7)
    expect(t.points.find((p) => p.label === "Oct 8")?.submitted).toBe(80)
  })

  it("a weekly chart starts at the range's first day, not the Monday before it", () => {
    // Thu 1 Jan 2026 – Sat 28 Feb 2026 is 59 days, so weekly; the first week begins Mon 29 Dec.
    const range = resolveRange({ kind: "custom", from: "2026-01-01", to: "2026-02-28" }, NOW)
    const t = spendTrend([], range, NOW)
    expect(t.granularity).toBe("week")
    expect(t.points[0].label).toBe("Jan 1")
    expect(t.points[1].label).toBe("Jan 5")
  })

  it("labels the year once a range crosses a year boundary", () => {
    const range = resolveRange({ kind: "custom", from: "2025-11-01", to: "2026-03-31" }, NOW)
    const t = spendTrend([], range, NOW)
    expect(t.points[0].label).toBe("Nov ’25")
    expect(t.points[t.points.length - 1].label).toBe("Mar ’26")
  })

  it("all time runs from the first request to today, however long that is", () => {
    const t = spendTrend([req({ created_at: at(2022, 4, 3), amount: 10 }), req({ amount: 20 })], resolveRange(preset("all"), NOW), NOW)
    expect(t.granularity).toBe("month")
    expect(t.points[0].label).toBe("Apr ’22")
    expect(t.points[t.points.length - 1].label).toBe("Oct ’26")
    expect(t.points.length).toBeGreaterThan(24)
  })

  it("never charts empty future months", () => {
    const range = resolveRange({ kind: "custom", from: "2026-09-01", to: "2027-12-31" }, NOW)
    const t = spendTrend([], range, NOW)
    expect(t.points[t.points.length - 1].label).toMatch(/^Oct/)
  })

  it("caps a runaway range instead of freezing the page", () => {
    const range = resolveRange({ kind: "custom", from: "1900-01-01", to: "2026-10-13" }, NOW)
    expect(spendTrend([], range, NOW).points.length).toBeLessThanOrEqual(120)
  })

  it("totals in the chart add up to the totals for the same filtered requests", () => {
    const requests = [
      req({ amount: 120, created_at: at(2026, 7, 4) }),
      req({ amount: 80, created_at: at(2026, 8, 20) }),
      req({ amount: 45, created_at: at(2026, 9, 9), status: "draft" }), // drafts never count
      req({ amount: 200, created_at: at(2026, 10, 2) }),
    ]
    const range = resolveRange(preset("6m"), NOW)
    const inRange = filterByRange(requests, range)
    const chartTotal = spendTrend(inRange, range, NOW).points.reduce((s, p) => s + p.submitted, 0)
    expect(chartTotal).toBe(400)
  })
})

describe("rangeFileSuffix", () => {
  it("names files by their dates", () => {
    expect(rangeFileSuffix(resolveRange({ kind: "custom", from: "2025-03-01", to: "2025-03-31" }, NOW))).toBe("2025-03-01_to_2025-03-31")
    expect(rangeFileSuffix(resolveRange(preset("all"), NOW))).toBe("all-time")
  })
})
