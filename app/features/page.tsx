import type { Metadata } from "next"
import Link from "next/link"
import {
  FileText,
  CheckSquare,
  Store,
  DollarSign,
  BarChart3,
  Smartphone,
  Bell,
  ShieldCheck,
  ArrowRight,
  Check,
} from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"
import { Reveal } from "@/components/landing/reveal"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore Monytar features: expense management, approval workflows, vendor management, budget control, reporting, mobile experience, notifications, and enterprise security.",
}

const features = [
  {
    icon: FileText,
    title: "Expense Management",
    description:
      "Submit, track, and manage expense requests with ease. Attach receipts, categorize spending, and get real-time status updates.",
    items: [
      "Guided expense submission with receipt upload",
      "Categorize spending by expense type",
      "Draft mode for incomplete submissions",
      "Multi-currency amounts with live formatting",
      "Real-time status tracking from submit to paid",
    ],
  },
  {
    icon: CheckSquare,
    title: "Approval Workflows",
    description:
      "Configurable multi-level approval chains with automatic routing based on amount thresholds, departments, and policies.",
    items: [
      "Auto-routing to the right approver",
      "Multi-level approval for high-value requests",
      "One-click approve or reject with comments",
      "Threshold-based auto-approval rules",
      "Revise and resubmit rejected requests",
    ],
  },
  {
    icon: Store,
    title: "Vendor Management",
    description:
      "Maintain a centralized vendor directory with approval status, payment terms, and spending history for complete visibility.",
    items: [
      "Centralized vendor directory",
      "Vendor approval status",
      "Link expenses to vendors",
      "Spending analytics by vendor",
      "Top-vendor breakdowns in reports",
    ],
  },
  {
    icon: DollarSign,
    title: "Budget Control",
    description:
      "Set and enforce budgets at department, project, or category level with real-time alerts when thresholds are approached.",
    items: [
      "Department-level budgets",
      "Real-time spend tracking vs budget",
      "Configurable alert thresholds (warning, critical)",
      "Automatic alerts written on approval",
      "Over-budget status surfaced inline",
    ],
  },
  {
    icon: BarChart3,
    title: "Reporting & Analytics",
    description:
      "Comprehensive dashboards and reports that give you full visibility into organizational spending patterns and trends.",
    items: [
      "Executive spending dashboard",
      "Category, department, and vendor breakdowns",
      "Monthly trend analysis from real request data",
      "Status breakdown across the request lifecycle",
      "One-click CSV and printable PDF export",
    ],
  },
  {
    icon: Smartphone,
    title: "Mobile Experience",
    description:
      "Fully responsive design that works seamlessly on any device. Submit expenses and approve requests on the go.",
    items: [
      "Responsive design for all screen sizes",
      "Mobile-optimized expense submission",
      "Upload receipts from your phone",
      "Approve or reject from any device",
      "Accessible, keyboard-friendly UI",
    ],
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Stay informed with intelligent alerts for approvals, payments, budget warnings, and important status changes.",
    items: [
      "In-app notification center",
      "Email notifications for approvals and rejections",
      "Budget threshold alerts",
      "Role-based notification routing",
      "Email invitations for new teammates",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Security & Compliance",
    description:
      "Strong security with role-based access, complete audit trails, row-level data isolation, and encrypted receipt storage.",
    items: [
      "Role-based access control (RBAC)",
      "Complete audit trail for all actions",
      "Row-level security (RLS) on every table",
      "Private, signed-URL receipt storage",
      "Server-side authorization on every action",
    ],
  },
]

export default function FeaturesPage() {
  const [core, ...rest] = features

  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      {/* HERO */}
      <section className="relative pt-28 pb-20 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_15%_-10%,rgba(99,102,241,0.28),transparent)]" />
        <div className="absolute inset-0 bg-[url('/images/dot-grid.svg')] opacity-[0.06]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10">
          <div className="grid md:grid-cols-[1.3fr_1fr] gap-10 md:gap-16 items-end">
            <div>
              <h1 className="font-display text-4xl sm:text-5xl md:text-[56px] font-bold text-white leading-[1.05] tracking-tight mb-6">
                Every part of the expense
                <br />
                workflow, covered
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
                From submission to reimbursement, Monytar gives your team the tools to control
                spending, streamline approvals, and stay on top of financial visibility.
              </p>
            </div>
            <div className="border-l border-white/10 pl-8 flex flex-col gap-4">
              {features.slice(0, 4).map((f) => (
                <a
                  key={f.title}
                  href={`#${f.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <f.icon className="w-4 h-4 text-primary shrink-0" strokeWidth={1.75} />
                  {f.title}
                  <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURE — featured */}
      <section id={core.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="py-20 md:py-28 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <Reveal variant="rise">
            <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-10 md:gap-16 items-start rounded-2xl border border-slate-200 p-8 md:p-12">
              <div>
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white mb-6">
                  <core.icon className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-3">{core.title}</h2>
                <p className="text-slate-500 leading-relaxed">{core.description}</p>
              </div>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {core.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm pt-3 border-t border-slate-100">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="text-slate-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* REMAINING FEATURES — compact index */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <Reveal variant="rise" className="max-w-xl mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-3">
              The rest of the toolkit
            </h2>
            <p className="text-slate-500 leading-relaxed">
              Every one of these ships today, not on a roadmap.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 rounded-2xl border border-slate-200 overflow-hidden bg-white">
            {rest.map((feature, i) => {
              const Icon = feature.icon
              const col = i % 3
              const row = Math.floor(i / 3)
              return (
                <Reveal
                  key={feature.title}
                  id={feature.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                  variant="grow"
                  delay={i * 60}
                  className={cn(
                    "p-7",
                    col > 0 && "sm:border-l border-slate-100",
                    row > 0 && "border-t sm:border-t border-slate-100"
                  )}
                >
                  <Icon className="w-5 h-5 text-primary mb-4" strokeWidth={1.75} />
                  <h3 className="font-display text-base font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4">{feature.description}</p>
                  <ul className="flex flex-col gap-1.5">
                    {feature.items.slice(0, 3).map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-slate-500">
                        <Check className="w-3 h-3 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-16 md:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 p-8 sm:p-12 md:p-20 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.3),transparent)]" />
            <div className="absolute inset-0 bg-[url('/images/dot-grid.svg')] opacity-[0.06]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <h2 className="relative font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Ready to take control
              <br />
              of your spending?
            </h2>
            <p className="relative text-white/55 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              Start for free. No credit card required. Set up in under 5 minutes.
            </p>
            <div className="relative flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="group rounded-full bg-primary text-white font-semibold px-8 py-3.5
                shadow-[0_0_0_1px_rgba(99,102,241,0.5),0_4px_28px_rgba(99,102,241,0.4)]
                hover:shadow-[0_0_0_1px_rgba(99,102,241,0.7),0_4px_40px_rgba(99,102,241,0.55)]
                transition-all duration-300 flex items-center justify-center gap-2"
              >
                Get started free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-white/15 hover:border-white/35 text-white/75 hover:text-white
                font-medium px-8 py-3.5 hover:bg-white/5 transition-all duration-300"
              >
                Contact sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
