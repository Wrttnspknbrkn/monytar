"use client"

import { useState } from "react"
import { Check, FileText, Zap, UserCheck, Scale, Banknote, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { buildApprovalChain, isReceiptRequired, shouldAutoApprove } from "@/lib/approvals/engine"
import { EXAMPLE_AMOUNTS, EXAMPLE_RULES } from "./handbook-content"

const fmt = (n: number) => n.toLocaleString("en-US")

/**
 * Drag the amount, see what would happen to it. The rules are an example — every
 * company sets its own amounts in Settings.
 */
export function ApprovalSimulator() {
  const [amount, setAmount] = useState(140)
  const { autoApproveUnder, receiptFrom, financeReviewFrom, max } = EXAMPLE_RULES

  const auto = shouldAutoApprove(amount, { auto_approve_under_amount: autoApproveUnder })
  const receipt = isReceiptRequired(amount, { require_receipts: true, receipt_required_above_amount: receiptFrom })
  const chain = buildApprovalChain({
    amount,
    settings: {
      auto_approve_under_amount: autoApproveUnder,
      require_manager_approval: true,
      require_finance_approval: false,
      approval_threshold_amount: financeReviewFrom,
    },
  })
  const needsFinance = chain.some((s) => s.role === "finance")

  const steps = [
    { key: "submit", label: "You submit", icon: Send, on: true },
    { key: "manager", label: "Manager reviews", icon: UserCheck, on: !auto },
    { key: "finance", label: "Finance reviews", icon: Scale, on: needsFinance },
    { key: "done", label: auto ? "Approved instantly" : "Approved", icon: Zap, on: true },
    { key: "paid", label: "Finance pays", icon: Banknote, on: true },
  ]

  const outcome = auto
    ? "Small enough to skip review. It's approved the moment you submit."
    : needsFinance
      ? "Bigger spend gets two sets of eyes: your manager first, then finance."
      : "Your manager reviews it. Once they approve, finance pays it."

  const pct = (amount / max) * 100

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      {/* controls */}
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="sim-amount" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            If I spend
          </label>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-5xl tracking-tight">{fmt(amount)}</span>
            <span className="text-sm font-medium text-muted-foreground">in your currency</span>
          </div>
        </div>

        <div className="relative pt-2">
          <input
            id="sim-amount"
            type="range"
            min={0}
            max={max}
            step={10}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            aria-label="Expense amount"
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary accent-primary [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md"
            style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${pct}%, hsl(var(--secondary)) ${pct}%)` }}
          />
          <div className="relative mt-3 h-6 text-[10px] font-medium text-muted-foreground">
            {[
              { at: 0, label: "0", edge: "left" },
              { at: financeReviewFrom, label: fmt(financeReviewFrom), edge: "mid" },
              { at: max, label: fmt(max), edge: "right" },
            ].map((m) => (
              <span key={m.at} className={cn("absolute", m.edge === "mid" ? "-translate-x-1/2" : m.edge === "right" ? "-translate-x-full" : "")} style={{ left: `${(m.at / max) * 100}%` }}>
                <span className={cn("mb-0.5 block h-1.5 w-px bg-border", m.edge === "mid" ? "mx-auto" : m.edge === "right" ? "ml-auto" : "")} />
                {m.label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {EXAMPLE_AMOUNTS.map((e) => (
            <button
              key={e.label}
              type="button"
              onClick={() => setAmount(e.amount)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                amount === e.amount ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/40",
              )}
            >
              {e.label} · {fmt(e.amount)}
            </button>
          ))}
        </div>

        <ul className="space-y-1.5 rounded-2xl border border-border/60 bg-secondary/30 p-4 text-xs text-muted-foreground">
          <li>Under <b className="text-foreground">{fmt(autoApproveUnder)}</b>: approved automatically</li>
          <li><b className="text-foreground">{fmt(receiptFrom)}</b> or more: a receipt is required</li>
          <li><b className="text-foreground">{fmt(financeReviewFrom)}</b> or more: finance reviews too</li>
          <li className="pt-1 italic">Example rules. Your company sets its own amounts.</li>
        </ul>
      </div>

      {/* result */}
      <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <ol className="flex flex-col gap-0">
          {steps.map((s, i) => {
            const Icon = s.icon
            const last = i === steps.length - 1
            return (
              <li key={s.key} className="relative flex items-center gap-3 pb-4 last:pb-0">
                {!last && <span className={cn("absolute left-[17px] top-9 h-[calc(100%-20px)] w-0.5 transition-colors duration-300", s.on && steps[i + 1].on ? "bg-primary/40" : "bg-border")} />}
                <span
                  className={cn(
                    "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 motion-reduce:transition-none",
                    s.on ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25" : "border-dashed border-border bg-card text-muted-foreground/40",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className={cn("text-sm transition-colors", s.on ? "font-semibold" : "text-muted-foreground/50 line-through decoration-1")}>{s.label}</span>
              </li>
            )
          })}
        </ol>

        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl border p-3 text-sm transition-colors",
            receipt ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/40 dark:bg-amber-900/10 dark:text-amber-200" : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-900/10 dark:text-emerald-200",
          )}
        >
          {receipt ? <FileText className="h-4 w-4 shrink-0" /> : <Check className="h-4 w-4 shrink-0" strokeWidth={3} />}
          <span>{receipt ? "A receipt is required before you can submit." : "No receipt needed at this amount."}</span>
        </div>

        <p key={outcome} className="animate-fade-in text-sm font-medium">{outcome}</p>
      </div>
    </div>
  )
}
