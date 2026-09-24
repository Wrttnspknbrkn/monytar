"use client"

import { useEffect, useState } from "react"
import { Check, Pause, Play, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RequestStatusBadge } from "@/components/requests/request-status-badge"
import { JOURNEY, REJECTED_INFO } from "./guide-data"

type Selected = (typeof JOURNEY)[number]["id"] | "rejected"

/** Click a stage — or press Play — to see what it means and what to do. */
export function ExpenseJourney() {
  const [selected, setSelected] = useState<Selected>("draft")
  const [playing, setPlaying] = useState(false)

  const index = selected === "rejected" ? 1 : JOURNEY.findIndex((s) => s.id === selected)

  // Play walks Draft → Pending → Approved → Paid, then stops.
  useEffect(() => {
    if (!playing) return
    const t = window.setTimeout(() => {
      if (index >= JOURNEY.length - 1) return setPlaying(false)
      setSelected(JOURNEY[index + 1].id)
    }, 1700)
    return () => window.clearTimeout(t)
  }, [playing, index])

  const info =
    selected === "rejected"
      ? { status: REJECTED_INFO.status, who: "Reviewer", means: REJECTED_INFO.means, next: REJECTED_INFO.next }
      : JOURNEY[index]

  const start = () => {
    setSelected("draft")
    setPlaying(true)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="relative px-1 pt-1">
        {/* track + progress */}
        <div className="absolute left-[12.5%] right-[12.5%] top-[22px] h-1 rounded-full bg-secondary" />
        <div
          className="absolute left-[12.5%] top-[22px] h-1 rounded-full bg-primary transition-all duration-500 motion-reduce:transition-none"
          style={{ width: `${(Math.min(index, JOURNEY.length - 1) / (JOURNEY.length - 1)) * 75}%` }}
        />
        <ol className="relative grid grid-cols-4">
          {JOURNEY.map((stage, i) => {
            const reached = i <= index && selected !== "rejected"
            const isActive = selected === stage.id
            return (
              <li key={stage.id} className="flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setPlaying(false)
                    setSelected(stage.id)
                  }}
                  aria-pressed={isActive}
                  className="group flex flex-col items-center gap-2 rounded-xl px-1 pb-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 motion-reduce:transition-none",
                      isActive ? "scale-110 border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30" : reached ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground group-hover:border-primary/40",
                    )}
                  >
                    {reached && !isActive ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={cn("text-xs font-semibold capitalize", isActive ? "text-foreground" : "text-muted-foreground")}>{stage.status}</span>
                </button>
              </li>
            )
          })}
        </ol>

        {/* rejected branch under Pending */}
        <div className="mt-1 grid grid-cols-4">
          <div className="col-start-2 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setPlaying(false)
                setSelected("rejected")
              }}
              aria-pressed={selected === "rejected"}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected === "rejected" ? "text-red-600 dark:text-red-400" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className={cn("h-4 border-l-2 border-dashed", selected === "rejected" ? "border-red-400" : "border-border")} />
              <span className={cn("rounded-full border px-3 py-1", selected === "rejected" ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20" : "border-dashed border-border")}>
                Rejected?
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* detail */}
      <div key={selected} className="animate-fade-in rounded-2xl border border-border/60 bg-secondary/30 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <RequestStatusBadge status={info.status} />
          <span className="text-xs text-muted-foreground">Who acts: <b className="text-foreground">{info.who}</b></span>
        </div>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">What it means</dt>
            <dd className="mt-0.5 text-sm">{info.means}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">What to do</dt>
            <dd className="mt-0.5 text-sm">{info.next}</dd>
          </div>
        </dl>
      </div>

      <div className="flex justify-center">
        <Button variant="outline" size="sm" className="bg-transparent" onClick={playing ? () => setPlaying(false) : start}>
          {playing ? <><Pause className="mr-1.5 h-3.5 w-3.5" /> Pause</> : index >= JOURNEY.length - 1 && selected !== "rejected" ? <><RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Replay</> : <><Play className="mr-1.5 h-3.5 w-3.5" /> Play the journey</>}
        </Button>
      </div>
    </div>
  )
}
