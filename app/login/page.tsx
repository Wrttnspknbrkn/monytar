"use client"

import React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ArrowRight, TrendingUp, Receipt, ShieldCheck, Check, Info, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/providers"
import { toast } from "sonner"

// Why the user landed here — shown as a banner so a redirect never looks like
// the app just "logged them out for no reason".
const LOGIN_NOTICES: Record<string, string> = {
  signed_out: "You've been signed out. Sign in again to continue.",
  expired: "Your session expired. Please sign in again.",
  timeout: "We couldn't restore your session. Please sign in again.",
  deactivated: "This account has been deactivated. Contact your administrator.",
  password_reset: "Your password was updated. Sign in with your new password.",
}

// Only ever follow same-site relative paths, never an attacker-supplied URL.
function safeRedirect(target: string | null): string {
  if (!target || !target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) return "/dashboard"
  return target
}

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reason = params.get("reason")
    if (reason && LOGIN_NOTICES[reason]) setNotice(LOGIN_NOTICES[reason])
    else if (params.get("redirect")) setNotice("Please sign in to continue.")
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setFormError(null)
    if (!email.trim() || !password) {
      setFormError("Enter your email and password to sign in.")
      return
    }
    setLoading(true)

    try {
      const result = await signIn(email.trim(), password)

      if (!result.error) {
        toast.success("Welcome back!")
        router.replace(safeRedirect(new URLSearchParams(window.location.search).get("redirect")))
      } else {
        setFormError(
          result.error === "Invalid login credentials"
            ? "Incorrect email or password. Check them and try again, or use \"Forgot?\" to reset your password."
            : /email not confirmed/i.test(result.error)
              ? "Your email address isn't verified yet. Open the confirmation link we emailed you, then sign in."
              : result.error,
        )
      }
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex">
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
              Submit expenses, route approvals, and track budgets in real time, with a
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
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-10">
            <Link href="/" className="font-display font-bold text-2xl text-foreground">
              Monytar
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground mb-1.5">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
          </div>

          {/* Form */}
          {notice && (
            <div role="status" className="mb-5 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
              <Info className="w-4 h-4 mt-0.5 shrink-0" /> <span>{notice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            {formError && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{formError}</span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-[13px] font-medium text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[13px] font-medium text-foreground">
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
                  autoComplete="current-password"
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
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

          {/* Signup link */}
          <p className="text-sm text-center text-muted-foreground mt-6">
            No account?{" "}
            <Link href="/signup" className="text-primary hover:underline font-semibold">
              Sign up
            </Link>
          </p>

          {/* Demo link - subtle at bottom */}
          <p className="text-xs text-center text-muted-foreground mt-4">
            <Link href="/demo" className="hover:text-foreground transition-colors">
              Try the demo &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
