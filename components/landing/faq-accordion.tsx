"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    q: "How long does it take to set up Monytar?",
    a: "Most teams are up and running in under 5 minutes. Create your organization, invite your team, and set your first approval rule — no implementation project, no IT ticket required.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. The Free plan supports up to 5 users with no card required, forever. You only add billing details when you choose to upgrade to a paid plan.",
  },
  {
    q: "Can I customize the approval workflow?",
    a: "Yes. You can route expenses automatically based on amount, category, or department, and add multiple approval levels — for example manager first, then finance above a threshold.",
  },
  {
    q: "Does Monytar support multiple currencies?",
    a: "Yes. Employees can submit expenses in their local currency and finance sees everything converted to your organization's base currency for consistent reporting.",
  },
  {
    q: "How secure is my financial data?",
    a: "All data is encrypted in transit and at rest, scoped per organization with row-level security, and access is controlled by granular role-based permissions. Enterprise plans add SSO/SAML.",
  },
  {
    q: "Can I export data for my accounting software?",
    a: "Professional and Enterprise plans include CSV exports and analytics, so you can move approved expenses into your existing accounting stack at month-end.",
  },
]

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="flex flex-col gap-3">
      {faqs.map((faq, i) => {
        const isOpen = open === i
        return (
          <div
            key={i}
            className={cn(
              "rounded-2xl border bg-white transition-colors duration-200",
              isOpen ? "border-primary/30 shadow-sm" : "border-slate-200 hover:border-slate-300"
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
            >
              <span className="font-semibold text-slate-900 text-[15px]">{faq.q}</span>
              <Plus
                className={cn(
                  "w-5 h-5 flex-shrink-0 text-primary transition-transform duration-300",
                  isOpen && "rotate-45"
                )}
                strokeWidth={2}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm text-slate-500 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
