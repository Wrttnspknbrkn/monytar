"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, User, Briefcase, Wallet, Settings, Sparkles, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/providers"
import type { UserRole } from "@/lib/types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const demoRoles: {
  role: Extract<UserRole, "employee" | "manager" | "finance" | "admin">
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
  const [entering, setEntering] = useState<UserRole | null>(null)
  const autoLaunched = useRef(false)

  const requestedRole = searchParams.get("role") as UserRole | null

  function enterDemo(role: Extract<UserRole, "employee" | "manager" | "finance" | "admin">) {
    if (entering) return
    setEntering(role)
    switchDemoRole(role)
    const title = demoRoles.find((r) => r.role === role)?.title ?? role
    toast.success(`Entering demo as ${title}`)
    setTimeout(() => router.push("/dashboard"), 450)
  }

  // If a valid ?role= param is present (e.g. from the home page spotlights),
  // auto-launch the demo into that role for a seamless flow.
  useEffect(() => {
    if (autoLaunched.current) return
    if (requestedRole && validRoles.includes(requestedRole as never)) {
      autoLaunched.current = true
      enterDemo(requestedRole as Extract<UserRole, "employee" | "manager" | "finance" | "admin">)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedRole])

  return (
    <main className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center px-4 py-16">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(99,102,241,0.25),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_100%_100%,rgba(99,102,241,0.1),transparent)]" />
      <div className="absolute inset-0 bg-[url('/images/dot-grid.svg')] opacity-[0.05]" />

      <div className="relative w-full max-w-4xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 mb-10 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-sm text-primary/90 mb-6 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Interactive demo — no signup needed
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Explore Monytar from any role
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            Pick a role to see the product from that perspective. The sandbox uses sample data and
            resets daily — explore freely.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {demoRoles.map(({ role, icon: Icon, title, desc, highlights }) => {
            const isEntering = entering === role
            const isPreselected = requestedRole === role
            return (
              <button
                key={role}
                onClick={() => enterDemo(role)}
                disabled={!!entering}
                className={cn(
                  "group relative text-left rounded-2xl border p-6 transition-all duration-300 backdrop-blur-sm",
                  "bg-white/[0.04] hover:bg-white/[0.07] disabled:cursor-not-allowed",
                  isPreselected ? "border-primary/50 ring-1 ring-primary/30" : "border-white/10 hover:border-primary/40"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300",
                      "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                    )}
                  >
                    {isEntering ? <Loader2 className="w-6 h-6 animate-spin" /> : <Icon className="w-6 h-6" />}
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
                <span className="mt-4 inline-block text-primary text-sm font-semibold">
                  {isEntering ? "Loading…" : `Enter as ${title}`}
                </span>
              </button>
            )
          })}
        </div>

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
