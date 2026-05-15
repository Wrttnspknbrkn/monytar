"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Plus, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Suspense } from "react"

const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Retail",
  "Manufacturing",
  "Education",
  "Other",
]

const teamSizes = ["1-10", "11-50", "51-200", "201-500", "500+"]

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "\u20AC", name: "Euro" },
  { code: "GBP", symbol: "\u00A3", name: "British Pound" },
  { code: "GHS", symbol: "\u20B5", name: "Ghanaian Cedi" },
  { code: "NGN", symbol: "\u20A6", name: "Nigerian Naira" },
]

const roles = ["Admin", "Manager", "Employee"]

interface Invite {
  email: string
  role: string
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialStep = searchParams.get("step") === "2" ? 1 : 0

  const [step, setStep] = useState(initialStep)
  const [loading, setLoading] = useState(false)

  // Step 1 form data
  const [orgName, setOrgName] = useState("")
  const [industry, setIndustry] = useState("")
  const [teamSize, setTeamSize] = useState("")
  const [currency, setCurrency] = useState("USD")

  // Step 2 form data
  const [invites, setInvites] = useState<Invite[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState("Employee")

  function addInvite() {
    if (!newEmail.trim()) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error("Please enter a valid email address")
      return
    }
    if (invites.some((i) => i.email === newEmail)) {
      toast.error("This email has already been added")
      return
    }
    setInvites([...invites, { email: newEmail.trim(), role: newRole }])
    setNewEmail("")
    setNewRole("Employee")
  }

  function removeInvite(email: string) {
    setInvites(invites.filter((i) => i.email !== email))
  }

  async function handleStep1Submit() {
    if (!orgName.trim()) {
      toast.error("Please enter your company name")
      return
    }

    setLoading(true)
    try {
      // In demo mode or without Supabase, just proceed to step 2
      // In production, this would call the createOrg server action
      toast.success("Workspace created!")
      setStep(1)
    } catch (error) {
      toast.error("Failed to create workspace")
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete(skip = false) {
    setLoading(true)
    try {
      // In production, this would call completeOnboarding server action
      if (!skip && invites.length > 0) {
        toast.success(`${invites.length} invite(s) sent!`)
      }
      toast.success("Welcome to Monytar!")
      router.push("/dashboard")
    } catch (error) {
      toast.error("Failed to complete onboarding")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="font-display font-bold text-2xl text-slate-900">
            Monytar
          </Link>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-colors",
              step >= 0 ? "bg-primary" : "bg-slate-300"
            )}
          />
          <div className="w-8 h-0.5 bg-slate-200" />
          <div
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-colors",
              step >= 1 ? "bg-primary" : "bg-slate-300"
            )}
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {step === 0 ? (
            <>
              {/* Step 1: Create workspace */}
              <h1 className="font-display text-2xl font-bold text-slate-900 mb-2 text-center">
                Let&apos;s set up your workspace
              </h1>
              <p className="text-slate-500 text-sm text-center mb-8">
                Tell us about your organization to customize your experience.
              </p>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="orgName" className="text-sm font-medium text-slate-700">
                    Company name
                  </Label>
                  <Input
                    id="orgName"
                    placeholder="Acme Corp"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="industry" className="text-sm font-medium text-slate-700">
                    Industry
                  </Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger id="industry" className="h-11">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind} value={ind}>
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="teamSize" className="text-sm font-medium text-slate-700">
                    Team size
                  </Label>
                  <Select value={teamSize} onValueChange={setTeamSize}>
                    <SelectTrigger id="teamSize" className="h-11">
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamSizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size} people
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="currency" className="text-sm font-medium text-slate-700">
                    Default currency
                  </Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((cur) => (
                        <SelectItem key={cur.code} value={cur.code}>
                          {cur.symbol} {cur.code} - {cur.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleStep1Submit}
                  disabled={loading}
                  className="w-full h-11 mt-2 rounded-lg font-semibold"
                >
                  {loading ? "Creating..." : "Continue"}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Invite team */}
              <h1 className="font-display text-2xl font-bold text-slate-900 mb-2 text-center">
                Invite your team
              </h1>
              <p className="text-slate-500 text-sm text-center mb-8">
                Add teammates now or do it from Settings later.
              </p>

              {/* Add invite form */}
              <div className="flex gap-2 mb-4">
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addInvite()}
                  className="h-11 flex-1"
                />
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="h-11 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  onClick={addInvite}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Invited list */}
              {invites.length > 0 && (
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 mb-6">
                  {invites.map((invite) => (
                    <div
                      key={invite.email}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                          {invite.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{invite.email}</p>
                          <p className="text-xs text-slate-500">{invite.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeInvite(invite.email)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {invites.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No invites added yet. Add team members or skip for now.
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => handleComplete(false)}
                  disabled={loading}
                  className="w-full h-11 rounded-lg font-semibold"
                >
                  {loading ? "Setting up..." : invites.length > 0 ? "Send invites & open dashboard" : "Open dashboard"}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
                {invites.length === 0 && (
                  <button
                    onClick={() => handleComplete(true)}
                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Skip for now
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}
