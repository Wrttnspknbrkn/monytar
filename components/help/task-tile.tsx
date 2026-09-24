"use client"

import { ArrowRight, Check } from "lucide-react"
import type { GuideTask } from "./guide-data"

/** One "what do you want to do?" tile. Shared by the in-app Help page and the public handbook. */
export function TaskTile({ task, viewed, onOpen }: { task: GuideTask; viewed: boolean; onOpen: (id: string) => void }) {
  const Icon = task.icon
  return (
    <button
      type="button"
      onClick={() => onOpen(task.id)}
      className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-tight">{task.title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{task.blurb}</span>
      </span>
      {viewed ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" aria-label="Viewed">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      ) : (
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      )}
    </button>
  )
}
