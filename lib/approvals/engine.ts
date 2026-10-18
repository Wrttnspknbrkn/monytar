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

// ---------------------------------------------------------------------------------------------
// Enforcing the chain on real requests
//
// The manager stage is recorded on the request itself (metadata.manager_approved_at) so a request can stay
// "pending" between the manager's approval and Finance's. The server's approve/reject routes and the app's
// approval queues all ask this one function, so what the screen offers and what the server accepts can't drift.

/** True once a manager has signed off on a request that is still waiting for a later stage. */
export function isManagerApproved(metadata: unknown): boolean {
  return typeof metadata === "object" && metadata !== null && typeof (metadata as Record<string, unknown>).manager_approved_at === "string"
}

export type ApprovalDecision =
  | { allowed: true; /** true when this approval completes the request */ finalizes: boolean; stage: ApprovalStage | null }
  | { allowed: false; reason: string }

/**
 * May someone in `role` approve (or reject) this pending request right now, and would that finish it?
 *
 *  - A request below the finance threshold needs one approval: the manager's (Finance or an admin can also give it).
 *  - A request at/above the threshold (or when Finance review is switched on) needs the manager first, then Finance.
 *    A manager's approval alone leaves it pending for Finance. Finance or an admin approving finishes it.
 *  - If only Finance review is required (manager approval switched off), a manager can't approve it.
 */
export function decideApproval(input: {
  role: UserRole
  amount: number
  settings: BuildChainOptions["settings"]
  managerApproved: boolean
}): ApprovalDecision {
  const { role, amount, settings, managerApproved } = input
  if (role !== "manager" && role !== "finance" && role !== "admin") {
    return { allowed: false, reason: "Only managers, Finance and admins can approve requests." }
  }

  const stages = buildApprovalChain({ amount, settings }).map((s) =>
    s.role === "manager" && managerApproved ? { ...s, status: "approved" as ApprovalStatus } : s,
  )

  // Settings changed after submission (e.g. the limit was raised): nothing left to wait for, so one approval finishes it.
  if (stages.length === 0) return { allowed: true, finalizes: true, stage: null }

  const current = getCurrentStage(stages)
  if (!current) return { allowed: true, finalizes: true, stage: null }

  if (!canActOnStage(role, current)) {
    return {
      allowed: false,
      reason:
        current.role === "finance"
          ? managerApproved
            ? "A manager has already approved this. It is now waiting for Finance."
            : "This request needs a Finance review."
          : "This request is waiting for a manager's approval.",
    }
  }

  const isLast = stages.indexOf(current) === stages.length - 1
  return { allowed: true, finalizes: role !== "manager" || isLast, stage: current }
}
