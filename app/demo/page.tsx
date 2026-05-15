"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, User, Briefcase, Settings } from "lucide-react"
import { useAuth } from "@/lib/providers"
import { toast } from "sonner"

const demoRoles = [
  {
    role: "employee" as const,
    icon: User,
    title: "Employee",
    desc: "Submit expenses, upload receipts, track reimbursements",
  },
  {
    role: "manager" as const,
    icon: Briefcase,
    title: "Manager",
    desc: "Approve expenses, view team spend, manage budgets",
  },
  {
    role: "admin" as const,
    icon: Settings,
    title: "Admin",
    desc: "Full org control, settings, user management",
  },
]

export default function DemoPage() {
  const router = useRouter()
  const { switchDemoRole } = useAuth()

  function loginAsDemoRole(role: "employee" | "manager" | "admin") {
    switchDemoRole(role)
    toast.success(`Entering demo as ${role}`)
    router.push("/dashboard")
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 mb-10 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Explore Monytar — no signup needed
          </h1>
          <p className="text-slate-500 text-lg">
            Pick a role to see the product from that perspective. The sandbox resets daily.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {demoRoles.map(({ role, icon: Icon, title, desc }) => (
            <button
              key={role}
              onClick={() => loginAsDemoRole(role)}
              className="group rounded-2xl border-2 border-slate-100 hover:border-primary/50 p-7 text-left
                transition-all hover:shadow-float bg-white"
            >
              <div
                className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center mb-4
                group-hover:bg-primary group-hover:text-white transition-colors"
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-slate-900 text-lg mb-1">{title}</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">{desc}</p>
              <span className="text-primary text-sm font-medium group-hover:underline">
                Enter as {title} &rarr;
              </span>
            </button>
          ))}
        </div>

        {/* Upgrade nudge */}
        <div className="text-center text-sm text-slate-500">
          Ready to use your own data?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Create a free account &rarr;
          </Link>
        </div>
      </div>
    </main>
  )
}
