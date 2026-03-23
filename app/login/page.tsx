"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ArrowRight, TrendingUp, Receipt, ShieldCheck } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/providers"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const { signIn, switchDemoRole, isDemo } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Please enter your email and password")
      return
    }
    setLoading(true)

    try {
      const result = await signIn(email, password)
      
      if (result.success) {
        toast.success("Welcome back!")
        router.push("/dashboard")
      } else {
        toast.error(result.error || "Invalid email or password")
      }
    } catch {
      toast.error("Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleDemoLogin(role: "employee" | "manager" | "finance" | "admin") {
    switchDemoRole(role)
    toast.success(`Switched to ${role} demo`)
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Abstract Financial Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-blue-600 to-cyan-600 relative overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:3rem_3rem]" />

        {/* Animated gradient orbs */}
        <div className="absolute top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-300/5 blur-3xl" />

        <div className="relative flex flex-col justify-between p-12 z-10 w-full">
          <Logo size="lg" variant="white" />

          {/* Abstract Financial Dashboard Illustration */}
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div className="relative w-full max-w-sm">
              {/* Main card */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wider">Monthly Spend</p>
                    <p className="text-white font-heading text-3xl font-extrabold mt-1">$24,580</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-semibold">
                    <TrendingUp className="w-3 h-3" />
                    +12.3%
                  </div>
                </div>
                {/* Mini bar chart */}
                <div className="flex items-end gap-1.5 h-20">
                  {[35, 52, 48, 65, 58, 72, 68, 82, 75, 88, 80, 95].map((h, i) => (
                    <div key={i} className="flex-1 flex items-end">
                      <div
                        className="w-full rounded-t-sm bg-white/25 hover:bg-white/40 transition-colors"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating card - top right */}
              <div className="absolute -top-8 -right-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-400/20">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px] font-medium uppercase tracking-wider">Approved</p>
                    <p className="text-white font-heading font-bold text-sm">$18,205</p>
                  </div>
                </div>
              </div>

              {/* Floating card - bottom left */}
              <div className="absolute -bottom-6 -left-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-400/20">
                    <Receipt className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px] font-medium uppercase tracking-wider">Pending</p>
                    <p className="text-white font-heading font-bold text-sm">8 requests</p>
                  </div>
                </div>
              </div>

              {/* Donut chart indicator */}
              <div className="absolute -bottom-10 -right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3.5 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-10 h-10">
                    <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeDasharray="72 28" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-heading font-bold text-sm">72%</p>
                    <p className="text-white/50 text-[10px]">Budget</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom stats */}
          <div className="flex items-center gap-8">
            {[
              { metric: "98%", label: "Faster approvals" },
              { metric: "$2.1M", label: "Savings generated" },
              { metric: "4.9/5", label: "User satisfaction" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-heading text-xl font-extrabold text-white">{stat.metric}</p>
                <p className="text-xs text-white/50 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center justify-center mb-10">
            <Logo size="lg" />
          </div>

          <div className="mb-8">
            <h2 className="font-heading text-2xl font-extrabold tracking-tight mb-1.5">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-[13px] font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10"
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[13px] font-medium">
                  Password
                </Label>
                <Link href="/login" className="text-xs text-primary hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer text-muted-foreground">
                Remember me for 30 days
              </Label>
            </div>
            <Button
              type="submit"
              className="w-full h-10 font-semibold shadow-sm shadow-primary/25 hover:shadow-md hover:shadow-primary/30 transition-all"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight className="w-4 h-4 ml-1.5" />}
            </Button>
          </form>

          {/* Demo quick login */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3 font-medium uppercase tracking-wider">
              Try the demo
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Employee", role: "employee" as const, color: "hover:border-blue-300 dark:hover:border-blue-700" },
                { label: "Manager", role: "manager" as const, color: "hover:border-emerald-300 dark:hover:border-emerald-700" },
                { label: "Finance", role: "finance" as const, color: "hover:border-amber-300 dark:hover:border-amber-700" },
                { label: "Admin", role: "admin" as const, color: "hover:border-rose-300 dark:hover:border-rose-700" },
              ].map((demo) => (
                <Button
                  key={demo.label}
                  variant="outline"
                  size="sm"
                  className={cn("text-xs font-medium bg-transparent transition-colors", demo.color)}
                  onClick={() => handleDemoLogin(demo.role)}
                >
                  {demo.label}
                </Button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/60 text-center mt-2">
              Demo data resets on page reload
            </p>
          </div>

          <p className="text-sm text-center text-muted-foreground mt-8">
            {"Don't have an account? "}
            <Link href="/signup" className="text-primary hover:underline font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
