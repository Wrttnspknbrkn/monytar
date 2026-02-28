"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, ArrowLeft, Check, Users, BarChart3, TrendingUp, Globe, ShieldCheck } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const steps = [
  { title: "Account Details", description: "Create your personal account" },
  { title: "Organization", description: "Set up your organization" },
  { title: "Get Started", description: "You're all set!" },
]

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    orgName: "",
    orgSize: "",
  })

  function handleNext() {
    if (step < 2) setStep(step + 1)
    else {
      toast.success("Account created! Redirecting to dashboard...")
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Abstract Financial Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-primary to-cyan-600 relative overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:3rem_3rem]" />

        {/* Animated gradient orbs */}
        <div className="absolute -top-20 right-10 w-64 h-64 rounded-full bg-cyan-300/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -left-16 w-72 h-72 rounded-full bg-white/8 blur-3xl" />

        <div className="relative flex flex-col justify-between p-12 z-10 w-full">
          {/* Logo */}
          <Logo size="lg" variant="white" />

          {/* Abstract Financial Illustration */}
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div className="relative w-full max-w-sm">
              {/* Central pie chart visual */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl">
                <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-4">Spending by Category</p>
                <div className="flex items-center gap-6">
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                      <circle cx="18" cy="18" r="13" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                      <circle cx="18" cy="18" r="13" fill="none" stroke="rgba(96,165,250,0.8)" strokeWidth="5" strokeDasharray="32 68" strokeLinecap="round" />
                      <circle cx="18" cy="18" r="13" fill="none" stroke="rgba(52,211,153,0.7)" strokeWidth="5" strokeDasharray="22 78" strokeDashoffset="-32" strokeLinecap="round" />
                      <circle cx="18" cy="18" r="13" fill="none" stroke="rgba(251,191,36,0.7)" strokeWidth="5" strokeDasharray="18 82" strokeDashoffset="-54" strokeLinecap="round" />
                      <circle cx="18" cy="18" r="13" fill="none" stroke="rgba(248,113,113,0.6)" strokeWidth="5" strokeDasharray="12 88" strokeDashoffset="-72" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-white font-heading text-lg font-extrabold">$24.5k</p>
                        <p className="text-white/40 text-[9px]">Total</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { color: "bg-blue-400", label: "Software", pct: "38%" },
                      { color: "bg-emerald-400", label: "Travel", pct: "28%" },
                      { color: "bg-amber-400", label: "Equipment", pct: "20%" },
                      { color: "bg-red-400", label: "Other", pct: "14%" },
                    ].map((cat) => (
                      <div key={cat.label} className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", cat.color)} />
                        <span className="text-white/70 text-xs">{cat.label}</span>
                        <span className="text-white/40 text-xs ml-auto">{cat.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating card - top right */}
              <div className="absolute -top-6 -right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3.5 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-400/20">
                    <TrendingUp className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-white font-heading font-bold text-sm">60%</p>
                    <p className="text-white/50 text-[10px]">Time saved</p>
                  </div>
                </div>
              </div>

              {/* Floating card - bottom left */}
              <div className="absolute -bottom-5 -left-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3.5 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-400/20">
                    <Globe className="w-4 h-4 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-white font-heading font-bold text-sm">250+</p>
                    <p className="text-white/50 text-[10px]">Teams</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="flex flex-col gap-3">
            {[
              { icon: Users, text: "Invite unlimited team members" },
              { icon: BarChart3, text: "Real-time analytics and budget tracking" },
              { icon: ShieldCheck, text: "Enterprise-grade security" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/10">
                    <Icon className="w-3.5 h-3.5 text-white/70" />
                  </div>
                  <span className="text-sm text-white/60">{item.text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center justify-center mb-10">
            <Logo size="lg" />
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s.title} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all duration-300",
                    i < step
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                      : i === step
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                        : "bg-secondary text-muted-foreground",
                  )}
                >
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={cn("w-10 h-0.5 rounded-full transition-colors", i < step ? "bg-primary" : "bg-border")} />
                )}
              </div>
            ))}
          </div>

          <div className="mb-8 text-center">
            <h2 className="font-heading text-2xl font-extrabold tracking-tight mb-1.5">{steps[step].title}</h2>
            <p className="text-sm text-muted-foreground">{steps[step].description}</p>
          </div>

          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="fullName" className="text-[13px] font-medium">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="signupEmail" className="text-[13px] font-medium">Work Email</Label>
                <Input
                  id="signupEmail"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="signupPassword" className="text-[13px] font-medium">Password</Label>
                <Input
                  id="signupPassword"
                  type="password"
                  placeholder="Min 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="orgName" className="text-[13px] font-medium">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="Acme Corporation"
                  value={formData.orgName}
                  onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="orgSize" className="text-[13px] font-medium">Team Size</Label>
                <Input
                  id="orgSize"
                  placeholder="e.g. 10-50"
                  value={formData.orgSize}
                  onChange={(e) => setFormData({ ...formData, orgSize: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-5">
                <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2">Your account is ready!</h3>
              <p className="text-sm text-muted-foreground">
                Click below to access your dashboard and start managing expenses.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 mt-6">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 h-10 bg-transparent font-semibold">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
            <Button onClick={handleNext} className="flex-1 h-10 font-semibold shadow-sm shadow-primary/25 hover:shadow-md hover:shadow-primary/30 transition-all">
              {step === 2 ? "Go to Dashboard" : "Continue"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {step === 0 && (
            <p className="text-sm text-center text-muted-foreground mt-8">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
