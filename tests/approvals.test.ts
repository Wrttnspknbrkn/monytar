import { describe, it, expect } from "vitest"
import type { OrganizationSettings } from "@/lib/types"
import {
  shouldAutoApprove,
  isReceiptRequired,
  buildApprovalChain,
  getCurrentStage,
  applyDecision,
  canActOnStage,
  type ApprovalStage,
} from "@/lib/approvals/engine"
import {
  computeBudgetStatus,
  budgetLevelToAlertType,
  projectBudgetAfter,
  DEFAULT_BUDGET_THRESHOLDS,
} from "@/lib/budgets/calc"
import {
  formatMoney,
  convertCurrency,
  isSupportedCurrency,
  getCurrencySymbol,
  getCurrencyMeta,
} from "@/lib/currency"

// Minimal settings factory for engine tests.
function settings(overrides: Partial<OrganizationSettings> = {}): OrganizationSettings {
  return {
    id: "s1",
    organization_id: "o1",
    approval_threshold_amount: 1000,
    require_manager_approval: true,
    require_finance_approval: false,
    auto_approve_under_amount: 50,
    budget_alert_thresholds: { warning: 75, critical: 90, exceeded: 100 },
    require_receipts: true,
    receipt_required_above_amount: 25,
    default_currency: "USD",
    fiscal_year_start: "01-01",
    email_notifications_enabled: true,
    expense_categories: [],
    ...overrides,
  }
}

describe("approval engine — auto-approve", () => {
  it("auto-approves strictly under the floor", () => {
    expect(shouldAutoApprove(49.99, settings())).toBe(true)
  })
  it("does not auto-approve at/above the floor", () => {
    expect(shouldAutoApprove(50, settings())).toBe(false)
    expect(shouldAutoApprove(500, settings())).toBe(false)
  })
  it("never auto-approves when floor is missing or zero", () => {
    expect(shouldAutoApprove(10, settings({ auto_approve_under_amount: 0 }))).toBe(false)
    expect(shouldAutoApprove(10, settings({ auto_approve_under_amount: undefined }))).toBe(false)
  })
  it("never auto-approves non-positive amounts", () => {
    expect(shouldAutoApprove(0, settings())).toBe(false)
    expect(shouldAutoApprove(-5, settings())).toBe(false)
  })
})

describe("approval engine — receipt requirement", () => {
  it("requires a receipt at/above the threshold", () => {
    expect(isReceiptRequired(25, settings())).toBe(true)
    expect(isReceiptRequired(1000, settings())).toBe(true)
  })
  it("does not require a receipt below the threshold", () => {
    expect(isReceiptRequired(24.99, settings())).toBe(false)
  })
  it("never requires a receipt when disabled org-wide", () => {
    expect(isReceiptRequired(9999, settings({ require_receipts: false }))).toBe(false)
  })
})

describe("approval engine — chain construction", () => {
  it("produces an empty chain for auto-approved requests", () => {
    expect(buildApprovalChain({ amount: 10, settings: settings() })).toEqual([])
  })
  it("builds a single manager stage for a normal amount", () => {
    const chain = buildApprovalChain({ amount: 200, settings: settings() })
    expect(chain).toHaveLength(1)
    expect(chain[0]).toMatchObject({ role: "manager", sequence: 1, status: "pending" })
  })
  it("adds a finance stage above the approval threshold", () => {
    const chain = buildApprovalChain({ amount: 5000, settings: settings() })
    expect(chain.map((s) => s.role)).toEqual(["manager", "finance"])
    expect(chain.map((s) => s.sequence)).toEqual([1, 2])
  })
  it("adds finance when finance approval is required regardless of amount", () => {
    const chain = buildApprovalChain({ amount: 200, settings: settings({ require_finance_approval: true }) })
    expect(chain.map((s) => s.role)).toEqual(["manager", "finance"])
  })
  it("guarantees at least one stage when nothing else is required", () => {
    const chain = buildApprovalChain({
      amount: 200,
      settings: settings({ require_manager_approval: false, require_finance_approval: false }),
    })
    expect(chain).toHaveLength(1)
  })
  it("assigns resolved approver ids", () => {
    const chain = buildApprovalChain({
      amount: 5000,
      settings: settings(),
      managerId: "m1",
      financeUserId: "f1",
    })
    expect(chain[0].approverId).toBe("m1")
    expect(chain[1].approverId).toBe("f1")
  })
})

describe("approval engine — decision flow", () => {
  const twoStage: ApprovalStage[] = [
    { role: "manager", sequence: 1, status: "pending" },
    { role: "finance", sequence: 2, status: "pending" },
  ]

  it("returns the first pending stage as current", () => {
    expect(getCurrentStage(twoStage)?.sequence).toBe(1)
  })
  it("advances to the next stage after an approval", () => {
    const result = applyDecision(twoStage, 1, "approved")
    expect(result.requestStatus).toBe("pending")
    expect(result.currentStage?.sequence).toBe(2)
  })
  it("finalizes as approved after the last stage approves", () => {
    const afterFirst = applyDecision(twoStage, 1, "approved").stages
    const result = applyDecision(afterFirst, 2, "approved")
    expect(result.requestStatus).toBe("approved")
    expect(result.currentStage).toBeNull()
  })
  it("rejection finalizes and skips downstream stages", () => {
    const result = applyDecision(twoStage, 1, "rejected")
    expect(result.requestStatus).toBe("rejected")
    expect(result.stages.find((s) => s.sequence === 2)?.status).toBe("skipped")
  })
  it("does not mutate the input stages", () => {
    applyDecision(twoStage, 1, "approved")
    expect(twoStage[0].status).toBe("pending")
  })
})

describe("approval engine — authority", () => {
  const stage: ApprovalStage = { role: "manager", sequence: 1, status: "pending" }
  it("admin and finance can act on any stage", () => {
    expect(canActOnStage("admin", stage)).toBe(true)
    expect(canActOnStage("finance", stage)).toBe(true)
  })
  it("manager can only act on manager stages", () => {
    expect(canActOnStage("manager", stage)).toBe(true)
    expect(canActOnStage("manager", { role: "finance", sequence: 2, status: "pending" })).toBe(false)
  })
  it("employees can never act, and null stage is never actionable", () => {
    expect(canActOnStage("employee", stage)).toBe(false)
    expect(canActOnStage("admin", null)).toBe(false)
  })
})

describe("budget math", () => {
  it("returns level 'none' for an untracked (zero) budget", () => {
    expect(computeBudgetStatus(500, 0).level).toBe("none")
    expect(computeBudgetStatus(500, 0).percentage).toBe(0)
  })
  it("computes percentage and remaining", () => {
    const s = computeBudgetStatus(750, 1000)
    expect(s.percentage).toBe(75)
    expect(s.remaining).toBe(250)
  })
  it("classifies threshold levels", () => {
    expect(computeBudgetStatus(500, 1000).level).toBe("none")
    expect(computeBudgetStatus(750, 1000).level).toBe("warning")
    expect(computeBudgetStatus(900, 1000).level).toBe("critical")
    expect(computeBudgetStatus(1000, 1000).level).toBe("exceeded")
    expect(computeBudgetStatus(1200, 1000).level).toBe("exceeded")
  })
  it("reports negative remaining when overspent", () => {
    expect(computeBudgetStatus(1200, 1000).remaining).toBe(-200)
  })
  it("maps levels to DB alert types", () => {
    expect(budgetLevelToAlertType("none")).toBeNull()
    expect(budgetLevelToAlertType("warning")).toBe("approaching_limit")
    expect(budgetLevelToAlertType("critical")).toBe("approaching_limit")
    expect(budgetLevelToAlertType("exceeded")).toBe("over_budget")
  })
  it("projects whether a new approval would exceed budget", () => {
    const under = projectBudgetAfter(500, 1000, 200)
    expect(under.wouldExceed).toBe(false)
    const over = projectBudgetAfter(900, 1000, 200)
    expect(over.wouldExceed).toBe(true)
  })
  it("uses the default thresholds constant", () => {
    expect(DEFAULT_BUDGET_THRESHOLDS).toEqual({ warning: 75, critical: 90, exceeded: 100 })
  })
})

describe("multi-currency", () => {
  it("recognizes supported currencies case-insensitively", () => {
    expect(isSupportedCurrency("usd")).toBe(true)
    expect(isSupportedCurrency("EUR")).toBe(true)
    expect(isSupportedCurrency("XYZ")).toBe(false)
  })
  it("returns correct symbols and decimals", () => {
    expect(getCurrencySymbol("GBP")).toBe("£")
    expect(getCurrencyMeta("JPY").decimals).toBe(0)
  })
  it("formats amounts with the right decimals", () => {
    expect(formatMoney(1234.5, "USD")).toBe("$1,234.50")
    // JPY has no minor units.
    expect(formatMoney(1234, "JPY")).toBe("¥1,234")
  })
  it("falls back to USD formatting for unknown codes", () => {
    expect(formatMoney(10, "XYZ")).toBe("$10.00")
  })
  it("returns the same amount when converting to the same currency", () => {
    expect(convertCurrency(100, "USD", "USD")).toBe(100)
  })
  it("converts through the USD base table and rounds to target decimals", () => {
    // 156 USD -> JPY at rate 156 with 0 decimals.
    expect(convertCurrency(1, "USD", "JPY")).toBe(156)
    // Round trip stays close.
    expect(convertCurrency(convertCurrency(100, "USD", "EUR"), "EUR", "USD")).toBeCloseTo(100, 0)
  })
  it("treats non-finite amounts as zero", () => {
    expect(convertCurrency(Number.NaN, "USD", "EUR")).toBe(0)
  })
})
