"use client"

import type React from "react"

import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  User,
  Briefcase,
  Wallet,
  Settings,
  Sparkles,
  Loader2,
  ShieldCheck,
} from "lucide-react"
import { useAuth } from "@/lib/providers"
import type { UserRole } from "@/lib/types"
import { captureDemoLead } from "@/lib/demo/leads"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type DemoRole = Extract<UserRole, "employee" | "manager" | "finance" | "admin">

const demoRoles: {
  role: DemoRole
  icon: typeof User
  title: string
  desc: string
  highlights: string[]
}[] = [
  {
    role: "employee",
    icon: User,
    title: "Employee",
    desc: "Submit expenses, upload receipts, and track reimbursements.",
    highlights: ["Submit a request", "Upload receipts", "Track status"],
  },
  {
    role: "manager",
    icon: Briefcase,
    title: "Manager",
    desc: "Approve team expenses with full context and budget impact.",
    highlights: ["Approve & reject", "Team spend", "Budget impact"],
  },
  {
    role: "finance",
    icon: Wallet,
    title: "Finance",
    desc: "Track org KPIs, mark requests paid, and monitor budgets.",
    highlights: ["Org KPIs", "Mark as paid", "Budget overview"],
  },
  {
    role: "admin",
    icon: Settings,
    title: "Admin",
    desc: "Full organization control, settings, and user management.",
    highlights: ["Manage users", "Org settings", "Full access"],
  },
]

const validRoles = demoRoles.map((r) => r.role)

function DemoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { switchDemoRole } = useAuth()

  const [selectedRole, setSelectedRole] = useState<DemoRole | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ full_name: "", email: "", company_name: "", phone: "" })
  const [errors, setErrors] = useState<{ full_name?: string; email?: string }>({})
  const presetApplied = useRef(false)

  const requestedRole = searchParams.get("role") as UserRole | null

  // If a valid ?role= param is present (e.g. from the home page spotlights),
  // preselect that role and jump straight to the lead form.
  useEffect(() => {
    if (presetApplied.current) return
    if (requestedRole && validRoles.includes(requestedRole as never)) {
      presetApplied.current = true
      setSelectedRole(requestedRole as DemoRole)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedRole])

  function validate(): boolean {
    const next: { full_name?: string; email?: string } = {}
    if (form.full_name.trim().length < 2) next.full_name = "Please enter your name"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid work email"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRole || submitting) return
    if (!validate()) return

    setSubmitting(true)
    try {
      await captureDemoLead({
        full_name: form.full_name,
        email: form.email,
        company_name: form.company_name,
        phone: form.phone,
        entry_role: selectedRole,
      })
    } catch {
      // Lead capture is best-effort; never block the demo experience.
    }

    switchDemoRole(selectedRole)
    const title = demoRoles.find((r) => r.role === selectedRole)?.title ?? selectedRole
    toast.success(`Welcome, ${form.full_name.split(" ")[0]} — entering as ${title}`)
    setTimeout(() => router.push("/dashboard"), 450)
  }

  const activeRole = demoRoles.find((r) => r.role === selectedRole)

  return (
    <main className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center px-4 py-16">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(99,102,241,0.25),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_100%_100%,rgba(99,102,241,0.1),transparent)]" />
      <div className="absolute inset-0 bg-[url('/images/dot-grid.svg')] opacity-[0.05]" />

      <div className="relative w-full max-w-4xl">
        {/* Back link */}
        <button
          type="button"
          onClick={() => (selectedRole ? setSelectedRole(null) : router.push("/"))}
          className="inline-flex items-center gap-2 text-sm text-slate-400 mb-10 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {selectedRole ? "Choose a different role" : "Back to home"}
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-sm text-primary/90 mb-6 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Interactive demo — no account required
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 text-balance">
            {selectedRole ? `Start your ${activeRole?.title} demo` : "Explore Monytar from any role"}
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed text-pretty">
            {selectedRole
              ? "Tell us where to send your results. We'll drop you straight into a live sandbox with sample data."
              : "Pick a role to see the product from that perspective. The sandbox uses sample data and resets daily — explore freely."}
          </p>
        </div>

        {!selectedRole ? (
          /* ---------- Step 1: Role selection ---------- */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {demoRoles.map(({ role, icon: Icon, title, desc, highlights }) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={cn(
                  "group relative text-left rounded-2xl border p-6 transition-all duration-300 backdrop-blur-sm",
                  "bg-white/[0.04] hover:bg-white/[0.07] border-white/10 hover:border-primary/40",
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                </div>
                <h3 className="font-display font-bold text-white text-lg mb-1">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {highlights.map((h) => (
                    <span
                      key={h}
                      className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] font-medium text-slate-300"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* ---------- Step 2: Lead capture form ---------- */
          <div className="max-w-lg mx-auto mb-10">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 sm:p-8"
            >
              {/* Selected role chip */}
              {activeRole && (
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary/15 text-primary">
                    <activeRole.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Entering as {activeRole.title}</p>
                    <p className="text-slate-400 text-xs">{activeRole.desc}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Full name
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    placeholder="Ama Mensah"
                    className={cn(
                      "w-full rounded-lg bg-white/5 border px-3.5 py-2.5 text-white placeholder:text-slate-500 text-sm outline-none transition-colors focus:border-primary/60",
                      errors.full_name ? "border-red-500/60" : "border-white/15",
                    )}
                  />
                  {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Work email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="ama@company.com"
                    className={cn(
                      "w-full rounded-lg bg-white/5 border px-3.5 py-2.5 text-white placeholder:text-slate-500 text-sm outline-none transition-colors focus:border-primary/60",
                      errors.email ? "border-red-500/60" : "border-white/15",
                    )}
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company_name" className="block text-sm font-medium text-slate-300 mb-1.5">
                      Company <span className="text-slate-500 font-normal">(optional)</span>
                    </label>
                    <input
                      id="company_name"
                      type="text"
                      value={form.company_name}
                      onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                      placeholder="Acme Inc."
                      className="w-full rounded-lg bg-white/5 border border-white/15 px-3.5 py-2.5 text-white placeholder:text-slate-500 text-sm outline-none transition-colors focus:border-primary/60"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-1.5">
                      Phone <span className="text-slate-500 font-normal">(optional)</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+233 ..."
                      className="w-full rounded-lg bg-white/5 border border-white/15 px-3.5 py-2.5 text-white placeholder:text-slate-500 text-sm outline-none transition-colors focus:border-primary/60"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-white font-semibold text-sm transition-colors hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Preparing your sandbox…
                  </>
                ) : (
                  <>
                    Launch demo <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5" />
                No spam. We use this only to follow up about your demo.
              </p>
            </form>
          </div>
        )}

        {/* Upgrade nudge */}
        <div className="text-center text-sm text-slate-400">
          Ready to use your own data?{" "}
          <Link href="/signup" className="text-primary font-semibold hover:underline underline-offset-2">
            Create a free account &rarr;
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </main>
      }
    >
      <DemoContent />
    </Suspense>
  )
}
