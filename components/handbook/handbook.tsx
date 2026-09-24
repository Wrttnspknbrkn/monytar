"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { ArrowDown, Check, Download, LogIn } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { TaskPlayer } from "@/components/help/task-player"
import { TaskTile } from "@/components/help/task-tile"
import { ExpenseJourney } from "@/components/help/expense-journey"
import { QuickAnswers } from "@/components/help/quick-answers"
import { ROLE_TAGLINE, TASKS, tasksForRole } from "@/components/help/guide-data"
import type { UserRole } from "@/lib/types"
import { ApprovalSimulator } from "./approval-simulator"
import { HeroShowcase } from "./hero-showcase"
import { PrintHandbook } from "./print-handbook"
import { ScreensTour } from "./screens-tour"
import { CLOSING, HANDBOOK_UPDATED, HERO, LOOP, PDF_HREF, ROLE_CARDS, TIPS } from "./handbook-content"

const SECTIONS = [
  { id: "how", label: "How it works" },
  { id: "roles", label: "Roles" },
  { id: "guides", label: "Guides" },
  { id: "journey", label: "Journey" },
  { id: "rules", label: "Approvals" },
  { id: "screens", label: "Screens" },
  { id: "answers", label: "Answers" },
] as const

function Section({ id, eyebrow, title, hint, children }: { id: string; eyebrow: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 id={`${id}-h`} className="mt-2 font-display text-3xl tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {hint && <p className="mt-2 max-w-2xl text-muted-foreground">{hint}</p>}
      <div className="mt-8">{children}</div>
    </section>
  )
}

/** Highlights the section you're reading in the top bar. */
function useActiveSection() {
  const [active, setActive] = useState<string>(SECTIONS[0].id)
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e)
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: "-20% 0px -65% 0px" },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return active
}

export function Handbook() {
  const [role, setRole] = useState<UserRole>("employee")
  const [openId, setOpenId] = useState<string | null>(null)
  const [seen, setSeen] = useState<string[]>([])
  const active = useActiveSection()

  const tasks = useMemo(() => tasksForRole(role), [role])
  const openTask = TASKS.find((t) => t.id === openId) ?? null
  const card = ROLE_CARDS.find((r) => r.role === role) ?? ROLE_CARDS[0]

  const open = (id: string) => {
    setOpenId(id)
    setSeen((p) => (p.includes(id) ? p : [...p, id]))
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md print:hidden">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="Monytar home" className="shrink-0">
            <Logo size="sm" />
          </Link>
          <nav aria-label="Handbook sections" className="hidden flex-1 items-center gap-1 overflow-x-auto lg:flex">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={active === s.id ? "true" : undefined}
                className={cn("rounded-full px-3 py-1.5 text-sm font-medium transition-colors", active === s.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}
              >
                {s.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="bg-transparent">
              <a href={PDF_HREF} download>
                <Download className="mr-1.5 h-3.5 w-3.5" /> <span className="hidden sm:inline">Download</span> PDF
              </a>
            </Button>
            <Button asChild size="sm" className="font-semibold">
              <Link href="/login">
                <LogIn className="mr-1.5 h-3.5 w-3.5" /> Sign in
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="print:hidden">
        {/* Hero */}
        <div className="relative overflow-hidden bg-[hsl(221_83%_36%)] text-white">
          <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: "radial-gradient(60% 80% at 85% 0%, hsl(199 90% 55% / 0.35), transparent 60%), radial-gradient(40% 60% at 0% 100%, hsl(221 83% 20% / 0.6), transparent 70%)" }} aria-hidden />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:py-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">{HERO.kicker}</p>
              <h1 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">{HERO.title}</h1>
              <p className="mt-5 max-w-xl text-lg text-white/80">{HERO.sub}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="bg-white font-semibold text-[hsl(221_83%_30%)] hover:bg-white/90">
                  <a href="#how">
                    Start the tour <ArrowDown className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white">
                  <a href={PDF_HREF} download>
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                  </a>
                </Button>
              </div>
              <p className="mt-6 text-xs text-white/60">Updated {HANDBOOK_UPDATED}</p>
            </div>
            <HeroShowcase />
          </div>
        </div>

        <div className="mx-auto flex max-w-6xl flex-col gap-24 px-4 py-20 sm:px-6">
          {/* How it works */}
          <Section id="how" eyebrow="The idea" title="Three steps, from spend to payback" hint="Every expense in Monytar follows the same short path.">
            <ol className="grid gap-4 md:grid-cols-3">
              {LOOP.map((s) => {
                const Icon = s.icon
                return (
                  <li key={s.n} className="relative rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Step {s.n} · {s.who}
                    </p>
                    <h3 className="mt-1 font-display text-2xl tracking-tight">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{s.line}</p>
                  </li>
                )
              })}
            </ol>
          </Section>

          {/* Roles */}
          <Section id="roles" eyebrow="Who does what" title="Everyone sees what fits their role" hint="Pick a role. The guides below change to match.">
            <div role="radiogroup" aria-label="Choose a role" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ROLE_CARDS.map((r) => {
                const on = r.role === role
                return (
                  <button
                    key={r.role}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setRole(r.role)}
                    className={cn(
                      "flex flex-col items-start rounded-3xl border p-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                      on ? "border-primary bg-primary/[0.06] shadow-md shadow-primary/10" : "border-border/60 bg-card hover:-translate-y-0.5 hover:border-primary/30 motion-reduce:hover:translate-y-0",
                    )}
                  >
                    <span className="flex w-full items-center justify-between">
                      <span className="font-display text-xl tracking-tight">{r.name}</span>
                      <span className={cn("flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                        {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                    </span>
                    <span className="mt-1 text-sm text-muted-foreground">{r.line}</span>
                    <ul className="mt-4 flex flex-col gap-1.5 text-sm">
                      {r.can.map((c) => (
                        <li key={c} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>
            <p key={role} className="animate-fade-in mt-4 text-sm text-muted-foreground">
              <b className="text-foreground">{card.name}:</b> {ROLE_TAGLINE[role]}
            </p>
          </Section>

          {/* Guides */}
          <Section id="guides" eyebrow="Step by step" title={`What a ${card.name} can do`} hint="Tap a task to watch it on a real screen.">
            <div className="grid grid-cols-1 gap-3 min-[560px]:grid-cols-2 lg:grid-cols-3">
              {tasks.map((t) => (
                <TaskTile key={`${role}-${t.id}`} task={t} viewed={seen.includes(t.id)} onOpen={open} />
              ))}
            </div>
          </Section>

          {/* Journey */}
          <Section id="journey" eyebrow="Statuses" title="How an expense moves" hint="Tap a stage, or press play.">
            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm sm:p-8">
              <ExpenseJourney />
            </div>
          </Section>

          {/* Approval simulator */}
          <Section id="rules" eyebrow="Try it" title="Drag the amount. Watch the approval path change." hint="Bigger spend takes more review. Your company sets its own limits — these are examples.">
            <ApprovalSimulator />
          </Section>

          {/* Screens */}
          <Section id="screens" eyebrow="The product" title="A look at the screens" hint="Real screens, with what to look for on each.">
            <ScreensTour />
          </Section>

          {/* Tips */}
          <section aria-labelledby="tips-h">
            <h2 id="tips-h" className="font-display text-3xl tracking-tight sm:text-4xl">
              Five habits that make approval fast
            </h2>
            <ol className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {TIPS.map((t, i) => (
                <li key={t.title} className="rounded-2xl border border-border/60 bg-card p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{i + 1}</span>
                  <p className="mt-3 font-semibold">{t.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t.line}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Answers */}
          <Section id="answers" eyebrow="Stuck?" title="Quick answers" hint="Type a word, get the short answer.">
            <div className="max-w-3xl">
              <QuickAnswers onOpenTask={open} />
            </div>
          </Section>

          {/* Closing */}
          <section className="rounded-[2rem] bg-[hsl(221_83%_36%)] px-6 py-12 text-center text-white sm:px-12">
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">{CLOSING.title}</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">{CLOSING.line}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-white font-semibold text-[hsl(221_83%_30%)] hover:bg-white/90">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white">
                <a href={PDF_HREF} download>
                  <Download className="mr-2 h-4 w-4" /> Download PDF
                </a>
              </Button>
            </div>
          </section>
        </div>

        <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">Monytar Handbook · Updated {HANDBOOK_UPDATED}</footer>
      </main>

      <PrintHandbook />
      <TaskPlayer task={openTask} onClose={() => setOpenId(null)} openable={false} />
    </div>
  )
}
