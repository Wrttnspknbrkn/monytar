"use client"

import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  ChevronRight,
  Check,
  CheckCircle,
  PieChart,
  ScanLine,
  BarChart3,
  Users,
  PlayCircle,
  Star,
  FileText,
  Send,
  Wallet,
} from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"
import { BentoCell } from "@/components/landing/bento-cell"
import { Reveal } from "@/components/landing/reveal"
import { FaqAccordion } from "@/components/landing/faq-accordion"
import { BlogShowcase } from "@/components/landing/blog-showcase"
import { cn } from "@/lib/utils"

const testimonials = [
  {
    quote: "We cut our month-end close by 3 days. The approval workflows just work.",
    name: "Sarah Chen",
    role: "CFO",
    company: "Tempo Labs",
  },
  {
    quote: "My team stopped submitting expenses on sticky notes. That alone is worth it.",
    name: "Marcus Reid",
    role: "Finance Manager",
    company: "Birch Studio",
  },
  {
    quote: "The budget alerts saved us from a very uncomfortable board conversation.",
    name: "Priya Nair",
    role: "Head of Finance",
    company: "Luma Health",
  },
]

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/mo",
    users: "Up to 5 users",
    features: ["50 requests/month", "Basic approval workflow", "Standard reporting", "Email support"],
    cta: "Get started",
    href: "/signup",
  },
  {
    id: "starter",
    name: "Starter",
    price: "$19",
    period: "/mo",
    users: "Up to 25 users",
    features: ["Unlimited requests", "Multi-level approvals", "Vendor management", "Priority support"],
    cta: "Start free trial",
    href: "/checkout?plan=starter-monthly",
  },
  {
    id: "pro",
    name: "Professional",
    price: "$49",
    period: "/mo",
    users: "Up to 100 users",
    featured: true,
    features: [
      "Everything in Starter",
      "Budget management & alerts",
      "Advanced analytics & exports",
      "Audit trail & receipt storage",
      "Phone & email support",
    ],
    cta: "Start free trial",
    href: "/checkout?plan=professional-monthly",
  },
  {
    id: "ent",
    name: "Enterprise",
    price: "Custom",
    period: "",
    users: "Unlimited users",
    features: [
      "Everything in Pro",
      "Custom integrations",
      "Dedicated account manager",
      "On-premise option",
      "24/7 priority support",
    ],
    cta: "Contact sales",
    href: "/contact",
  },
]

const companyLogos = [
  { name: "Next.js" },
  { name: "Supabase" },
  { name: "PostgreSQL" },
  { name: "Stripe" },
  { name: "Vercel" },
]

const stats = [
  { value: "4", label: "Roles with tailored access" },
  { value: "Real-time", label: "Budget tracking & alerts" },
  { value: "Multi-level", label: "Approval routing" },
  { value: "CSV + PDF", label: "One-click exports" },
]

const howItWorks = [
  {
    step: "01",
    Icon: FileText,
    title: "Submit",
    body: "An employee snaps a receipt, fills one short form, and hits submit from any device.",
  },
  {
    step: "02",
    Icon: Send,
    title: "Approve",
    body: "The request routes automatically to the right approver with full context and budget impact.",
  },
  {
    step: "03",
    Icon: Wallet,
    title: "Reimburse",
    body: "Finance marks it paid, the employee is notified, and it lands in your reports instantly.",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      {/* HERO */}
      <section className="relative pt-28 pb-0 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_60%_-10%,rgba(99,102,241,0.3),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_0%_80%,rgba(99,102,241,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[url('/images/dot-grid.svg')] opacity-[0.06]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-sm text-primary/90 mb-10 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            New: Multi-currency support now live
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </div>

          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold text-white leading-[1.02] tracking-tight mb-7">
            Expense management
            <br />
            <span className="bg-gradient-to-r from-indigo-300 via-primary to-cyan-400 bg-clip-text text-transparent">
              your team will use
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Give your finance team complete visibility into company spend. Approvals, budgets, and
            reporting in one clean workflow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/signup"
              className="group rounded-full bg-primary hover:bg-primary/90 text-white px-8 py-3.5 text-base font-semibold
              shadow-[0_0_0_1px_rgba(99,102,241,0.5),0_4px_28px_rgba(99,102,241,0.4)]
              hover:shadow-[0_0_0_1px_rgba(99,102,241,0.7),0_4px_40px_rgba(99,102,241,0.55)]
              transition-all duration-300 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Start free, no card needed
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
            <Link
              href="/demo"
              className="rounded-full border border-white/15 hover:border-white/35 text-white/75 hover:text-white
              px-8 py-3.5 text-base font-medium transition-all duration-300
              flex items-center justify-center gap-2 hover:bg-white/5 w-full sm:w-auto backdrop-blur-sm"
            >
              <PlayCircle className="w-5 h-5" strokeWidth={1.5} />
              See it in action
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-16 text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" strokeWidth={2.5} />
              Role-based approvals
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" strokeWidth={2.5} />
              Real-time budgets
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" strokeWidth={2.5} />
              CSV &amp; PDF exports
            </span>
          </div>
        </div>

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <div className="absolute inset-x-10 top-8 bottom-0 bg-primary/15 blur-3xl rounded-full -z-10" />
          <div
            className="relative w-full rounded-t-2xl overflow-hidden
            shadow-[0_-8px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.07)]"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <Image
              src="/images/dashboard-preview.png"
              alt="Monytar dashboard"
              width={1200}
              height={675}
              className="w-full"
              priority
            />
          </div>
        </div>
      </section>

      {/* LOGO BAR */}
      <section className="bg-white border-b border-slate-100">
        <div className="pt-28 pb-14 max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 mb-10">
            Built on a modern, secure stack
          </p>
          <div className="relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
            <div className="flex gap-14 items-center animate-marquee w-max">
              {[...companyLogos, ...companyLogos].map((logo, i) => (
                <span
                  key={i}
                  className="font-semibold text-slate-300 text-xl tracking-tight flex-shrink-0 hover:text-slate-500 transition-colors duration-300 cursor-default"
                >
                  {logo.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES BENTO */}
      <section id="features" className="py-24 md:py-32 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-4">
              Features
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              Everything your finance team needs
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
              From submission to reimbursement, one clean workflow with zero spreadsheets.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-auto">
            <BentoCell
              cols="md:col-span-7"
              size="large"
              label="Approvals"
              Icon={CheckCircle}
              title="Multi-step approvals that route themselves"
              body="Set rules once. Expenses automatically route to the right manager based on amount, category, or department."
              image="/images/workflow.jpg"
              imagePosition="center center"
              imageFit="cover"
            />
            <BentoCell
              cols="md:col-span-5"
              size="medium"
              label="Budgets"
              Icon={PieChart}
              title="Budget tracking and real-time alerts"
              body="Department budgets with spend-to-date and automatic overage warnings before it is too late."
              image="/images/reports.png"
              imagePosition="center top"
              imageFit="cover"
              imageBg="bg-slate-900"
            />
            <BentoCell
              cols="md:col-span-4"
              size="small"
              label="Receipts"
              Icon={ScanLine}
              title="Receipt capture"
              body="Upload from phone or desktop. Attach to any expense in one tap."
              image="/images/requests.png"
              imagePosition="center center"
              imageFit="cover"
            />
            <BentoCell
              cols="md:col-span-4"
              size="small"
              label="Analytics"
              Icon={BarChart3}
              title="Spend analytics"
              body="Slice spend by team, vendor, category, or time period."
              image="/images/dashboard2-dark.png"
              imagePosition="center top"
              imageFit="cover"
              imageBg="bg-slate-900"
            />
            <BentoCell
              cols="md:col-span-4"
              size="small"
              label="Team"
              Icon={Users}
              title="Roles and permissions"
              body="Employee, Manager, Finance, Admin. Each sees exactly what they need."
              image="/images/vendors.png"
              imagePosition="center top"
              imageFit="cover"
              imageBg="bg-slate-900"
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 md:py-32 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-20">
            <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-4">
              How it works
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              From receipt to reimbursed in three steps
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
              No training required. Your team will know exactly what to do the moment they log in.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            {howItWorks.map((item, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="group relative flex flex-col items-center text-center px-6 py-8 rounded-2xl hover:bg-slate-50 transition-colors duration-300">
                  <div className="relative z-10 w-16 h-16 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm group-hover:shadow-md group-hover:border-primary/20 flex items-center justify-center transition-all duration-300">
                      <item.Icon className="w-7 h-7 text-primary" strokeWidth={1.75} />
                    </div>
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center tabular-nums shadow-sm">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SPOTLIGHT 1 — EMPLOYEES */}
      <section className="py-24 md:py-32 px-4 sm:px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <Reveal>
            <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-5">
              For Employees
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 leading-[1.07] tracking-tight mb-5">
              Submit an expense
              <br />
              in under 60 seconds
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Snap a receipt, fill one short form, hit submit. No spreadsheets, no email chains, no
              lost receipts. Your reimbursement status updates in real time.
            </p>
            <ul className="space-y-3.5 mb-10">
              {[
                "Mobile receipt capture with auto-attach",
                "Track approval status and payment date",
                "Notification when your expense is approved",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary/8 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" strokeWidth={2.5} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/demo?role=employee"
              className="inline-flex items-center gap-2 text-primary font-semibold text-sm group"
            >
              Try as Employee
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" strokeWidth={2} />
            </Link>
          </Reveal>

          <div className="relative order-last md:order-none">
            <div className="absolute inset-0 bg-primary/4 rounded-3xl -rotate-2 scale-95 -z-10" />
            <div className="absolute inset-0 bg-indigo-100/40 rounded-3xl rotate-1 scale-97 -z-10" />
            <div className="relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200 hover:shadow-2xl transition-shadow duration-500">
              <Image
                src="/images/dashboard-preview.png"
                alt="Submit expense screen"
                width={600}
                height={400}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SPOTLIGHT 2 — MANAGERS */}
      <section className="py-24 md:py-32 px-4 sm:px-6 bg-slate-50 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="relative md:order-1 order-last">
            <div className="absolute inset-0 bg-indigo-100/60 rounded-3xl rotate-2 scale-95 -z-10" />
            <div className="relative rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200 hover:shadow-2xl transition-shadow duration-500">
              <Image
                src="/images/dashboard-pc.png"
                alt="Manager approval workflow"
                width={600}
                height={400}
                className="object-cover object-left-top"
              />
            </div>
          </div>

          <Reveal className="md:order-2 order-first">
            <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-5">
              For Managers
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 leading-[1.07] tracking-tight mb-5">
              Approve with full context,
              <br />
              not just a number
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              See the receipt, the business justification, and remaining department budget all on
              one screen. One tap to approve or request more information.
            </p>
            <ul className="space-y-3.5 mb-10">
              {[
                "Full expense detail and receipt in one view",
                "Live department budget impact shown inline",
                "Approve, reject, or comment in one action",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary/8 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" strokeWidth={2.5} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/demo?role=manager"
              className="inline-flex items-center gap-2 text-primary font-semibold text-sm group"
            >
              Try as Manager
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" strokeWidth={2} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-white border-y border-slate-100 py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-4 text-center">
          {stats.map((stat, i) => (
            <Reveal key={i} delay={i * 80}>
              <div className="group">
                <p className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-1.5 tabular-nums group-hover:text-primary transition-colors duration-300">
                  {stat.value}
                </p>
                <p className="text-slate-500 text-sm">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 md:py-32 px-4 sm:px-6 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <span className="inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-300 mb-4">
              Testimonials
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              Finance teams love Monytar
            </h2>
          </Reveal>

          <div
            className="flex md:grid md:grid-cols-3 gap-5
            overflow-x-auto md:overflow-visible
            snap-x snap-mandatory md:snap-none
            pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0
            scrollbar-hide"
          >
            {testimonials.map((t, i) => (
              <Reveal key={i} delay={i * 100}>
                <div
                  className="flex-shrink-0 w-[85vw] sm:w-[75vw] md:w-auto snap-center h-full
                  rounded-2xl bg-white/[0.05] border border-white/8 p-7
                  hover:bg-white/[0.08] hover:border-white/15 transition-all duration-300 flex flex-col"
                >
                  <div className="flex gap-1 mb-5">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="w-4 h-4 text-yellow-400 fill-yellow-400" strokeWidth={0} />
                    ))}
                  </div>
                  <p className="text-white/70 text-[15px] leading-relaxed mb-6 flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-5 border-t border-white/8">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/50 to-indigo-700/50 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {t.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold leading-none mb-1">{t.name}</p>
                      <p className="text-white/40 text-xs">
                        {t.role} at {t.company}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 md:py-32 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <Reveal className="text-center mb-16">
            <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-4">
              Pricing
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-3">
              Simple, transparent pricing
            </h2>
            <p className="text-slate-500 text-lg">
              No hidden fees. Start free, scale when you are ready.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-4 items-start lg:items-center">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "rounded-2xl p-8 relative transition-all duration-300",
                  plan.featured
                    ? "bg-primary text-white shadow-[0_8px_48px_rgba(99,102,241,0.45)] md:scale-[1.04] z-10"
                    : "bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"
                )}
              >
                {plan.featured && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-primary text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm border border-primary/10 whitespace-nowrap">
                    Most popular
                  </span>
                )}
                <p className={cn("text-sm font-bold uppercase tracking-widest mb-1", plan.featured ? "text-white/60" : "text-slate-500")}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={cn("font-display text-5xl font-bold", plan.featured ? "text-white" : "text-slate-900")}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={plan.featured ? "text-white/50" : "text-slate-400"}>{plan.period}</span>
                  )}
                </div>
                <p className={cn("text-sm mb-8", plan.featured ? "text-white/60" : "text-slate-500")}>
                  {plan.users}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className={cn("flex items-center gap-3 text-sm", plan.featured ? "text-white/85" : "text-slate-600")}>
                      <Check className={cn("w-4 h-4 flex-shrink-0", plan.featured ? "text-white" : "text-primary")} strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={cn(
                    "block text-center rounded-xl py-3 text-sm font-semibold transition-all duration-200",
                    plan.featured
                      ? "bg-white text-primary hover:bg-white/90"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 md:py-32 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-14">
            <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-4">
              FAQ
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-3">
              Questions, answered
            </h2>
            <p className="text-slate-500 text-lg">
              Everything you need to know before getting started.
            </p>
          </Reveal>
          <Reveal>
            <FaqAccordion />
          </Reveal>
          <p className="text-center text-sm text-slate-500 mt-10">
            Still have questions?{" "}
            <Link href="/contact" className="text-primary font-semibold hover:underline underline-offset-2">
              Talk to our team
            </Link>
          </p>
        </div>
      </section>

      {/* BLOG */}
      <BlogShowcase />

      {/* CTA BANNER */}
      <section className="py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 p-8 sm:p-12 md:p-20 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.3),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_80%_120%,rgba(99,102,241,0.15),transparent)]" />
            <div className="absolute inset-0 bg-[url('/images/dot-grid.svg')] opacity-[0.06]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <span className="relative inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-300 mb-6">
              Get started today
            </span>
            <h2 className="relative font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Ready to simplify
              <br />
              expense management?
            </h2>
            <p className="relative text-white/55 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              Join 500+ finance teams. Set up in under 5 minutes. Free forever on our starter plan.
            </p>
            <div className="relative flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="group rounded-full bg-primary text-white font-semibold px-8 py-3.5
                shadow-[0_0_0_1px_rgba(99,102,241,0.5),0_4px_28px_rgba(99,102,241,0.4)]
                hover:shadow-[0_0_0_1px_rgba(99,102,241,0.7),0_4px_40px_rgba(99,102,241,0.55)]
                transition-all duration-300 flex items-center justify-center gap-2"
              >
                Start free today
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </Link>
              <Link
                href="/demo"
                className="rounded-full border border-white/15 hover:border-white/35 text-white/75 hover:text-white
                font-medium px-8 py-3.5 hover:bg-white/5 transition-all duration-300"
              >
                Explore the demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
