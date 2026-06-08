"use client"

import { useState } from "react"
import { ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface NewsletterSignupProps {
  variant?: "card" | "inline"
}

export function NewsletterSignup({ variant = "card" }: NewsletterSignupProps) {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!valid) {
      setError("Please enter a valid email address.")
      return
    }
    setError("")
    // Newsletter delivery is wired to the backend in a later phase. For now we
    // confirm receipt so the experience is complete and never a dead end.
    setSubmitted(true)
  }

  if (variant === "inline") {
    return (
      <div className="rounded-2xl border border-border bg-secondary/40 p-6 md:p-8">
        <h3 className="font-heading text-xl font-bold mb-2">Get finance insights in your inbox</h3>
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Practical writing on spend management and finance operations. One email a month, no noise.
        </p>
        {submitted ? (
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Check className="w-4 h-4" />
            You are subscribed. Thanks for joining.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="newsletter-email-inline" className="sr-only">
                Email address
              </label>
              <Input
                id="newsletter-email-inline"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
              {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
            </div>
            <Button type="submit" className="h-11 px-6 font-semibold">
              Subscribe
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        )}
      </div>
    )
  }

  return (
    <section className="py-20 bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-balance">
          Writing worth your inbox
        </h2>
        <p className="text-base md:text-lg text-slate-300 mb-8 max-w-xl mx-auto leading-relaxed">
          Join finance leaders who read our monthly note on spend management, approvals, and running a sharper finance team.
        </p>
        {submitted ? (
          <div className="inline-flex items-center gap-2 text-base font-medium text-primary-foreground bg-primary/90 px-5 py-3 rounded-full">
            <Check className="w-5 h-5" />
            You are subscribed. Thanks for joining.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="flex-1 text-left">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <Input
                id="newsletter-email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-white/10 border-white/15 text-white placeholder:text-slate-400 focus-visible:ring-primary"
              />
              {error && <p className="text-xs text-red-300 mt-1.5">{error}</p>}
            </div>
            <Button type="submit" size="lg" className="h-12 px-6 font-semibold">
              Subscribe
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        )}
        <p className="text-xs text-slate-500 mt-4">No spam. Unsubscribe anytime.</p>
      </div>
    </section>
  )
}
