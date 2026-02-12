"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Wallet, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useStore } from "@/lib/store"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const { users, switchUser } = useStore()
  const [email, setEmail] = useState("alex.johnson@acme.com")
  const [password, setPassword] = useState("password123")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      const user = users.find((u) => u.email === email)
      if (user) {
        switchUser(user.id)
        toast.success(`Welcome back, ${user.full_name}!`)
        router.push("/dashboard")
      } else {
        toast.error("Invalid email or password")
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-blue-600 to-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="relative flex flex-col justify-between p-12 z-10 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-heading font-bold tracking-tight">SpendFlow</span>
          </div>

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm font-medium mb-6 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Trusted by 250+ organizations
            </div>
            <h1 className="font-heading text-4xl font-extrabold leading-tight mb-4">
              Take control of every dollar your organization spends.
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              From expense submission to reimbursement. Real-time analytics, automated approvals, and complete financial visibility.
            </p>
          </div>

          <div className="flex items-center gap-6">
            {[
              { metric: "98%", label: "Faster approvals" },
              { metric: "$2.1M", label: "Savings generated" },
              { metric: "4.9/5", label: "User satisfaction" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-heading text-2xl font-extrabold">{stat.metric}</p>
                <p className="text-sm text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Abstract shapes */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-10">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary shadow-sm shadow-primary/25">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-heading font-bold tracking-tight">SpendFlow</span>
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

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3 font-medium uppercase tracking-wider">
              Quick demo login
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Employee", email: "alex.johnson@acme.com", color: "hover:border-blue-300 dark:hover:border-blue-700" },
                { label: "Manager", email: "maria.garcia@acme.com", color: "hover:border-emerald-300 dark:hover:border-emerald-700" },
                { label: "Finance", email: "james.wilson@acme.com", color: "hover:border-amber-300 dark:hover:border-amber-700" },
                { label: "Admin", email: "sarah.chen@acme.com", color: "hover:border-rose-300 dark:hover:border-rose-700" },
              ].map((demo) => (
                <Button
                  key={demo.label}
                  variant="outline"
                  size="sm"
                  className={cn("text-xs font-medium bg-transparent transition-colors", demo.color)}
                  onClick={() => {
                    setEmail(demo.email)
                    setPassword("password123")
                  }}
                >
                  {demo.label}
                </Button>
              ))}
            </div>
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
