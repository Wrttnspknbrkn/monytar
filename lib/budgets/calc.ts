// Pure budget math: spend-vs-budget status, threshold alert levels, and
// pre-approval budget checks. No I/O so it is trivially testable and reused by
// both the demo store and server-side enforcement.

import type { AlertType } from "@/lib/types"

export type BudgetLevel = "none" | "warning" | "critical" | "exceeded"

export interface BudgetThresholds {
  /** Percent (0-100) at which a warning is raised. */
  warning: number
  /** Percent (0-100) at which a critical alert is raised. */
  critical: number
  /** Percent (0-100) at which the budget is considered exceeded. */
  exceeded: number
}

export const DEFAULT_BUDGET_THRESHOLDS: BudgetThresholds = {
  warning: 75,
  critical: 90,
  exceeded: 100,
}

export interface BudgetStatus {
  spend: number
  budget: number
  /** Remaining budget; negative when overspent. */
  remaining: number
  /** Spend as a percentage of budget (0+). 0 when there is no budget. */
  percentage: number
  level: BudgetLevel
}

/**
 * Computes the current budget status for a department/period.
 * A zero or negative budget means "untracked" → level "none", percentage 0.
 */
export function computeBudgetStatus(
  spend: number,
  budget: number,
  thresholds: BudgetThresholds = DEFAULT_BUDGET_THRESHOLDS,
): BudgetStatus {
  const safeSpend = Number.isFinite(spend) && spend > 0 ? spend : 0
  const safeBudget = Number.isFinite(budget) && budget > 0 ? budget : 0

  if (safeBudget === 0) {
    return { spend: safeSpend, budget: 0, remaining: 0, percentage: 0, level: "none" }
  }

  const percentage = Math.round((safeSpend / safeBudget) * 100)
  const remaining = safeBudget - safeSpend

  let level: BudgetLevel = "none"
  if (percentage >= thresholds.exceeded) level = "exceeded"
  else if (percentage >= thresholds.critical) level = "critical"
  else if (percentage >= thresholds.warning) level = "warning"

  return { spend: safeSpend, budget: safeBudget, remaining, percentage, level }
}

/** Maps an internal budget level to the DB `budget_alerts.alert_type` value. */
export function budgetLevelToAlertType(level: BudgetLevel): AlertType | null {
  switch (level) {
    case "warning":
    case "critical":
      return "approaching_limit"
    case "exceeded":
      return "over_budget"
    default:
      return null
  }
}

/**
 * Determines whether approving `newAmount` would push the department over budget.
 * Returns the projected status so callers can warn or block.
 */
export function projectBudgetAfter(
  currentSpend: number,
  budget: number,
  newAmount: number,
  thresholds: BudgetThresholds = DEFAULT_BUDGET_THRESHOLDS,
): { wouldExceed: boolean; status: BudgetStatus } {
  const projectedSpend = (currentSpend > 0 ? currentSpend : 0) + (newAmount > 0 ? newAmount : 0)
  const status = computeBudgetStatus(projectedSpend, budget, thresholds)
  return { wouldExceed: status.level === "exceeded", status }
}
