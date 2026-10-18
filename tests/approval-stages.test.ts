import { describe, expect, it } from "vitest"
import { decideApproval, isManagerApproved } from "@/lib/approvals/engine"

// 50 auto-approves, 2,000+ needs Finance as well as the manager (the example rules used across the product).
const rules = { auto_approve_under_amount: 50, require_manager_approval: true, require_finance_approval: false, approval_threshold_amount: 2000 }
const decide = (role: "manager" | "finance" | "admin" | "employee", amount: number, managerApproved = false, settings = rules) =>
  decideApproval({ role: role as never, amount, settings, managerApproved })

describe("approval chain enforcement", () => {
  it("below the finance threshold, one approval finishes it, from a manager, finance or an admin", () => {
    for (const role of ["manager", "finance", "admin"] as const) expect(decide(role, 800)).toMatchObject({ allowed: true, finalizes: true })
  })

  it("at or above the threshold a manager's approval does NOT finish the request", () => {
    expect(decide("manager", 2000)).toMatchObject({ allowed: true, finalizes: false })
    expect(decide("manager", 2500)).toMatchObject({ allowed: true, finalizes: false })
  })

  it("once the manager has approved, they can't act again, and Finance finishes it", () => {
    const again = decide("manager", 2500, true)
    expect(again.allowed).toBe(false)
    expect((again as { reason: string }).reason).toMatch(/waiting for Finance/)
    expect(decide("finance", 2500, true)).toMatchObject({ allowed: true, finalizes: true })
  })

  it("Finance or an admin can finish a large request without waiting for the manager", () => {
    expect(decide("finance", 2500, false)).toMatchObject({ allowed: true, finalizes: true })
    expect(decide("admin", 2500, false)).toMatchObject({ allowed: true, finalizes: true })
  })

  it("when Finance review is switched on for everything, a manager's approval still isn't final", () => {
    const all = { ...rules, require_finance_approval: true }
    expect(decide("manager", 100, false, all)).toMatchObject({ allowed: true, finalizes: false })
    expect(decide("finance", 100, true, all)).toMatchObject({ allowed: true, finalizes: true })
  })

  it("when only Finance review is required, a manager can't approve", () => {
    const financeOnly = { ...rules, require_manager_approval: false, require_finance_approval: true }
    const d = decide("manager", 100, false, financeOnly)
    expect(d.allowed).toBe(false)
    expect((d as { reason: string }).reason).toMatch(/Finance review/)
    expect(decide("finance", 100, false, financeOnly)).toMatchObject({ allowed: true, finalizes: true })
  })

  it("employees can never approve", () => {
    expect(decide("employee", 100).allowed).toBe(false)
  })

  it("if the rules changed so nothing is needed any more, one approval finishes it", () => {
    expect(decide("manager", 10, false, { ...rules, auto_approve_under_amount: 100 })).toMatchObject({ allowed: true, finalizes: true })
  })

  it("reads the manager's sign-off from the request's metadata", () => {
    expect(isManagerApproved({ manager_approved_at: "2026-10-18T10:00:00Z" })).toBe(true)
    expect(isManagerApproved({})).toBe(false)
    expect(isManagerApproved(null)).toBe(false)
    expect(isManagerApproved(undefined)).toBe(false)
  })
})
