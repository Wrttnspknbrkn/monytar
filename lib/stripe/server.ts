import "server-only"
import Stripe from "stripe"

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY
    if (!apiKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured")
    }
    stripeInstance = new Stripe(apiKey, { typescript: true })
  }
  return stripeInstance
}

// Deprecated: use getStripe() instead
export const stripe = {
  get checkout() {
    return getStripe().checkout
  },
  get customers() {
    return getStripe().customers
  },
  get subscriptions() {
    return getStripe().subscriptions
  },
  get prices() {
    return getStripe().prices
  },
  get products() {
    return getStripe().products
  },
  get billingPortal() {
    return getStripe().billingPortal
  },
}
