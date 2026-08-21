import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Sparkles, Bug, Zap, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"

export const metadata: Metadata = {
  title: "Changelog",
  description: "Stay up to date with the latest improvements, new features, and bug fixes in Monytar.",
}

const entries = [
  {
    version: "1.0.0",
    date: "April 14, 2026",
    title: "General Availability",
    description: "Monytar officially launches as a production-ready expense management platform, open to all organizations.",
    changes: [
      { type: "feature", text: "Stripe-powered subscription billing with Free, Starter, Professional, and Enterprise plans" },
      { type: "feature", text: "Self-service subscription management: upgrade, downgrade, and cancellation" },
      { type: "feature", text: "Customer portal for invoice history and payment method management" },
      { type: "improvement", text: "Production-hardened API with rate limiting and input validation" },
      { type: "improvement", text: "Responsive design finalized for mobile, tablet, and desktop" },
      { type: "security", text: "Row Level Security (RLS) enforced on every table with server-side authorization" },
      { type: "security", text: "Private receipt storage via short-lived signed URLs and full audit trail" },
    ],
  },
  {
    version: "0.9.0",
    date: "March 17, 2026",
    title: "Public Beta",
    description: "Public beta opens to early adopters. All core expense management workflows are feature-complete.",
    changes: [
      { type: "feature", text: "Comprehensive analytics dashboard with spending trends and category breakdowns" },
      { type: "feature", text: "Vendor management system with approved vendor directory" },
      { type: "feature", text: "Department-level budget tracking with configurable alert thresholds" },
      { type: "feature", text: "Role-based access control: Employee, Manager, Finance, and Admin" },
      { type: "improvement", text: "Complete audit trail logging for all expense and approval actions" },
      { type: "improvement", text: "Multi-currency support with 16 currencies" },
      { type: "fix", text: "Resolved approval chain routing when manager is also finance role" },
      { type: "fix", text: "Fixed CSV export encoding for special characters" },
    ],
  },
  {
    version: "0.5.0",
    date: "February 24, 2026",
    title: "Closed Beta",
    description: "Closed beta with invited teams. Core expense submission, approval workflows, and basic reporting are functional.",
    changes: [
      { type: "feature", text: "Expense request creation with receipt upload and auto-categorization" },
      { type: "feature", text: "Single and multi-level approval workflows with email notifications" },
      { type: "feature", text: "Basic reporting with CSV export and date filtering" },
      { type: "feature", text: "User authentication with Supabase and session management" },
      { type: "improvement", text: "Dark mode and system theme support" },
      { type: "fix", text: "Fixed date formatting inconsistencies in expense reports" },
    ],
  },
  {
    version: "0.1.0",
    date: "February 3, 2026",
    title: "Internal Alpha",
    description: "Initial internal build with foundational architecture and proof-of-concept features.",
    changes: [
      { type: "feature", text: "Project scaffolding with Next.js 16, TypeScript, and Tailwind CSS" },
      { type: "feature", text: "Database schema design with Supabase and Row Level Security" },
      { type: "feature", text: "Basic dashboard layout and navigation sidebar" },
      { type: "feature", text: "Department and expense category configuration" },
    ],
  },
]

function ChangeTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "feature":
      return <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
    case "improvement":
      return <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    case "fix":
      return <Bug className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
    case "security":
      return <Shield className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
    default:
      return <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
  }
}

function ChangeTypeBadge({ type }: { type: string }) {
  const colors = {
    feature: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    improvement: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    fix: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    security: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  }[type] || "bg-secondary text-muted-foreground"

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${colors}`}>
      {type}
    </span>
  )
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />

      {/* Hero */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            What{"'"}s new
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight text-balance">
            Changelog
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mt-4 max-w-2xl mx-auto text-pretty">
            Stay up to date with the latest improvements, new features, and updates to Monytar.
          </p>
        </div>
      </section>

      {/* Changelog Entries */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

            <div className="flex flex-col gap-12">
              {entries.map((entry) => (
                <div key={entry.version} className="relative pl-12">
                  {/* Timeline dot */}
                  <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />

                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      v{entry.version}
                    </span>
                    <span className="text-sm text-muted-foreground">{entry.date}</span>
                  </div>

                  <h2 className="font-heading text-xl font-bold mb-2">{entry.title}</h2>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5">{entry.description}</p>

                  <ul className="flex flex-col gap-3">
                    {entry.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="flex items-center gap-2 shrink-0 mt-0.5">
                          <ChangeTypeIcon type={change.type} />
                          <ChangeTypeBadge type={change.type} />
                        </div>
                        <span className="text-sm text-muted-foreground leading-relaxed">{change.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-secondary/30 border-y border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight mb-4">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Experience the latest version of Monytar. Start free, no credit card required.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="font-semibold shadow-sm shadow-primary/25">
                Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/features">
              <Button variant="outline" size="lg" className="font-semibold bg-transparent">View Features</Button>
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
