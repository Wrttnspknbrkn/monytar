import { NextResponse, type NextRequest } from "next/server"
import { isStripeConfigured } from "@/lib/stripe/config"
import { createClient } from "@supabase/supabase-js"
import type Stripe from "stripe"

// Initialize Supabase Admin client for webhook processing
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Map Stripe price to subscription tier
function getSubscriptionTier(priceAmount: number): string {
  if (priceAmount <= 2900) return "starter"
  if (priceAmount <= 7900) return "professional"
  if (priceAmount <= 19900) return "business"
  return "enterprise"
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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === "subscription" && session.subscription && supabase) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const priceAmount = subscription.items.data[0]?.price?.unit_amount || 0
          const tier = getSubscriptionTier(priceAmount)

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
          const priceAmount = subscription.items.data[0]?.price?.unit_amount || 0
          const tier = getSubscriptionTier(priceAmount)

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
          // Downgrade to free/starter tier
          await supabase
            .from("organizations")
            .update({
              subscription_tier: "starter",
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
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
