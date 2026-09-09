"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2, Users, Store, FileText, X, Check, Sparkles } from "lucide-react"
import { useData } from "@/lib/providers"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

/**
 * First-run checklist for a brand-new organization, replacing the dead
 * app/onboarding/page.tsx wizard (audit P1-3 / case study §5): that page was
 * a second, disconnected pre-dashboard flow nothing linked to, whose submit
 * handlers didn't call any real API. The case study's own recommendation was
 * to fold onboarding into the first-run dashboard experience instead of
 * maintaining two competing surfaces — this is that.
 */
export function GettingStartedChecklist() {
  const { organization, departments, users, vendors, expenseRequests } = useData()
  const [dismissed, setDismissed] = useState(true) // default hidden until we've checked storage, to avoid a flash

  const storageKey = organization?.id ? `monytar:onboarding-dismissed:${organization.id}` : null

  useEffect(() => {
    if (!storageKey) return
    try {
      setDismissed(localStorage.getItem(storageKey) === "true")
    } catch {
      setDismissed(false)
    }
  }, [storageKey])

  const steps = [
    {
      key: "department",
      label: "Create a department",
      description: "Beyond the default \"General\" one, if your org has more than one team.",
      done: departments.length > 1,
      href: "/departments",
      icon: Building2,
    },
    {
      key: "team",
      label: "Invite your team",
      description: "Add teammates so they can submit and approve expenses.",
      done: users.length > 1,
      href: "/users",
      icon: Users,
    },
    {
      key: "vendor",
      label: "Add a vendor",
      description: "Register who you pay, so requests can reference them.",
      done: vendors.length > 0,
      href: "/vendors",
      icon: Store,
    },
    {
      key: "request",
      label: "Submit your first expense",
      description: "Try the full request-to-approval flow yourself.",
      done: expenseRequests.length > 0,
      href: "/requests/new",
      icon: FileText,
    },
  ]

  const doneCount = steps.filter((s) => s.done).length
  const allDone = doneCount === steps.length

  function handleDismiss() {
    setDismissed(true)
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, "true")
      } catch {
        // Non-fatal — worst case it reappears next visit.
      }
    }
  }

  if (dismissed || allDone) return null

  return (
    <Card className="border-primary/20 bg-primary/[0.03]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm">Getting started</h3>
              <p className="text-xs text-muted-foreground">{doneCount} of {steps.length} done</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 -mt-1 -mr-1" onClick={handleDismiss} aria-label="Dismiss">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((step) => {
            const Icon = step.icon
            const content = (
              <div
                className={cn(
                  "flex flex-col gap-2 p-3 rounded-xl border h-full transition-colors",
                  step.done ? "border-border/40 bg-secondary/30" : "border-border/60 bg-background hover:border-primary/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <Icon className={cn("w-4 h-4", step.done ? "text-muted-foreground" : "text-primary")} />
                  {step.done && (
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p className={cn("text-xs font-semibold", step.done && "text-muted-foreground line-through decoration-1")}>{step.label}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{step.description}</p>
              </div>
            )
            return step.done ? (
              <div key={step.key}>{content}</div>
            ) : (
              <Link key={step.key} href={step.href}>{content}</Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
