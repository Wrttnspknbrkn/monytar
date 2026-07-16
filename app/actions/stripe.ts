"use server"

import type Stripe from "stripe"
import { isStripeConfigured } from "@/lib/stripe/config"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getProductById, PRODUCTS } from "@/lib/products"

/**
 * Opens the Stripe Customer Portal for the CURRENT authenticated user's
 * organization. The customer id is resolved server-side from the session —
 * never accepted from the client — so one tenant can't manage another's billing.
 */
export async function openBillingPortal() {
  if (!isStripeConfigured()) {
    return { error: "Billing is not configured yet." }
  }
  if (!isSupabaseConfigured()) {
    return { error: "Billing management is unavailable in demo mode." }
  }

  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in." }

  // Only admins/finance may manage billing.
  const { data: dbUser } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single()

  if (!dbUser || (dbUser.role !== "admin" && dbUser.role !== "finance")) {
    return { error: "Only admins and finance users can manage billing." }
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", dbUser.organization_id)
    .single()

  if (!org?.stripe_customer_id) {
    return { error: "No billing account found. Subscribe to a paid plan first." }
  }

  const { stripe } = await import("@/lib/stripe/server")
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings`,
    })
    return { url: session.url }
  } catch (err) {
    console.error("[Stripe] Portal error:", err)
    return { error: "Failed to open billing portal. Please try again." }
  }
}

/**
 * Creates a Stripe Checkout session for subscription purchase.
 * Price is always validated server-side to prevent tampering.
 */
export async function createCheckoutSession(productId: string, userEmail?: string) {
  // Validate Stripe configuration
  if (!isStripeConfigured()) {
    return { error: "Stripe is not configured. Please add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your environment variables." }
  }

  // Validate product exists and get server-defined price
  const product = getProductById(productId)
  if (!product) {
    return { error: "Invalid product selected" }
  }

  // Enterprise plans require manual sales process
  if (product.priceInCents === 0) {
    return { error: "Enterprise plans require contacting sales. Please reach out to sales@monytar.com" }
  }

  // Validate price is within expected range (security check)
  const validPrices = PRODUCTS.map(p => p.priceInCents).filter(p => p > 0)
  if (!validPrices.includes(product.priceInCents)) {
    console.error("[Stripe] Invalid price detected:", product.priceInCents)
    return { error: "Invalid product configuration" }
  }

  // Dynamic import to avoid errors when stripe is not configured
  const { stripe } = await import("@/lib/stripe/server")

  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Monytar ${product.name}`,
              description: product.description,
              metadata: {
                product_id: product.id,
                max_users: String(product.maxUsers || 'unlimited'),
              },
            },
            unit_amount: product.priceInCents, // Server-defined price only
            recurring: {
              interval: product.interval,
            },
          },
          quantity: 1,
        },
      ],
      ui_mode: "embedded",
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      // Allow subscription updates
      subscription_data: {
        metadata: {
          product_id: product.id,
          tier: product.name.toLowerCase(),
        },
      },
    }

    // Pre-fill email if provided (for logged-in users)
    if (userEmail) {
      sessionParams.customer_email = userEmail
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return { clientSecret: session.client_secret }
  } catch (err) {
    console.error("[Stripe] Checkout error:", err)
    return { error: "Failed to create checkout session. Please try again." }
  }
}

/**
 * Creates a Stripe Customer Portal session for managing existing subscriptions.
 * Allows customers to upgrade, downgrade, update payment methods, and cancel.
 */
export async function createCustomerPortalSession(customerId: string) {
  if (!isStripeConfigured()) {
    return { error: "Stripe is not configured. Please add your Stripe environment variables." }
  }

  // Validate customer ID format (basic security check)
  if (!customerId || !customerId.startsWith('cus_')) {
    return { error: "Invalid customer ID" }
  }

  const { stripe } = await import("@/lib/stripe/server")

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings`,
    })

    return { url: session.url }
  } catch (err) {
    console.error("[Stripe] Portal error:", err)
    return { error: "Failed to open billing portal. Please try again." }
  }
}

/**
 * Creates a checkout session for upgrading/downgrading an existing subscription.
 * This uses Stripe's subscription update flow.
 */
export async function createSubscriptionUpdateSession(
  customerId: string,
  currentSubscriptionId: string,
  newProductId: string
) {
  if (!isStripeConfigured()) {
    return { error: "Stripe is not configured." }
  }

  // Validate inputs
  if (!customerId?.startsWith('cus_') || !currentSubscriptionId?.startsWith('sub_')) {
    return { error: "Invalid subscription details" }
  }

  const newProduct = getProductById(newProductId)
  if (!newProduct || newProduct.priceInCents === 0) {
    return { error: "Invalid plan selected" }
  }

  const { stripe } = await import("@/lib/stripe/server")

  try {
    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(currentSubscriptionId)
    
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return { error: "Can only update active subscriptions" }
    }

    // Create a new price for the target product
    const price = await stripe.prices.create({
      currency: 'usd',
      unit_amount: newProduct.priceInCents,
      recurring: { interval: newProduct.interval },
      product_data: {
        name: `Monytar ${newProduct.name}`,
        metadata: { product_id: newProduct.id },
      },
    })

    // Update the subscription with proration
    const updatedSubscription = await stripe.subscriptions.update(currentSubscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: price.id,
        },
      ],
      proration_behavior: 'create_prorations',
      metadata: {
        product_id: newProduct.id,
        tier: newProduct.name.toLowerCase(),
      },
    })

    return { 
      success: true, 
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        currentPeriodEnd: updatedSubscription.current_period_end,
      }
    }
  } catch (err) {
    console.error("[Stripe] Subscription update error:", err)
    return { error: "Failed to update subscription. Please try again." }
  }
}

/**
 * Cancels a subscription at the end of the current billing period.
 */
export async function cancelSubscription(subscriptionId: string) {
  if (!isStripeConfigured()) {
    return { error: "Stripe is not configured." }
  }

  if (!subscriptionId?.startsWith('sub_')) {
    return { error: "Invalid subscription ID" }
  }

  const { stripe } = await import("@/lib/stripe/server")

  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })

    return { 
      success: true,
      cancelAt: subscription.cancel_at,
      currentPeriodEnd: subscription.current_period_end,
    }
  } catch (err) {
    console.error("[Stripe] Cancellation error:", err)
    return { error: "Failed to cancel subscription. Please try again." }
  }
}

/**
 * Reactivates a subscription that was scheduled for cancellation.
 */
export async function reactivateSubscription(subscriptionId: string) {
  if (!isStripeConfigured()) {
    return { error: "Stripe is not configured." }
  }

  if (!subscriptionId?.startsWith('sub_')) {
    return { error: "Invalid subscription ID" }
  }

  const { stripe } = await import("@/lib/stripe/server")

  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })

    return { 
      success: true,
      status: subscription.status,
    }
  } catch (err) {
    console.error("[Stripe] Reactivation error:", err)
    return { error: "Failed to reactivate subscription. Please try again." }
  }
}

/**
 * Gets the status of a checkout session.
 */
export async function getCheckoutSessionStatus(sessionId: string) {
  if (!isStripeConfigured()) {
    return { error: "Stripe is not configured" }
  }

  // Validate session ID format
  if (!sessionId?.startsWith('cs_')) {
    return { error: "Invalid session ID" }
  }

  const { stripe } = await import("@/lib/stripe/server")

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'subscription'],
    })

    return {
      status: session.status,
      customerEmail: session.customer_details?.email,
      planName: session.line_items?.data[0]?.description || "Monytar Plan",
      subscriptionId: typeof session.subscription === 'string' 
        ? session.subscription 
        : session.subscription?.id,
    }
  } catch (err) {
    console.error("[Stripe] Session retrieval error:", err)
    return { error: "Failed to retrieve session status" }
  }
}

/**
 * Gets subscription details for display in settings.
 */
export async function getSubscriptionDetails(subscriptionId: string) {
  if (!isStripeConfigured()) {
    return { error: "Stripe is not configured" }
  }

  if (!subscriptionId?.startsWith('sub_')) {
    return { error: "Invalid subscription ID" }
  }

  const { stripe } = await import("@/lib/stripe/server")

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    return {
      id: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: subscription.current_period_end,
      priceAmount: subscription.items.data[0]?.price?.unit_amount || 0,
    }
  } catch (err) {
    console.error("[Stripe] Subscription details error:", err)
    return { error: "Failed to retrieve subscription details" }
  }
}
