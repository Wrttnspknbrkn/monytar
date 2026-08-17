import type { ExpenseRequest, Department, Vendor, User } from "@/lib/types"
import { getCategoryLabel } from "@/lib/utils"
import { formatMoney } from "@/lib/currency"
import { computeTotals, spendByCategory, spendByDepartment, topVendors } from "@/lib/reports/aggregate"

/**
 * Pure export builders. Produce CSV text and a self-contained printable HTML
 * document from expense data. No DOM/browser APIs here so this is unit-testable;
 * the actual file download / print lives in `lib/reports/download.ts`.
 */

/** RFC-4180-safe CSV field escaping. */
export function escapeCSVField(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value)
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/** Turns a matrix of rows into CSV text (prefixed with UTF-8 BOM for Excel). */
export function toCSV(rows: (string | number)[][]): string {
  const body = rows.map((row) => row.map(escapeCSVField).join(",")).join("\r\n")
  return `\uFEFF${body}`
}

function escapeHTML(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value)
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export type ReportInput = {
  requests: ExpenseRequest[]
  departments: Department[]
  vendors: Vendor[]
  users: User[]
  organizationName?: string
  generatedAt?: Date
}

export type BuiltReport = { csv: string; html: string }

/** Builds both a detailed CSV and a printable HTML summary from the same data. */
export function buildExpenseReport(input: ReportInput): BuiltReport {
  const { requests, departments, vendors, users, organizationName = "Organization" } = input
  const generatedAt = input.generatedAt ?? new Date()

  const deptName = (id?: string) => departments.find((d) => d.id === id)?.name ?? ""
  const vendorName = (id?: string) => vendors.find((v) => v.id === id)?.name ?? ""
  const userName = (id?: string) => {
    const u = users.find((x) => x.id === id)
    return u?.full_name ?? u?.email ?? ""
  }

  // --- Detailed CSV: one row per request ---
  const header = [
    "Request #",
    "Date",
    "Employee",
    "Department",
    "Vendor",
    "Category",
    "Purpose",
    "Amount",
    "Currency",
    "Status",
    "Payment Status",
    "Submitted",
    "Approved By",
  ]
  const rows: (string | number)[][] = [header]
  for (const r of requests) {
    rows.push([
      r.request_number,
      (r.expense_date ?? r.created_at ?? "").slice(0, 10),
      userName(r.employee_id),
      deptName(r.department_id),
      vendorName(r.vendor_id),
      getCategoryLabel(r.category),
      r.purpose,
      r.amount,
      r.currency,
      r.status,
      r.payment_status,
      (r.submitted_at ?? "").slice(0, 10),
      userName(r.approved_by),
    ])
  }
  const csv = toCSV(rows)

  // --- Printable HTML summary ---
  const totals = computeTotals(requests)
  const byCategory = spendByCategory(requests)
  const byDept = spendByDepartment(requests, departments)
  const vendorsTop = topVendors(requests, 10)
  const currency = requests[0]?.currency || "USD"

  const summaryRows = [
    ["Total submitted", formatMoney(totals.submitted, currency)],
    ["Total approved", formatMoney(totals.approved, currency)],
    ["Total paid", formatMoney(totals.paid, currency)],
    ["Pending", formatMoney(totals.pending, currency)],
    ["Active requests", String(totals.count)],
    ["Average request", formatMoney(totals.avg, currency)],
  ]

  const categoryHTML = byCategory
    .map(
      (c) =>
        `<tr><td>${escapeHTML(getCategoryLabel(c.category))}</td><td class="num">${c.count}</td><td class="num">${escapeHTML(formatMoney(c.amount, currency))}</td><td class="num">${c.pct}%</td></tr>`,
    )
    .join("")

  const deptHTML = byDept
    .map((d) => {
      const name = deptName(d.departmentId) || "Unknown"
      return `<tr><td>${escapeHTML(name)}</td><td class="num">${escapeHTML(formatMoney(d.spend, currency))}</td><td class="num">${escapeHTML(formatMoney(d.budget, currency))}</td><td class="num">${d.pct}%</td></tr>`
    })
    .join("")

  const vendorHTML = vendorsTop
    .map(
      (v, i) =>
        `<tr><td class="num">${i + 1}</td><td>${escapeHTML(vendorName(v.vendorId) || "Unknown")}</td><td class="num">${v.count}</td><td class="num">${escapeHTML(formatMoney(v.amount, currency))}</td></tr>`,
    )
    .join("")

  const summaryHTML = summaryRows
    .map(([label, value]) => `<tr><td>${escapeHTML(label)}</td><td class="num">${escapeHTML(value)}</td></tr>`)
    .join("")

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Expense Report — ${escapeHTML(organizationName)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; margin: 40px; }
  header { border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 24px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .muted { color: #666; font-size: 13px; }
  h2 { font-size: 15px; margin: 28px 0 10px; text-transform: uppercase; letter-spacing: 0.04em; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 7px 10px; border-bottom: 1px solid #e5e5e5; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  footer { margin-top: 40px; color: #999; font-size: 11px; }
  @media print { body { margin: 16px; } }
</style>
</head>
<body>
  <header>
    <h1>Expense Report</h1>
    <div class="muted">${escapeHTML(organizationName)} &middot; Generated ${escapeHTML(generatedAt.toLocaleString("en-US"))}</div>
  </header>

  <h2>Summary</h2>
  <table><tbody>${summaryHTML}</tbody></table>

  <div class="grid">
    <div>
      <h2>Spend by Category</h2>
      <table>
        <thead><tr><th>Category</th><th class="num">Count</th><th class="num">Amount</th><th class="num">Share</th></tr></thead>
        <tbody>${categoryHTML || '<tr><td colspan="4" class="muted">No data</td></tr>'}</tbody>
      </table>
    </div>
    <div>
      <h2>Department Budgets</h2>
      <table>
        <thead><tr><th>Department</th><th class="num">Spent</th><th class="num">Budget</th><th class="num">Used</th></tr></thead>
        <tbody>${deptHTML || '<tr><td colspan="4" class="muted">No data</td></tr>'}</tbody>
      </table>
    </div>
  </div>

  <h2>Top Vendors</h2>
  <table>
    <thead><tr><th class="num">#</th><th>Vendor</th><th class="num">Requests</th><th class="num">Total Spend</th></tr></thead>
    <tbody>${vendorHTML || '<tr><td colspan="4" class="muted">No data</td></tr>'}</tbody>
  </table>

  <footer>Confidential — generated by ${escapeHTML(organizationName)} expense management.</footer>
</body>
</html>`

  return { csv, html }
}
