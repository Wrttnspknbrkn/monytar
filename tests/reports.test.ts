import { describe, it, expect } from "vitest"
import type { ExpenseRequest, Department, Vendor, User } from "@/lib/types"
import {
  isActiveRequest,
  computeTotals,
  spendByCategory,
  countByStatus,
  topVendors,
  monthlyTrend,
  spendByDepartment,
} from "@/lib/reports/aggregate"
import { escapeCSVField, toCSV, buildExpenseReport } from "@/lib/reports/export"
import {
  requestApprovedEmail,
  requestRejectedEmail,
  invitationEmail,
  budgetAlertEmail,
} from "@/lib/notifications/templates"

// --- Fixtures -------------------------------------------------------------

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
    created_at: "2026-02-10T00:00:00Z",
    updated_at: "2026-02-10T00:00:00Z",
    ...overrides,
  }
}

const departments: Department[] = [
  { id: "dept-1", organization_id: "org-1", name: "Engineering", budget_amount: 1000, budget_period: "monthly", created_at: "", updated_at: "" },
  { id: "dept-2", organization_id: "org-1", name: "Marketing", budget_amount: 500, budget_period: "monthly", created_at: "", updated_at: "" },
]
const vendors: Vendor[] = [
  { id: "vendor-1", organization_id: "org-1", name: "Acme Travel", is_approved: true, approval_required: false, created_at: "", updated_at: "" },
  { id: "vendor-2", organization_id: "org-1", name: 'Bob "The" Supplier, Inc.', is_approved: true, approval_required: false, created_at: "", updated_at: "" },
]
const users: User[] = [
  { id: "user-1", organization_id: "org-1", email: "e@x.com", full_name: "Eve Employee", role: "employee", status: "active", created_at: "", updated_at: "" },
  { id: "user-2", organization_id: "org-1", email: "m@x.com", full_name: "Max Manager", role: "manager", status: "active", created_at: "", updated_at: "" },
]

// --- Aggregation ----------------------------------------------------------

describe("reporting aggregation", () => {
  it("excludes drafts and cancelled from active", () => {
    expect(isActiveRequest(req({ status: "draft" }))).toBe(false)
    expect(isActiveRequest(req({ status: "cancelled" }))).toBe(false)
    expect(isActiveRequest(req({ status: "pending" }))).toBe(true)
    expect(isActiveRequest(req({ status: "paid" }))).toBe(true)
  })

  it("computes headline totals correctly", () => {
    const totals = computeTotals([
      req({ amount: 100, status: "pending" }),
      req({ amount: 200, status: "approved" }),
      req({ amount: 300, status: "paid" }),
      req({ amount: 999, status: "draft" }), // excluded
      req({ amount: 50, status: "cancelled" }), // excluded
    ])
    expect(totals.submitted).toBe(600) // 100+200+300
    expect(totals.approved).toBe(500) // approved + paid
    expect(totals.paid).toBe(300)
    expect(totals.pending).toBe(100)
    expect(totals.count).toBe(3)
    expect(totals.avg).toBe(200)
  })

  it("returns zero avg for no active requests", () => {
    expect(computeTotals([req({ status: "draft" })]).avg).toBe(0)
  })

  it("groups spend by category sorted descending with share %", () => {
    const rows = spendByCategory([
      req({ category: "travel", amount: 300 }),
      req({ category: "meals", amount: 100 }),
      req({ category: "travel", amount: 100 }),
    ])
    expect(rows[0]).toMatchObject({ category: "travel", count: 2, amount: 400, pct: 80 })
    expect(rows[1]).toMatchObject({ category: "meals", count: 1, amount: 100, pct: 20 })
  })

  it("counts by status including drafts", () => {
    const rows = countByStatus([req({ status: "draft" }), req({ status: "pending" }), req({ status: "pending" })])
    expect(rows.find((r) => r.status === "draft")?.count).toBe(1)
    expect(rows.find((r) => r.status === "pending")?.count).toBe(2)
  })

  it("ranks top vendors by spend and ignores vendorless requests", () => {
    const rows = topVendors([
      req({ vendor_id: "vendor-1", amount: 100 }),
      req({ vendor_id: "vendor-2", amount: 500 }),
      req({ vendor_id: undefined, amount: 9999 }),
    ])
    expect(rows[0]).toMatchObject({ vendorId: "vendor-2", amount: 500 })
    expect(rows).toHaveLength(2)
  })

  it("builds a real monthly trend from dates (deterministic)", () => {
    const now = new Date("2026-02-15T00:00:00Z")
    const points = monthlyTrend(
      [
        req({ status: "paid", amount: 100, submitted_at: "2026-02-01T00:00:00Z", approved_at: "2026-02-02T00:00:00Z", payment_date: "2026-02-03T00:00:00Z" }),
        req({ status: "pending", amount: 50, submitted_at: "2026-01-10T00:00:00Z" }),
      ],
      6,
      now,
    )
    expect(points).toHaveLength(6)
    const feb = points[points.length - 1]
    expect(feb.submitted).toBe(100)
    expect(feb.approved).toBe(100)
    expect(feb.paid).toBe(100)
    const jan = points[points.length - 2]
    expect(jan.submitted).toBe(50)
    expect(jan.paid).toBe(0)
  })

  it("computes department spend vs budget (approved + paid only)", () => {
    const rows = spendByDepartment(
      [
        req({ department_id: "dept-1", status: "approved", amount: 400 }),
        req({ department_id: "dept-1", status: "pending", amount: 1000 }), // excluded
        req({ department_id: "dept-2", status: "paid", amount: 250 }),
      ],
      departments,
    )
    expect(rows.find((r) => r.departmentId === "dept-1")).toMatchObject({ spend: 400, budget: 1000, pct: 40 })
    expect(rows.find((r) => r.departmentId === "dept-2")).toMatchObject({ spend: 250, budget: 500, pct: 50 })
  })
})

// --- CSV / export ---------------------------------------------------------

describe("CSV export", () => {
  it("escapes fields containing commas, quotes, and newlines", () => {
    expect(escapeCSVField("plain")).toBe("plain")
    expect(escapeCSVField("a,b")).toBe('"a,b"')
    expect(escapeCSVField('say "hi"')).toBe('"say ""hi"""')
    expect(escapeCSVField("line1\nline2")).toBe('"line1\nline2"')
    expect(escapeCSVField(null)).toBe("")
  })

  it("builds CSV with a BOM and CRLF rows", () => {
    const csv = toCSV([
      ["a", "b"],
      ["1", "2"],
    ])
    expect(csv.startsWith("\uFEFF")).toBe(true)
    expect(csv).toContain("\r\n")
  })

  it("builds a report whose CSV includes a header and one row per request", () => {
    const requests = [req({ request_number: "REQ-1", amount: 100 }), req({ request_number: "REQ-2", amount: 200 })]
    const { csv, html } = buildExpenseReport({ requests, departments, vendors, users, organizationName: "Acme" })
    const lines = csv.replace("\uFEFF", "").split("\r\n")
    expect(lines[0]).toContain("Request #")
    expect(lines).toHaveLength(3) // header + 2 rows
    expect(csv).toContain("REQ-1")
    expect(csv).toContain("REQ-2")
    // HTML report is well-formed and escapes vendor names with quotes.
    expect(html).toContain("<!doctype html>")
    expect(html).toContain("Acme")
    expect(html).not.toContain('Bob "The" Supplier, Inc.</td>') // raw quotes must be escaped
  })

  it("escapes HTML-sensitive characters in the printable report", () => {
    const requests = [req({ purpose: "<script>alert(1)</script>" })]
    const { html } = buildExpenseReport({ requests, departments, vendors, users })
    expect(html).not.toContain("<script>alert(1)</script>")
  })
})

// --- Email templates ------------------------------------------------------

describe("email templates", () => {
  it("renders an approved email with subject, html, and text", () => {
    const email = requestApprovedEmail({ recipientName: "Eve", requestNumber: "REQ-9", amount: "$100.00", approverName: "Max", url: "https://app/x" })
    expect(email.subject).toContain("REQ-9")
    expect(email.html).toContain("REQ-9")
    expect(email.html).toContain("Eve")
    expect(email.text).toContain("approved")
    expect(email.html).toContain("https://app/x")
  })

  it("renders a rejected email including the reason", () => {
    const email = requestRejectedEmail({ requestNumber: "REQ-9", amount: "$100.00", reason: "Missing receipt" })
    expect(email.subject).toContain("REQ-9")
    expect(email.html).toContain("Missing receipt")
    expect(email.text).toContain("Missing receipt")
  })

  it("escapes untrusted content in templates", () => {
    const email = requestRejectedEmail({ requestNumber: "REQ-9", amount: "$1", reason: "<b>x</b>" })
    expect(email.html).not.toContain("<b>x</b>")
    expect(email.html).toContain("&lt;b&gt;x&lt;/b&gt;")
  })

  it("renders an invitation email with the accept link", () => {
    const email = invitationEmail({ organizationName: "Acme", inviterName: "Max", role: "manager", url: "https://app/signup?invitation=tok" })
    expect(email.subject).toContain("Acme")
    expect(email.html).toContain("https://app/signup?invitation=tok")
    expect(email.text).toContain("manager")
  })

  it("renders a budget alert email that reflects over-budget state", () => {
    const email = budgetAlertEmail({ departmentName: "Engineering", percentage: 120, spend: "$1,200", budget: "$1,000" })
    expect(email.subject.toLowerCase()).toContain("over budget")
    expect(email.html).toContain("120%")
  })
})
