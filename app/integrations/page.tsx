import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  CreditCard,
  FileSpreadsheet,
  Cloud,
  Building2,
  Receipt,
  Smartphone,
  Lock,
  Plug,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"

export const metadata: Metadata = {
  title: "Integrations",
  description:
    "Connect Monytar with your existing tools. Integrations with accounting software, ERP systems, payment providers, and more.",
}

const integrations = [
  {
    icon: FileSpreadsheet,
    title: "Accounting Software",
    description: "Seamlessly sync expense data with your accounting platform for automated reconciliation and reporting.",
    tools: ["QuickBooks", "Xero", "Sage", "FreshBooks"],
    status: "Available",
  },
  {
    icon: Building2,
    title: "ERP Systems",
    description: "Connect with enterprise resource planning systems for unified financial management across departments.",
    tools: ["SAP", "Oracle NetSuite", "Microsoft Dynamics"],
    status: "Coming Soon",
  },
  {
    icon: CreditCard,
    title: "Payment Providers",
    description: "Process reimbursements directly through integrated payment platforms for faster, more reliable payouts.",
    tools: ["Stripe", "Paystack", "Flutterwave", "Bank Transfer"],
    status: "Available",
  },
  {
    icon: Receipt,
    title: "Receipt Scanning",
    description: "Automatically extract data from receipts using OCR technology to eliminate manual data entry.",
    tools: ["Built-in OCR", "Camera Capture", "Email Forwarding"],
    status: "Available",
  },
  {
    icon: Cloud,
    title: "Cloud Storage",
    description: "Store and organize receipt attachments and expense documentation in your preferred cloud platform.",
    tools: ["Google Drive", "Dropbox", "OneDrive", "S3"],
    status: "Available",
  },
  {
    icon: Smartphone,
    title: "Communication Tools",
    description: "Get notifications and submit expenses directly from the tools your team already uses daily.",
    tools: ["Slack", "Microsoft Teams", "Email"],
    status: "Coming Soon",
  },
  {
    icon: Lock,
    title: "Identity & SSO",
    description: "Secure single sign-on integration with your organization's identity provider for streamlined access.",
    tools: ["Okta", "Auth0", "Azure AD", "Google Workspace"],
    status: "Professional+",
  },
  {
    icon: Plug,
    title: "API & Webhooks",
    description: "Build custom integrations with our comprehensive REST API and real-time webhook events.",
    tools: ["REST API", "Webhooks", "Zapier", "Custom"],
    status: "Professional+",
  },
]

function StatusBadge({ status }: { status: string }) {
  const colors =
    status === "Available"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : status === "Coming Soon"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${colors}`}>
      {status}
    </span>
  )
}

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />

      {/* Hero */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-semibold mb-6">
            <Plug className="w-3.5 h-3.5" />
            Seamless connections
          </div>
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight text-balance">
            Connect Monytar with your existing tools
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mt-4 max-w-2xl mx-auto text-pretty">
            Integrate with the software your team already uses. Sync data, automate workflows, and eliminate manual processes.
          </p>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {integrations.map((integration) => {
              const Icon = integration.icon
              return (
                <Card key={integration.title} className="border-border/60 hover:border-primary/20 transition-all duration-300 hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-heading text-lg font-bold">{integration.title}</h3>
                      </div>
                      <StatusBadge status={integration.status} />
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">{integration.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {integration.tools.map((tool) => (
                        <span key={tool} className="px-2.5 py-1 rounded-md bg-secondary text-xs font-medium text-muted-foreground">
                          {tool}
                        </span>
                      ))}
                    </div>
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
          <h2 className="font-heading text-3xl font-extrabold tracking-tight mb-4">
            Need a custom integration?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Our API and webhooks make it easy to build custom connections. Enterprise plans include dedicated integration support.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/contact">
              <Button size="lg" className="font-semibold shadow-sm shadow-primary/25">
                Talk to Sales <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/features">
              <Button variant="outline" size="lg" className="font-semibold bg-transparent">View All Features</Button>
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
