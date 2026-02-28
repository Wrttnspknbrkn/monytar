"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { getCheckoutSessionStatus } from "@/app/actions/stripe"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [status, setStatus] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }

    async function checkStatus() {
      const result = await getCheckoutSessionStatus(sessionId!)
      if (!result.error) {
        setStatus(result.status || null)
        setEmail(result.customerEmail || null)
      }
      setLoading(false)
    }
    checkStatus()
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Confirming your subscription...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center">
        <Logo size="lg" />

        <div className="mt-8 p-8 rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="font-heading text-2xl font-extrabold mb-2">Subscription Activated</h1>
          <p className="text-muted-foreground text-sm mb-6">
            {email
              ? `A confirmation email has been sent to ${email}. Your SpendWell account is now active.`
              : "Your SpendWell subscription is now active. You can start managing expenses immediately."
            }
          </p>

          <Link href="/dashboard">
            <Button className="w-full font-semibold shadow-sm shadow-primary/25">
              Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Need help? Contact us at{" "}
          <a href="mailto:support@spendwell.io" className="text-primary hover:underline">
            support@spendwell.io
          </a>
        </p>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
