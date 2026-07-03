"use client"

import React from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      toast.error("Please enter your email")
      return
    }

    if (!isSupabaseConfigured()) {
      // Demo mode: no real email is sent, but we confirm the UX.
      setSent(true)
      toast.success("Demo mode: a reset link would be emailed in production")
      return
    }

    setLoading(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      // Always show success to avoid leaking which emails are registered.
      if (error) console.error("[v0] reset error:", error.message)
      setSent(true)
    } catch (err) {
      console.error("[v0] reset exception:", err)
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <Link href="/" className="font-display font-bold text-2xl text-foreground">
            Monytar
          </Link>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-5">
              <MailCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight mb-2">Check your email</h1>
            <p className="text-sm text-muted-foreground mb-6 text-pretty">
              If an account exists for <span className="font-medium text-foreground">{email}</span>, we&apos;ve sent a link to reset your password.
            </p>
            <Button asChild variant="outline" className="w-full h-10 bg-transparent">
              <Link href="/login">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to sign in
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="font-display text-2xl font-bold tracking-tight mb-1.5">Forgot password?</h1>
              <p className="text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-[13px] font-medium">Email</Label>
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

              <Button type="submit" className="w-full h-10 font-semibold" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
                {!loading && <ArrowRight className="w-4 h-4 ml-1.5" />}
              </Button>
            </form>

            <p className="text-sm text-center text-muted-foreground mt-6">
              Remember your password?{" "}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
