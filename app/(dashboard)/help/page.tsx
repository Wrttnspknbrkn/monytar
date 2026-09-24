"use client"

import { Suspense, useCallback, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { BookOpen, Check } from "lucide-react"
import { useAuth, useData } from "@/lib/providers"
import { cn, getRoleLabel } from "@/lib/utils"
import { roleBadgeColors } from "@/components/layout/account-info"
import { TASKS, ROLE_TAGLINE, VISIBLE_ROLES, tasksForRole, canViewTask } from "@/components/help/guide-data"
import { TaskPlayer } from "@/components/help/task-player"
import { TaskTile } from "@/components/help/task-tile"
import { ExpenseJourney } from "@/components/help/expense-journey"
import { QuickAnswers } from "@/components/help/quick-answers"
import type { UserRole } from "@/lib/types"

const ROLES: UserRole[] = ["employee", "manager", "finance", "admin"]
const SEEN_KEY = "monytar:help-seen"

function readSeen(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-3">
      <h2 className="font-heading text-lg font-bold tracking-tight">{title}</h2>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  )
}

function HelpContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { dbUser } = useAuth()
  const { currentUser } = useData()
  const user = dbUser || currentUser

  // You can read your own role's guide and the guides of the roles below yours:
  // Employee sees Employee; Manager adds Manager; Finance adds Finance; Admin sees all.
  const ownRole: UserRole = user?.role ?? "employee"
  const allowedRoles = VISIBLE_ROLES[ownRole]
  const [picked, setPicked] = useState<UserRole | null>(null)
  const role: UserRole = picked && allowedRoles.includes(picked) ? picked : ownRole
  const tasks = useMemo(() => tasksForRole(role), [role])

  // Which walkthrough is open lives in the URL (?task=…) so it can be linked to.
  // A link to a walkthrough above your role simply doesn't open.
  const openId = searchParams.get("task")
  const requested = TASKS.find((t) => t.id === openId)
  const openTask = requested && canViewTask(ownRole, requested) ? requested : null

  // Safe to read storage here: the dashboard layout only renders pages on the client, after sign-in.
  const [seen, setSeen] = useState<string[]>(readSeen)

  const openTaskById = useCallback(
    (id: string) => {
      router.replace(`/help?task=${id}`, { scroll: false })
      setSeen((prev) => {
        if (prev.includes(id)) return prev
        const next = [...prev, id]
        try {
          localStorage.setItem(SEEN_KEY, JSON.stringify(next))
        } catch {
          /* private mode — fine, the checkmarks just won't persist */
        }
        return next
      })
    },
    [router],
  )
  const closeTask = useCallback(() => router.replace("/help", { scroll: false }), [router])

  const seenCount = tasks.filter((t) => seen.includes(t.id)).length

  return (
    <div className="flex max-w-4xl flex-col gap-10">
      {/* Hero */}
      <header className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight">Help &amp; Guide</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Pick what you want to do. We&apos;ll show you, step by step.</p>
          </div>
        </div>

        {allowedRoles.length > 1 ? (
        <div role="radiogroup" aria-label="Show help for" className="flex flex-wrap gap-2">
          {ROLES.filter((r) => allowedRoles.includes(r)).map((r) => {
            const active = r === role
            return (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPicked(r)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all",
                  active ? cn("shadow-sm", roleBadgeColors[r]) : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                {active && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                {getRoleLabel(r)}
                {user?.role === r && <span className="rounded bg-foreground/10 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide">You</span>}
              </button>
            )
          })}
        </div>
        ) : (
          <span className={cn("inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold", roleBadgeColors[ownRole])}>
            {getRoleLabel(ownRole)} guide
          </span>
        )}
        <p className="-mt-1 text-xs text-muted-foreground">{ROLE_TAGLINE[role]}</p>
      </header>

      {/* Tasks */}
      <section aria-labelledby="tasks-h">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="tasks-h" className="font-heading text-lg font-bold tracking-tight">What do you want to do?</h2>
            <p className="text-sm text-muted-foreground">Tap one to see it on a real screen.</p>
          </div>
          {seenCount > 0 && <span className="shrink-0 text-xs font-medium text-muted-foreground">{seenCount} of {tasks.length} viewed</span>}
        </div>
        <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-3">
          {tasks.map((t) => (
            <TaskTile key={t.id} task={t} viewed={seen.includes(t.id)} onOpen={openTaskById} />
          ))}
        </div>
      </section>

      {/* Journey */}
      <section aria-labelledby="journey-h">
        <SectionTitle title="How an expense moves" hint="Tap a stage, or press play." />
        <div id="journey-h" className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
          <ExpenseJourney />
        </div>
      </section>

      {/* Quick answers */}
      <section aria-labelledby="answers-h">
        <SectionTitle title="Quick answers" hint="Stuck? Type a word." />
        <div id="answers-h">
          <QuickAnswers onOpenTask={openTaskById} viewerRole={ownRole} />
        </div>
      </section>

      <p className="pb-2 text-center text-xs text-muted-foreground">
        Still stuck? Ask an admin in your organization, or{" "}
        <Link href="/contact" className="font-medium text-primary hover:underline">contact Monytar support</Link>.
      </p>

      <TaskPlayer task={openTask} onClose={closeTask} />
    </div>
  )
}

export default function HelpPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-muted-foreground">Loading…</div>}>
      <HelpContent />
    </Suspense>
  )
}
