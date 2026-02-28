/**
 * Stripe configuration helper.
 * Returns true when the required env vars are present,
 * allowing the app to process real payments.
 * Set your Stripe keys via environment variables - no v0/Vercel integration needed.
 */

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  )
}

export function getStripePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set")
  return key
}
