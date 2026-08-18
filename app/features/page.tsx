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
  ChevronRight,
  Check,
} from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"
import { Reveal } from "@/components/landing/reveal"

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
      "Camera receipt capture",
      "Push notifications for approvals",
      "Offline draft support",
    ],
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Stay informed with intelligent alerts for approvals, payments, budget warnings, and important status changes.",
    items: [
      "In-app notification center",
      "Email digest options (real-time, daily, weekly)",
      "Role-based notification routing",
      "Custom notification preferences",
      "Escalation alerts for managers",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Security & Compliance",
    description:
      "Enterprise-grade security with role-based access, audit trails, data encryption, and compliance-ready features.",
    items: [
      "Role-based access control (RBAC)",
      "Complete audit trail for all actions",
      "SOC 2 Type II ready infrastructure",
      "GDPR and data privacy compliance",
      "SSO and two-factor authentication",
    ],
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      {/* HERO */}
      <section className="relative pt-28 pb-20 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_60%_-10%,rgba(99,102,241,0.3),transparent)]" />
        <div className="absolute inset-0 bg-[url('/images/dot-grid.svg')] opacity-[0.06]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-sm text-primary/90 mb-8 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Everything you need to manage expenses
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight mb-6">
            Powerful features for
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-primary to-cyan-400 bg-clip-text text-transparent">
              modern expense management
            </span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            From submission to reimbursement, Monytar gives your team the tools they need to control
            spending, streamline approvals, and gain complete financial visibility.
          </p>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-5">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <Reveal key={feature.title} delay={(i % 2) * 80}>
                  <div className="group h-full rounded-2xl bg-white border border-slate-100 p-7 hover:border-primary/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/5 border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        <Icon className="w-5 h-5 text-primary group-hover:text-white transition-colors duration-300" strokeWidth={1.75} />
                      </div>
                      <h3 className="font-display text-lg font-bold text-slate-900">{feature.title}</h3>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed mb-5">{feature.description}</p>
                    <ul className="flex flex-col gap-2.5">
                      {feature.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm">
                          <div className="w-5 h-5 rounded-full bg-primary/8 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-primary" strokeWidth={2.5} />
                          </div>
                          <span className="text-slate-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
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
