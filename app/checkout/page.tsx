"use client"

import { useCallback, useState } from "react"
import { useSearchParams } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js"
import { createCheckoutSession } from "@/app/actions/stripe"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

function CheckoutContent() {
  const searchParams = useSearchParams()
  const productId = searchParams.get("plan") || "professional-monthly"
  const [error, setError] = useState<string | null>(null)

  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  const fetchClientSecret = useCallback(async () => {
    const result = await createCheckoutSession(productId)
    if (result.error) {
      setError(result.error)
      throw new Error(result.error)
    }
    return result.clientSecret!
  }, [productId])

  if (!stripePublishableKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center">
          <Logo size="lg" />
          <div className="mt-8 p-6 rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <AlertCircle className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
            <h2 className="font-heading font-bold text-lg mb-2">Payment Not Configured</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Stripe payment processing is not yet set up. Please add your Stripe API keys to the environment variables to enable subscriptions.
            </p>
            <div className="text-xs text-left bg-background rounded-lg p-3 font-mono border">
              <p>STRIPE_SECRET_KEY=sk_...</p>
              <p>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...</p>
            </div>
          </div>
          <Link href="/pricing" className="inline-flex items-center gap-2 mt-6 text-sm text-primary hover:underline font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Pricing
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center">
          <Logo size="lg" />
          <div className="mt-8 p-6 rounded-2xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-3" />
            <h2 className="font-heading font-bold text-lg mb-2">Checkout Error</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Link href="/pricing" className="inline-flex items-center gap-2 mt-6 text-sm text-primary hover:underline font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to Pricing
          </Link>
        </div>
      </div>
    )
  }

  const stripePromise = loadStripe(stripePublishableKey)

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          <Link href="/pricing">
            <Button variant="ghost" size="sm" className="text-sm font-medium">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </Link>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-heading text-2xl font-extrabold mb-2">Complete Your Subscription</h1>
        <p className="text-muted-foreground text-sm mb-8">Secure payment powered by Stripe</p>
        <div id="checkout" className="rounded-2xl overflow-hidden border border-border">
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-center">
          <Logo size="lg" />
          <p className="text-muted-foreground text-sm mt-4">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
