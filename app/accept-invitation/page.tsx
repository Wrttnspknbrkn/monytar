"use client"

import React from "react"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Eye, EyeOff, Mail, ShieldCheck, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface InvitationPreview {
  email: string
  role: string
  organizationName: string
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") || ""

  const [preview, setPreview] = useState<InvitationPreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(true)

  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState<{ email: string; confirmationUrl?: string; domainNotVerified?: boolean } | null>(null)

  useEffect(() => {
    if (!token) {
      setPreviewError("This invitation link is missing its token.")
      setLoadingPreview(false)
      return
    }
    fetch(`/api/auth/accept-invitation?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setPreviewError(data.error || "This invitation is invalid or has expired.")
          return
        }
        setPreview(data)
      })
      .catch(() => setPreviewError("Couldn't load this invitation. Please try again."))
      .finally(() => setLoadingPreview(false))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (fullName.trim().length < 2) {
      toast.error("Please enter your full name")
      return
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/auth/accept-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, fullName, password }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        toast.error(data.error || "Couldn't accept this invitation")
        return
      }

      if (data.signedIn) {
        toast.success(`Welcome to ${preview?.organizationName || "Monytar"}!`)
        router.push("/dashboard")
        return
      }

      setAwaitingConfirmation({ email: data.email, confirmationUrl: data.confirmationUrl, domainNotVerified: data.emailDomainNotVerified })
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-5">
          <Mail className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1.5">Check your email</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {awaitingConfirmation.confirmationUrl
            ? <>We couldn&apos;t email a confirmation link to <strong>{awaitingConfirmation.email}</strong>{awaitingConfirmation.domainNotVerified ? " — our sending domain isn't verified yet" : ""}. Use the link below to activate your account, then sign in.</>
            : <>We sent a confirmation link to <strong>{awaitingConfirmation.email}</strong>. Click it to activate your account, then sign in.</>}
        </p>
        {awaitingConfirmation.confirmationUrl && (
          <div className="mb-6 p-3 rounded-lg bg-secondary/50 text-left">
            <p className="text-xs text-muted-foreground mb-1.5">Confirmation link:</p>
            <a href={awaitingConfirmation.confirmationUrl} className="text-xs text-primary hover:underline break-all">
              {awaitingConfirmation.confirmationUrl}
            </a>
          </div>
        )}
        <Link href="/login" className="text-primary hover:underline font-semibold text-sm">
          Back to sign in
        </Link>
      </div>
    )
  }

  if (loadingPreview) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
      </div>
    )
  }

  if (previewError || !preview) {
    return (
      <div className="text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 mx-auto mb-5">
          <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1.5">Invitation not found</h1>
        <p className="text-sm text-muted-foreground mb-6">{previewError}</p>
        <Link href="/login" className="text-primary hover:underline font-semibold text-sm">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mx-auto mb-5">
          <ShieldCheck className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1.5">Join {preview.organizationName}</h1>
        <p className="text-sm text-muted-foreground">
          You&apos;ve been invited as <strong className="text-foreground">{preview.role}</strong>. Set your name and password to finish.
        </p>
        <p className="text-xs text-muted-foreground mt-2">{preview.email}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName" className="text-[13px] font-medium">Full name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            required
            className="h-10"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-[13px] font-medium">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min 8 characters"
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

        <Button type="submit" className="w-full h-10 font-semibold" disabled={submitting}>
          {submitting ? "Creating account..." : "Accept invitation"}
          {!submitting && <ArrowRight className="w-4 h-4 ml-1.5" />}
        </Button>
      </form>
    </>
  )
}

export default function AcceptInvitationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <Link href="/" className="font-display font-bold text-2xl text-foreground">
            Monytar
          </Link>
        </div>
        <Suspense fallback={
          <div className="text-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          </div>
        }>
          <AcceptInvitationContent />
        </Suspense>
      </div>
    </div>
  )
}
