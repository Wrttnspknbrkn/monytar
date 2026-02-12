"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Wallet, ArrowRight, ArrowLeft, Check, Sparkles, Users, BarChart3 } from "lucide-react"
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
              Free plan available
            </div>
            <h1 className="font-heading text-4xl font-extrabold leading-tight mb-4">
              Start managing expenses in minutes.
            </h1>
            <p className="text-white/70 text-lg leading-relaxed">
              Set up your organization, invite your team, and start tracking every dollar with full transparency.
            </p>

            <div className="flex flex-col gap-4 mt-8">
              {[
                { icon: Users, text: "Invite unlimited team members on every plan" },
                { icon: BarChart3, text: "Real-time analytics and budget tracking" },
                { icon: Check, text: "Automated approval workflows out of the box" },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-white/80">{item.text}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="text-xs text-white/40">Developed by GydGen</p>
        </div>
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
