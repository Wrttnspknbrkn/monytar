import { NextResponse, type NextRequest } from "next/server"
import { isStripeConfigured } from "@/lib/stripe/config"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { resolveSubscriptionTier } from "@/lib/products"
import { getSupabaseUrl, getSupabaseServiceKey } from "@/lib/supabase/config"
import type Stripe from "stripe"

// Initialize Supabase Admin client for webhook processing
function getSupabaseAdmin() {
  try {
    return createClient(getSupabaseUrl(), getSupabaseServiceKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  } catch (error) {
    console.error("[v0] Stripe webhook: Supabase admin client unavailable:", error)
    return null
  }
}

// Resolve the tier from a Stripe subscription, preferring authoritative metadata
// (product_id) and falling back to the price amount. Always a valid DB tier.
function tierFromSubscription(subscription: Stripe.Subscription): string {
  const productId = subscription.metadata?.product_id
  const priceAmount = subscription.items.data[0]?.price?.unit_amount || 0
  return resolveSubscriptionTier({ productId, priceAmount })
}

// Idempotency guard: returns true if this event was already processed.
async function alreadyProcessed(supabase: SupabaseClient, event: Stripe.Event): Promise<boolean> {
  const { error } = await supabase
    .from("stripe_webhook_events")
    .insert({ id: event.id, type: event.type })

  // Unique violation => we've already handled this event.
  if (error && (error.code === "23505" || error.message?.includes("duplicate"))) {
    return true
  }
  return false
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 501 })
  }

  const { stripe } = await import("@/lib/stripe/server")
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[Webhook] Missing signature or webhook secret")
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  // Idempotency: skip events we've already handled (Stripe retries on non-2xx).
  if (supabase && (await alreadyProcessed(supabase, event))) {
    console.log(`[Webhook] Skipping already-processed event: ${event.id}`)
    return NextResponse.json({ received: true, deduped: true })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === "subscription" && session.subscription && supabase) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const tier = tierFromSubscription(subscription)

          // Find user by email and update their organization's subscription
          const { data: user, error: userError } = await supabase
            .from("users")
            .select("organization_id")
            .eq("email", session.customer_email)
            .single()

          if (user && !userError) {
            await supabase
              .from("organizations")
              .update({
                subscription_tier: tier,
                subscription_status: "active",
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: session.subscription as string,
                updated_at: new Date().toISOString(),
              })
              .eq("id", user.organization_id)

            console.log(`[Webhook] Subscription activated for org ${user.organization_id}: ${tier}`)
          }
        }

        console.log("[Webhook] Checkout completed:", session.id, session.customer_email)
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription

        if (supabase) {
          const tier = tierFromSubscription(subscription)

          // Map Stripe status to our status
          let status: string = "active"
          if (subscription.status === "past_due") status = "past_due"
          else if (subscription.status === "canceled") status = "cancelled"
          else if (subscription.status === "unpaid") status = "suspended"
          else if (subscription.status === "trialing") status = "trialing"

          await supabase
            .from("organizations")
            .update({
              subscription_tier: tier,
              subscription_status: status,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id)

          console.log(`[Webhook] Subscription updated: ${subscription.id} -> ${tier} (${status})`)
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        if (supabase) {
          // Downgrade to the free tier when a subscription is cancelled.
          await supabase
            .from("organizations")
            .update({
              subscription_tier: "free",
              subscription_status: "cancelled",
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id)

          console.log(`[Webhook] Subscription cancelled: ${subscription.id}`)
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice

        if (supabase && invoice.subscription) {
          // Mark subscription as past due
          await supabase
            .from("organizations")
            .update({
              subscription_status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", invoice.subscription as string)

          console.log(`[Webhook] Payment failed for subscription: ${invoice.subscription}`)
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice

        if (supabase && invoice.subscription) {
          // Ensure subscription is marked as active after successful payment
          await supabase
            .from("organizations")
            .update({
              subscription_status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", invoice.subscription as string)

          console.log(`[Webhook] Payment succeeded for subscription: ${invoice.subscription}`)
        }
        break
      }

      default:
        // Unhandled event type - that's fine
        console.log(`[Webhook] Unhandled event type: ${event.type}`)
        break
    }
  } catch (err) {
    console.error("[Webhook] Error processing event:", err)
    // Roll back the idempotency record so Stripe's retry can reprocess this event.
    if (supabase) {
      await supabase.from("stripe_webhook_events").delete().eq("id", event.id)
    }
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
