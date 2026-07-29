"use client"

import { CheckCircle2, XCircle, Clock, Circle, Zap } from "lucide-react"
import { buildApprovalChain, shouldAutoApprove } from "@/lib/approvals/engine"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ExpenseRequest, OrganizationSettings } from "@/lib/types"

interface ApprovalChainProps {
  request: ExpenseRequest
  settings: OrganizationSettings
}

type StageState = "approved" | "rejected" | "current" | "upcoming"

const ROLE_LABEL: Record<string, string> = {
  manager: "Manager approval",
  finance: "Finance approval",
}

/**
 * Visualizes the multi-level approval chain derived from org settings and the
 * request amount, reflecting the request's real status. Display-only.
 */
export function ApprovalChain({ request, settings }: ApprovalChainProps) {
  const autoApproved = shouldAutoApprove(request.amount, settings)

  const stages = buildApprovalChain({
    amount: request.amount,
    settings: {
      auto_approve_under_amount: settings.auto_approve_under_amount ?? 0,
      require_manager_approval: settings.require_manager_approval,
      require_finance_approval: settings.require_finance_approval,
      approval_threshold_amount: settings.approval_threshold_amount,
    },
  })

  // Derive each stage's visual state from the request's overall status.
  function stageState(index: number): StageState {
    if (request.status === "rejected") {
      // The last acted stage is the rejection point; earlier ones passed.
      return index === 0 ? "rejected" : "upcoming"
    }
    if (request.status === "approved" || request.status === "paid") return "approved"
    // pending: first stage is current, the rest upcoming
    return index === 0 ? "current" : "upcoming"
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="font-heading text-base font-bold">Approval Chain</CardTitle>
      </CardHeader>
      <CardContent>
        {autoApproved ? (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Auto-approved</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Amount is below the organization&apos;s auto-approval threshold, so no manual review was required.
              </p>
            </div>
          </div>
        ) : (
          <ol className="flex flex-col gap-0">
            {stages.map((stage, index) => {
              const state = stageState(index)
              const Icon =
                state === "approved"
                  ? CheckCircle2
                  : state === "rejected"
                    ? XCircle
                    : state === "current"
                      ? Clock
                      : Circle
              return (
                <li key={stage.sequence} className="flex gap-3 pb-4 last:pb-0 relative">
                  {index < stages.length - 1 && (
                    <div className="absolute left-[15px] top-8 w-[2px] h-[calc(100%-16px)] bg-border" />
                  )}
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 z-10 border",
                      state === "approved" && "bg-primary/10 border-primary/20 text-primary",
                      state === "rejected" && "bg-destructive/10 border-destructive/20 text-destructive",
                      state === "current" && "bg-secondary border-border text-foreground",
                      state === "upcoming" && "bg-secondary/40 border-border/50 text-muted-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="pt-1">
                    <p className="text-sm font-medium leading-tight">
                      {ROLE_LABEL[stage.role] ?? `${stage.role} approval`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                      {state === "current" ? "Awaiting decision" : state}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
