"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Building2, Check, MailPlus, PartyPopper } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AnnotatedShot } from "@/components/help/annotated-shot"
import { START_LINKS, START_PATHS } from "./handbook-content"

const PATH_ICON = { company: Building2, invited: MailPlus } as const

/** Two ways in — pick yours, then step through it on the real screens. */
export function GettingStarted() {
  const [pathId, setPathId] = useState<(typeof START_PATHS)[number]["id"]>("company")
  const [step, setStep] = useState(0)
  const path = START_PATHS.find((p) => p.id === pathId) ?? START_PATHS[0]
  const last = path.steps.length - 1
  const finished = step > last
  const current = path.steps[Math.min(step, last)]

  const pick = (id: typeof pathId) => {
    setPathId(id)
    setStep(0)
  }

  // ← → move between steps while this section is on screen and nothing else is focused.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && /input|textarea|select/i.test(t.tagName)) return
      if (document.querySelector('[role="dialog"]')) return
      const el = document.getElementById("start")
      if (!el) return
      const r = el.getBoundingClientRect()
      if (r.bottom < 0 || r.top > window.innerHeight * 0.6) return
      if (e.key === "ArrowRight") setStep((s) => Math.min(s + 1, last + 1))
      if (e.key === "ArrowLeft") setStep((s) => Math.max(s - 1, 0))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [last])

  return (
    <div className="flex flex-col gap-6">
      <div role="radiogroup" aria-label="How are you getting started?" className="grid gap-3 sm:grid-cols-2">
        {START_PATHS.map((p) => {
          const on = p.id === pathId
          const Icon = PATH_ICON[p.id]
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => pick(p.id)}
              className={cn(
                "flex items-center gap-4 rounded-3xl border p-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                on ? "border-primary bg-primary/[0.06] shadow-md shadow-primary/10" : "border-border/60 bg-card hover:border-primary/30",
              )}
            >
              <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors", on ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary")}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-xl tracking-tight">{p.label}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{p.who}</span>
              </span>
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
            </button>
          )
        })}
      </div>

      <div className="grid items-start gap-6 rounded-3xl border border-border/60 bg-card p-4 shadow-sm sm:p-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-10">
        <div className="mx-auto w-full max-w-[420px] lg:mx-0">
          {finished ? (
            <div className="flex aspect-[4/5] flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-emerald-500/[0.06] p-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <PartyPopper className="h-7 w-7" />
              </span>
              <p className="font-display text-2xl tracking-tight">You&apos;re set</p>
              <p className="text-sm text-muted-foreground">{path.done}</p>
            </div>
          ) : (
            <AnnotatedShot key={`${pathId}-${step}`} image={current.image} active={current.marker} alt={`${current.title}: screen with the relevant part highlighted`} priority />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{path.line}</p>
            <p className="mt-1 text-sm text-muted-foreground">{finished ? "All done." : `Step ${step + 1} of ${path.steps.length}`}</p>
          </div>

          <ol className="flex flex-col gap-1.5">
            {path.steps.map((s, i) => {
              const state = i === step ? "active" : i < step ? "done" : "todo"
              return (
                <li key={`${pathId}-${s.title}`}>
                  <button
                    type="button"
                    onClick={() => setStep(i)}
                    aria-current={state === "active" ? "step" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                      state === "active" && "border-primary/40 bg-primary/5",
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
                    <span className="min-w-0">
                      <span className={cn("block text-sm", state === "active" ? "font-semibold text-foreground" : "font-medium")}>{s.title}</span>
                      {state === "active" && <span className="animate-fade-in mt-0.5 block text-sm text-muted-foreground">{s.text}</span>}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="bg-transparent" disabled={step === 0} onClick={() => setStep((s) => Math.max(s - 1, 0))}>
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
            </Button>
            {finished ? (
              <Button size="sm" variant="outline" className="bg-transparent" onClick={() => setStep(0)}>
                Start again
              </Button>
            ) : (
              <Button size="sm" className="font-semibold" onClick={() => setStep((s) => s + 1)}>
                {step === last ? "Finish" : "Next"} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            )}
            <span className="ml-auto hidden text-[11px] text-muted-foreground sm:inline">Tip: use ← → keys</span>
          </div>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-3">
        {START_LINKS.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="group flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span>
                <span className="block text-sm font-semibold">{l.label}</span>
                <span className="block text-xs text-muted-foreground">{l.line}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
