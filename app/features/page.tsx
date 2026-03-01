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
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"

export const metadata: Metadata = {
  title: "Features",
  description:
    "Explore Monytar features: expense management, approval workflows, vendor management, budget control, reporting, mobile experience, notifications, and enterprise security.",
}

const features = [
  {
    icon: FileText,
    title: "Expense Management",
    description: "Submit, track, and manage expense requests with ease. Attach receipts, categorize spending, and get real-time status updates.",
    items: [
      "Multi-step expense submission with receipt upload",
      "Auto-categorization by expense type",
      "Duplicate detection and smart suggestions",
      "Draft mode for incomplete submissions",
      "Bulk expense upload via CSV",
    ],
  },
  {
    icon: CheckSquare,
    title: "Approval Workflows",
    description: "Configurable multi-level approval chains with automatic routing based on amount thresholds, departments, and policies.",
    items: [
      "Auto-routing to the right approver",
      "Multi-level approval for high-value requests",
      "One-click approve or reject with comments",
      "Automatic escalation for overdue approvals",
      "Threshold-based auto-approval rules",
    ],
  },
  {
    icon: Store,
    title: "Vendor Management",
    description: "Maintain a centralized vendor directory with approval status, payment terms, and spending history for complete visibility.",
    items: [
      "Approved vendor directory",
      "Vendor performance tracking",
      "Custom payment terms per vendor",
      "Spending analytics by vendor",
      "Vendor onboarding workflows",
    ],
  },
  {
    icon: DollarSign,
    title: "Budget Control",
    description: "Set and enforce budgets at department, project, or category level with real-time alerts when thresholds are approached.",
    items: [
      "Department and project-level budgets",
      "Real-time spend tracking vs budget",
      "Configurable alert thresholds (75%, 90%, 100%)",
      "Period-based budgets (monthly, quarterly, yearly)",
      "Budget rollover and carry-forward options",
    ],
  },
  {
    icon: BarChart3,
    title: "Reporting & Analytics",
    description: "Comprehensive dashboards and reports that give you full visibility into organizational spending patterns and trends.",
    items: [
      "Executive spending dashboard",
      "Category and department breakdowns",
      "Trend analysis with historical comparison",
      "Custom report builder with date ranges",
      "One-click CSV and PDF export",
    ],
  },
  {
    icon: Smartphone,
    title: "Mobile Experience",
    description: "Fully responsive design that works seamlessly on any device. Submit expenses and approve requests on the go.",
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
    description: "Stay informed with intelligent alerts for approvals, payments, budget warnings, and important status changes.",
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
    description: "Enterprise-grade security with role-based access, audit trails, data encryption, and compliance-ready features.",
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
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />

      {/* Hero */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-semibold mb-6">
            <Zap className="w-3.5 h-3.5" />
            Everything you need to manage expenses
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight text-balance">
            Powerful features for modern expense management
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mt-4 max-w-2xl mx-auto text-pretty">
            From submission to reimbursement, Monytar gives your team the tools they need to control spending, streamline approvals, and gain complete financial visibility.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="border-border/60 hover:border-primary/20 transition-all duration-300 hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-heading text-lg font-bold">{feature.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">{feature.description}</p>
                    <ul className="flex flex-col gap-2">
                      {feature.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm">
                          <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 shrink-0 mt-0.5">
                            <svg className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-secondary/30 border-y border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight mb-4">Ready to take control of your spending?</h2>
          <p className="text-muted-foreground text-lg mb-8">Start for free. No credit card required.</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="font-semibold shadow-sm shadow-primary/25">
                Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="font-semibold bg-transparent">Contact Sales</Button>
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
