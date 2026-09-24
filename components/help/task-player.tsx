"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, ExternalLink, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AnnotatedShot } from "./annotated-shot"
import type { GuideTask } from "./guide-data"

/** Step-by-step walkthrough: the screenshot spotlights the spot for the step you're on. */
export function TaskPlayer({ task, onClose }: { task: GuideTask | null; onClose: () => void }) {
  return (
    <Dialog open={!!task} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl gap-0 p-0 sm:p-0 overflow-hidden">
        {/* keyed, so every task starts again at step 1 */}
        {task && <Walkthrough key={task.id} task={task} />}
      </DialogContent>
    </Dialog>
  )
}

function Walkthrough({ task }: { task: GuideTask }) {
  const [step, setStep] = useState(0)
  const last = task.steps.length - 1

  // ← → move between steps.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setStep((s) => Math.min(s + 1, last))
      if (e.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [last])

  const done = step === last

  return (
    <>
          <div className="grid max-h-[calc(100dvh-1.5rem)] overflow-y-auto md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
            <div className="bg-secondary/40 p-4 pt-12 sm:p-5 sm:pt-12 md:border-r md:border-border/60 md:pt-5">
              <AnnotatedShot image={task.image} active={step + 1} alt={`${task.title}: screen with step ${step + 1} highlighted`} priority />
            </div>

            <div className="flex flex-col gap-4 p-5 sm:p-6">
              <DialogHeader className="pr-6">
                <DialogTitle className="font-heading text-lg">{task.title}</DialogTitle>
                <DialogDescription>
                  Step {step + 1} of {task.steps.length}
                </DialogDescription>
              </DialogHeader>

              <ol className="flex flex-col gap-1.5">
                {task.steps.map((text, i) => {
                  const state = i === step ? "active" : i < step ? "done" : "todo"
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => setStep(i)}
                        aria-current={state === "active" ? "step" : undefined}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-xl border p-2.5 text-left text-sm transition-colors",
                          state === "active" && "border-primary/40 bg-primary/5 font-medium",
                          state === "done" && "border-transparent text-muted-foreground",
                          state === "todo" && "border-transparent text-muted-foreground hover:bg-secondary/60",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                            state === "active" && "bg-primary text-primary-foreground",
                            state === "done" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                            state === "todo" && "bg-secondary text-muted-foreground",
                          )}
                        >
                          {state === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                        </span>
                        <span className="leading-snug">{text}</span>
                      </button>
                    </li>
                  )
                })}
              </ol>

              {done && task.tip && (
                <div className="flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-sm">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{task.tip}</span>
                </div>
              )}

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                <Button variant="outline" size="sm" className="bg-transparent" disabled={step === 0} onClick={() => setStep((s) => Math.max(s - 1, 0))}>
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
                </Button>
                {done ? (
                  <Button size="sm" asChild className="font-semibold">
                    <Link href={task.href}>
                      {task.openLabel} <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" className="font-semibold" onClick={() => setStep((s) => Math.min(s + 1, last))}>
                    Next <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                )}
                <span className="ml-auto hidden text-[11px] text-muted-foreground sm:inline">Tip: use ← → keys</span>
              </div>
            </div>
          </div>
    </>
  )
}
