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
  User,
  Briefcase,
  Twitter,
  Linkedin,
} from "lucide-react"
import { LandingHeader } from "@/components/landing/landing-header"
import { BentoCell } from "@/components/landing/bento-cell"
import { cn } from "@/lib/utils"

// Testimonial data
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

// Pricing plans
const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/mo",
    users: "Up to 5 users",
    features: ["Basic approvals", "Receipt upload", "Email notifications", "Email support"],
    cta: "Get started",
  },
  {
    id: "pro",
    name: "Professional",
    price: "$49",
    period: "/mo",
    users: "Up to 100 users",
    featured: true,
    features: [
      "Everything in Free",
      "Analytics & exports",
      "Vendor management",
      "Custom approval chains",
      "Priority support",
    ],
    cta: "Start free trial",
  },
  {
    id: "ent",
    name: "Enterprise",
    price: "Custom",
    period: "",
    users: "Unlimited users",
    features: [
      "Everything in Pro",
      "SSO / SAML login",
      "Custom workflows",
      "API access",
      "Dedicated CSM",
    ],
    cta: "Contact sales",
  },
]

// Company logos for the marquee
const companyLogos = [
  { name: "TechCorp" },
  { name: "FinanceHub" },
  { name: "GrowthCo" },
  { name: "StartupX" },
  { name: "ScaleUp" },
  { name: "InnovateLabs" },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      {/* ============ HERO SECTION ============ */}
      <section className="relative pt-32 pb-56 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(99,102,241,0.25),transparent)]" />
        <div className="absolute inset-0 bg-[url('/images/dot-grid.svg')] opacity-[0.07]" />

        {/* Content */}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Announcement pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary/80 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            New: Multi-currency support now live
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-bold text-white leading-[1.04] tracking-tight mb-6">
            Expense management
            <br className="hidden sm:block" />
            your team will actually use
          </h1>

          {/* Subheading */}
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Give your finance team complete visibility into company spend. Approvals, budgets, and
            reporting — one clean workflow.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-full bg-primary hover:bg-primary/90 text-white px-8 py-3.5 text-base font-semibold
              shadow-[0_0_0_1px_rgba(99,102,241,0.5),0_4px_24px_rgba(99,102,241,0.35)]
              hover:shadow-[0_0_0_1px_rgba(99,102,241,0.6),0_4px_32px_rgba(99,102,241,0.5)]
              transition-all duration-200 w-full sm:w-auto"
            >
              Start free — no card needed
            </Link>
            <Link
              href="/demo"
              className="rounded-full border border-white/20 hover:border-white/40 text-white/80 hover:text-white
              px-8 py-3.5 text-base font-medium transition-all duration-200
              flex items-center justify-center gap-2 hover:bg-white/5 w-full sm:w-auto"
            >
              <PlayCircle className="w-5 h-5" strokeWidth={1.5} />
              See it in action
            </Link>
          </div>

          {/* Social proof row */}
          <div className="flex items-center justify-center gap-3 mt-10 text-sm text-slate-400">
            <div className="flex -space-x-2">
              {["AC", "BR", "PL"].map((initials, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-primary/40 ring-2 ring-slate-900
                    flex items-center justify-center text-xs font-semibold text-white"
                >
                  {initials}
                </div>
              ))}
            </div>
            <span>
              Trusted by <span className="text-white font-semibold">500+</span> finance teams
            </span>
          </div>
        </div>

        {/* Dashboard mockup — bleeding into next section */}
        <div className="relative mt-20 mx-auto max-w-5xl px-4 sm:px-6">
          {/* Glow halo */}
          <div className="absolute inset-x-20 top-10 bottom-0 bg-primary/20 blur-3xl rounded-full -z-10" />
          <div
            className="relative w-full rounded-t-2xl overflow-hidden
            shadow-[0_-4px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)]
            ring-1 ring-white/10"
          >
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

      {/* ============ LOGO / SOCIAL PROOF BAR ============ */}
      <section className="bg-white border-b border-slate-100">
        <div className="pt-32 pb-14 max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mb-10">
            Trusted by teams at
          </p>

          {/* CSS marquee */}
          <div className="relative overflow-hidden">
            {/* Fade edges */}
            <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            <div className="flex gap-14 items-center animate-marquee w-max">
              {[...companyLogos, ...companyLogos].map((logo, i) => (
                <span
                  key={i}
                  className="font-semibold text-slate-300 text-xl tracking-tight flex-shrink-0 hover:text-slate-400 transition-colors duration-200"
                >
                  {logo.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES — BENTO GRID ============ */}
      <section id="features" className="py-20 md:py-28 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-14">
            <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-4">
              Features
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              Everything your finance team needs
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
              From submission to reimbursement — one clean workflow, zero spreadsheets.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-auto">
            {/* Row 1 */}
            <BentoCell
              cols="md:col-span-7"
              size="large"
              label="Approvals"
              Icon={CheckCircle}
              title="Multi-step approvals that route themselves"
              body="Set rules once. Expenses automatically route to the right manager based on amount, category, or department."
              image="/images/dashboard-preview.png"
            />
            <BentoCell
              cols="md:col-span-5"
              size="medium"
              label="Budgets"
              Icon={PieChart}
              title="Budget tracking & real-time alerts"
              body="Department budgets with spend-to-date and automatic overage warnings before it's too late."
            />

            {/* Row 2 */}
            <BentoCell
              cols="md:col-span-4"
              size="small"
              label="Receipts"
              Icon={ScanLine}
              title="Receipt capture"
              body="Upload from phone or desktop. Attach to any expense in one tap."
            />
            <BentoCell
              cols="md:col-span-4"
              size="small"
              label="Analytics"
              Icon={BarChart3}
              title="Spend analytics"
              body="Slice spend by team, vendor, category, or time period."
            />
            <BentoCell
              cols="md:col-span-4"
              size="small"
              label="Team"
              Icon={Users}
              title="Roles & permissions"
              body="Employee, Manager, Finance, Admin — each sees exactly what they need."
            />
          </div>
        </div>
      </section>

      {/* ============ SPOTLIGHT 1 — FOR EMPLOYEES ============ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Text side */}
          <div>
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

            {/* Feature bullets */}
            <ul className="space-y-3 mb-10">
              {[
                "Mobile receipt capture with auto-attach",
                "Track approval status and payment date",
                "Notification when your expense is approved",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" strokeWidth={2.5} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/demo?role=employee"
              className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all duration-200"
            >
              Try as Employee
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>

          {/* Image side */}
          <div className="relative order-last md:order-none">
            <div className="absolute inset-0 bg-primary/5 rounded-3xl -rotate-2 scale-95 -z-10" />
            <div className="relative rounded-2xl overflow-hidden shadow-float ring-1 ring-slate-200">
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

      {/* ============ SPOTLIGHT 2 — FOR MANAGERS ============ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-slate-50 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Image side — first on desktop */}
          <div className="relative md:order-1 order-last">
            <div className="absolute inset-0 bg-indigo-50 rounded-3xl rotate-2 scale-95 -z-10" />
            <div className="relative rounded-2xl overflow-hidden shadow-float ring-1 ring-slate-200">
              <Image
                src="/images/dashboard-preview.png"
                alt="Approval workflow screen"
                width={600}
                height={400}
                className="w-full"
              />
            </div>
          </div>

          {/* Text side */}
          <div className="md:order-2 order-first">
            <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-5">
              For Managers
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 leading-[1.07] tracking-tight mb-5">
              Approve with full
              <br />
              context, not just a number
            </h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              See the receipt, the business justification, and remaining department budget — all on
              one screen. One tap to approve or request more information.
            </p>

            <ul className="space-y-3 mb-10">
              {[
                "Full expense detail and receipt in one view",
                "Live department budget impact shown inline",
                "Approve, reject, or comment in one action",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" strokeWidth={2.5} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/demo?role=manager"
              className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all duration-200"
            >
              Try as Manager
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ STATS BAR ============ */}
      <section className="bg-white border-y border-slate-100 py-14 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center">
          {[
            { value: "500+", label: "Finance teams" },
            { value: "98%", label: "Approval rate in 24h" },
            { value: "$2.4M", label: "Expenses processed monthly" },
            { value: "4.9", label: "Average user rating" },
          ].map((stat, i) => (
            <div key={i}>
              <p className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-1 tabular-nums">
                {stat.value}
                {stat.label === "Average user rating" && (
                  <Star className="inline w-6 h-6 text-yellow-400 fill-yellow-400 ml-1 -mt-1" />
                )}
              </p>
              <p className="text-slate-500 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <span className="inline-block rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-300 mb-4">
              Testimonials
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              Finance teams love Monytar
            </h2>
          </div>

          {/* Cards — horizontal scroll on mobile */}
          <div
            className="flex md:grid md:grid-cols-3 gap-5
            overflow-x-auto md:overflow-visible
            snap-x snap-mandatory md:snap-none
            pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0
            scrollbar-hide"
          >
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[85vw] sm:w-[75vw] md:w-auto snap-center
                rounded-2xl bg-white/[0.06] border border-white/10 p-7
                hover:bg-white/[0.09] hover:border-white/20 transition-all duration-200"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, s) => (
                    <Star
                      key={s}
                      className="w-4 h-4 text-yellow-400 fill-yellow-400"
                      strokeWidth={0}
                    />
                  ))}
                </div>
                <p className="text-white/75 text-[15px] leading-relaxed mb-6 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                {/* Avatar row */}
                <div className="flex items-center gap-3 pt-5 border-t border-white/10">
                  <div
                    className="w-9 h-9 rounded-full bg-primary/30 flex items-center justify-center
                    text-white font-semibold text-sm flex-shrink-0"
                  >
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-none mb-1">{t.name}</p>
                    <p className="text-white/40 text-xs">
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="py-20 md:py-28 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary mb-4">
              Pricing
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-3">
              Simple, transparent pricing
            </h2>
            <p className="text-slate-500 text-lg">
              No hidden fees. Start free, scale when you&apos;re ready.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 items-start md:items-center">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "rounded-2xl p-8 relative",
                  plan.featured
                    ? "bg-primary text-white shadow-[0_8px_40px_rgba(99,102,241,0.4)] md:scale-[1.04] z-10"
                    : "bg-white border border-slate-200 shadow-sm"
                )}
              >
                {plan.featured && (
                  <span
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2
                    bg-white text-primary text-xs font-bold uppercase tracking-widest
                    px-4 py-1.5 rounded-full shadow-sm border border-primary/10 whitespace-nowrap"
                  >
                    Most popular
                  </span>
                )}
                <p
                  className={cn(
                    "text-sm font-bold uppercase tracking-widest mb-1",
                    plan.featured ? "text-white/70" : "text-slate-500"
                  )}
                >
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span
                    className={cn(
                      "font-display text-5xl font-bold",
                      plan.featured ? "text-white" : "text-slate-900"
                    )}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className={plan.featured ? "text-white/60" : "text-slate-400"}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className={cn("text-sm mb-8", plan.featured ? "text-white/70" : "text-slate-500")}>
                  {plan.users}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, fi) => (
                    <li
                      key={fi}
                      className={cn(
                        "flex items-center gap-3 text-sm",
                        plan.featured ? "text-white/90" : "text-slate-600"
                      )}
                    >
                      <Check
                        className={cn(
                          "w-4 h-4 flex-shrink-0",
                          plan.featured ? "text-white" : "text-primary"
                        )}
                        strokeWidth={2.5}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.cta === "Contact sales" ? "/contact" : "/signup"}
                  className={cn(
                    "block text-center rounded-xl py-3 text-sm font-semibold transition-all duration-200",
                    plan.featured
                      ? "bg-white text-primary hover:bg-primary/5"
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

      {/* ============ CTA BANNER ============ */}
      <section className="py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div
            className="relative rounded-3xl overflow-hidden
            bg-gradient-to-br from-primary via-primary to-indigo-600
            p-8 sm:p-12 md:p-20 text-center"
          >
            {/* Inner glow overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.15),transparent_60%)]" />
            {/* Dot texture */}
            <div className="absolute inset-0 bg-[url('/images/dot-grid.svg')] opacity-10" />

            <h2 className="relative font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Ready to simplify expense
              <br className="hidden sm:block" /> management?
            </h2>
            <p className="relative text-white/70 text-lg mb-10 max-w-lg mx-auto">
              Join 500+ finance teams. Set up in under 5 minutes. Free forever on our starter plan.
            </p>
            <div className="relative flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="rounded-full bg-white text-primary font-semibold px-8 py-3.5
                hover:bg-primary/5 shadow-[0_2px_12px_rgba(0,0,0,0.15)] transition-all duration-200"
              >
                Start free today
              </Link>
              <Link
                href="/demo"
                className="rounded-full border-2 border-white/30 text-white font-medium px-8 py-3.5
                hover:bg-white/10 hover:border-white/50 transition-all duration-200"
              >
                Explore the demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-slate-900 border-t border-white/5 pt-16 pb-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* 4-column grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <p className="font-display font-bold text-xl text-white mb-3">Monytar</p>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Expense management your finance team will actually use.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-slate-500 hover:text-white transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="text-slate-500 hover:text-white transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <p className="text-white text-sm font-semibold mb-4">Product</p>
              <ul className="space-y-3">
                {["Features", "Pricing", "Demo", "Changelog"].map((l) => (
                  <li key={l}>
                    <Link
                      href={`/${l.toLowerCase()}`}
                      className="text-slate-400 text-sm hover:text-white transition-colors"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-white text-sm font-semibold mb-4">Company</p>
              <ul className="space-y-3">
                {["About", "Blog", "Careers", "Contact"].map((l) => (
                  <li key={l}>
                    <Link
                      href={`/${l.toLowerCase()}`}
                      className="text-slate-400 text-sm hover:text-white transition-colors"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <p className="text-white text-sm font-semibold mb-4">Legal</p>
              <ul className="space-y-3">
                {["Privacy Policy", "Terms of Service", "Security", "Cookie Policy"].map((l) => (
                  <li key={l}>
                    <Link
                      href={`/${l.toLowerCase().replace(/ /g, "-")}`}
                      className="text-slate-400 text-sm hover:text-white transition-colors"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-slate-500 text-sm">
              &copy; {new Date().getFullYear()} Monytar. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-slate-500 text-sm hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-slate-500 text-sm hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
