"use server"

import { isStripeConfigured } from "@/lib/stripe/config"
import { getProductById } from "@/lib/products"

export async function createCheckoutSession(productId: string) {
  if (!isStripeConfigured()) {
    return { error: "Stripe is not configured. Please add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your environment variables." }
  }

  const product = getProductById(productId)
  if (!product) {
    return { error: "Invalid product selected" }
  }

  if (product.priceInCents === 0) {
    return { error: "Enterprise plans require contacting sales. Please reach out to sales@monytar.com" }
  }

  // Dynamic import to avoid errors when stripe is not configured
  const { stripe } = await import("@/lib/stripe/server")

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Monytar ${product.name}`,
              description: product.description,
            },
            unit_amount: product.priceInCents,
            recurring: {
              interval: product.interval,
            },
          },
          quantity: 1,
        },
      ],
      ui_mode: "embedded",
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    })

    return { clientSecret: session.client_secret }
  } catch (err) {
    console.error("Stripe checkout error:", err)
    return { error: "Failed to create checkout session. Please try again." }
  }
}

export async function getCheckoutSessionStatus(sessionId: string) {
  if (!isStripeConfigured()) {
    return { error: "Stripe is not configured" }
  }

  const { stripe } = await import("@/lib/stripe/server")

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return {
      status: session.status,
      customerEmail: session.customer_details?.email,
      planName: session.line_items?.data[0]?.description || "Monytar Plan",
    }
  } catch (err) {
    console.error("Error retrieving session:", err)
    return { error: "Failed to retrieve session status" }
  }
}
