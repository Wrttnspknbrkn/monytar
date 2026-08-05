// Pure approval-workflow engine. Given an org's settings and a request amount,
// it decides the ordered approval chain, whether a request auto-approves, and
// whether a receipt is required. It also advances a chain as approvers act.
// No I/O — the demo store and the server API both build on these primitives.

import type { OrganizationSettings, UserRole, ApprovalStatus } from "@/lib/types"

export interface ApprovalStageInput {
  /** Role responsible for this stage. */
  role: Extract<UserRole, "manager" | "finance">
  /** Resolved approver user id, when known. */
  approverId?: string
}

export interface ApprovalStage extends ApprovalStageInput {
  sequence: number
  status: ApprovalStatus
}

export interface BuildChainOptions {
  amount: number
  settings: Pick<
    OrganizationSettings,
    "auto_approve_under_amount" | "require_manager_approval" | "require_finance_approval" | "approval_threshold_amount"
  >
  managerId?: string
  financeUserId?: string
}

/** Whether a request auto-approves (amount strictly under the configured floor). */
export function shouldAutoApprove(
  amount: number,
  settings: Pick<OrganizationSettings, "auto_approve_under_amount">,
): boolean {
  const floor = settings.auto_approve_under_amount
  if (typeof floor !== "number" || floor <= 0) return false
  return amount > 0 && amount < floor
}

/** Whether a receipt must be attached for this amount. */
export function isReceiptRequired(
  amount: number,
  settings: Pick<OrganizationSettings, "require_receipts" | "receipt_required_above_amount">,
): boolean {
  if (!settings.require_receipts) return false
  const threshold = settings.receipt_required_above_amount ?? 0
  return amount >= threshold
}

/**
 * Builds the ordered approval chain for a request.
 * - Sub-threshold amounts that auto-approve produce an empty chain.
 * - Manager stage precedes finance stage when both are required.
 * - A finance stage is always added for amounts at/above the approval threshold,
 *   even if `require_finance_approval` is off, so large spend gets a second set of eyes.
 */
export function buildApprovalChain(opts: BuildChainOptions): ApprovalStage[] {
  const { amount, settings, managerId, financeUserId } = opts

  if (shouldAutoApprove(amount, settings)) return []

  const stages: ApprovalStageInput[] = []

  if (settings.require_manager_approval) {
    stages.push({ role: "manager", approverId: managerId })
  }

  const overThreshold =
    typeof settings.approval_threshold_amount === "number" &&
    settings.approval_threshold_amount > 0 &&
    amount >= settings.approval_threshold_amount

  if (settings.require_finance_approval || overThreshold) {
    stages.push({ role: "finance", approverId: financeUserId })
  }

  // Guarantee at least one approval stage for non-auto-approved requests.
  if (stages.length === 0) {
    stages.push({ role: "manager", approverId: managerId })
  }

  return stages.map((s, i) => ({ ...s, sequence: i + 1, status: "pending" as ApprovalStatus }))
}

export interface ChainProgress {
  /** Overall request status implied by the chain state. */
  requestStatus: "pending" | "approved" | "rejected"
  /** The stage awaiting action, or null when the chain is finished. */
  currentStage: ApprovalStage | null
  stages: ApprovalStage[]
}

/** Returns the first pending stage (the one currently awaiting a decision). */
export function getCurrentStage(stages: ApprovalStage[]): ApprovalStage | null {
  return stages.find((s) => s.status === "pending") ?? null
}

/**
 * Applies an approver's decision to the stage at `sequence` and returns the
 * resulting chain progress. A rejection finalizes the whole request; an approval
 * advances to the next stage, or finalizes as approved when it was the last one.
 */
export function applyDecision(
  stages: ApprovalStage[],
  sequence: number,
  decision: "approved" | "rejected",
): ChainProgress {
  const next = stages.map((s) => ({ ...s }))
  const target = next.find((s) => s.sequence === sequence)

  if (target && target.status === "pending") {
    target.status = decision
  }

  if (decision === "rejected") {
    // Downstream stages never get a turn once a request is rejected.
    for (const s of next) {
      if (s.status === "pending" && s.sequence > sequence) s.status = "skipped"
    }
    return { requestStatus: "rejected", currentStage: null, stages: next }
  }

  const current = getCurrentStage(next)
  return {
    requestStatus: current ? "pending" : "approved",
    currentStage: current,
    stages: next,
  }
}

/** Determines whether a user in `role` may act on `stage`. Admin/finance can act on any stage. */
export function canActOnStage(role: UserRole, stage: ApprovalStage | null): boolean {
  if (!stage) return false
  if (role === "admin") return true
  if (role === "finance") return true // finance can action manager or finance stages
  if (role === "manager") return stage.role === "manager"
  return false
}
