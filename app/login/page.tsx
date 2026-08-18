"use client"

import React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff, ArrowRight, TrendingUp, Receipt, ShieldCheck, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/lib/providers"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
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

      if (!result.error) {
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

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-blue-600 to-cyan-600 relative overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:3rem_3rem]" />

        {/* Animated gradient orbs */}
        <div className="absolute top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-cyan-400/15 blur-3xl" />

        <div className="relative flex flex-col justify-between p-12 z-10 w-full">
          {/* Logo */}
          <Link href="/" className="font-display font-bold text-2xl text-white">
            Monytar
          </Link>

          {/* Dashboard preview */}
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div className="relative w-full max-w-sm">
              {/* Main card */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wider">
                      Monthly Spend
                    </p>
                    <p className="text-white font-display text-3xl font-bold mt-1">$24,580</p>
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

              {/* Floating cards */}
              <div className="absolute -top-8 -right-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-400/20">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px] font-medium uppercase tracking-wider">
                      Approved
                    </p>
                    <p className="text-white font-display font-bold text-sm">$18,205</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-400/20">
                    <Receipt className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <p className="text-white/60 text-[10px] font-medium uppercase tracking-wider">
                      Pending
                    </p>
                    <p className="text-white font-display font-bold text-sm">8 requests</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Value proposition */}
          <div className="mt-auto">
            <p className="text-white/80 text-sm leading-relaxed mb-4">
              Submit expenses, route approvals, and track budgets in real time — with a
              complete audit trail and CSV or PDF exports at month-end.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/60 text-xs">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Role-based approvals
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} /> Real-time budgets
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-10">
            <Link href="/" className="font-display font-bold text-2xl text-slate-900">
              Monytar
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 mb-1.5">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500">Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-[13px] font-medium text-slate-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[13px] font-medium text-slate-700">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 pr-10 focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="remember" />
              <Label
                htmlFor="remember"
                className="text-sm font-normal cursor-pointer text-slate-500"
              >
                Remember me for 30 days
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-10 rounded-lg bg-primary text-white font-semibold"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight className="w-4 h-4 ml-1.5" />}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-slate-400">or</span>
            </div>
          </div>

          {/* Google OAuth (placeholder) */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-10 font-medium bg-white border-slate-200 hover:bg-slate-50"
            disabled
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Signup link */}
          <p className="text-sm text-center text-slate-500 mt-6">
            No account?{" "}
            <Link href="/signup" className="text-primary hover:underline font-semibold">
              Sign up
            </Link>
          </p>

          {/* Demo link - subtle at bottom */}
          <p className="text-xs text-center text-slate-400 mt-4">
            <Link href="/demo" className="hover:text-slate-600 transition-colors">
              Try the demo &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
