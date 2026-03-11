import { NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Use service role for database updates
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    throw new Error("Supabase admin credentials not configured")
  }
  
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Map Stripe price IDs to tiers
const PRICE_TO_TIER: Record<string, { tier: string; maxUsers: number }> = {
  // Add your Stripe price IDs here
  [process.env.STRIPE_STARTER_PRICE_ID || "price_starter"]: { tier: "starter", maxUsers: 10 },
  [process.env.STRIPE_PROFESSIONAL_PRICE_ID || "price_professional"]: { tier: "professional", maxUsers: 50 },
  [process.env.STRIPE_BUSINESS_PRICE_ID || "price_business"]: { tier: "enterprise", maxUsers: 200 },
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const supabase = getAdminClient()

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          
          const customerId = session.customer as string
          const orgId = session.metadata?.organization_id
          
          if (!orgId) {
            console.error("No organization_id in session metadata")
            break
          }
          
          const priceId = subscription.items.data[0]?.price.id
          const tierInfo = PRICE_TO_TIER[priceId] || { tier: "starter", maxUsers: 10 }
          
          // Update organization with subscription info
          await supabase
            .from("organizations")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              subscription_tier: tierInfo.tier,
              subscription_status: "active",
              max_users: tierInfo.maxUsers,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("id", orgId)
          
          // Log subscription history
          await supabase
            .from("subscription_history")
            .insert({
              organization_id: orgId,
              stripe_subscription_id: subscription.id,
              event_type: "subscription_created",
              new_tier: tierInfo.tier,
              new_status: "active",
              amount_cents: subscription.items.data[0]?.price.unit_amount || 0,
              currency: subscription.currency,
              metadata: { price_id: priceId },
            })
        }
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        
        // Find organization by customer ID
        const { data: org } = await supabase
          .from("organizations")
          .select("id, subscription_tier, subscription_status")
          .eq("stripe_customer_id", subscription.customer)
          .single()
        
        if (!org) {
          console.error("Organization not found for customer:", subscription.customer)
          break
        }
        
        const priceId = subscription.items.data[0]?.price.id
        const tierInfo = PRICE_TO_TIER[priceId] || { tier: "starter", maxUsers: 10 }
        
        const newStatus = subscription.status === "active" ? "active" 
          : subscription.status === "trialing" ? "trialing"
          : subscription.status === "past_due" ? "past_due"
          : subscription.status === "canceled" ? "canceled"
          : "inactive"
        
        // Update organization
        await supabase
          .from("organizations")
          .update({
            subscription_tier: tierInfo.tier,
            subscription_status: newStatus,
            max_users: tierInfo.maxUsers,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq("id", org.id)
        
        // Log change
        await supabase
          .from("subscription_history")
          .insert({
            organization_id: org.id,
            stripe_subscription_id: subscription.id,
            event_type: "subscription_updated",
            previous_tier: org.subscription_tier,
            new_tier: tierInfo.tier,
            previous_status: org.subscription_status,
            new_status: newStatus,
            amount_cents: subscription.items.data[0]?.price.unit_amount || 0,
            currency: subscription.currency,
          })
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        
        // Find and downgrade organization
        const { data: org } = await supabase
          .from("organizations")
          .select("id, subscription_tier")
          .eq("stripe_customer_id", subscription.customer)
          .single()
        
        if (!org) break
        
        await supabase
          .from("organizations")
          .update({
            subscription_tier: "free",
            subscription_status: "canceled",
            max_users: 5,
            stripe_subscription_id: null,
          })
          .eq("id", org.id)
        
        await supabase
          .from("subscription_history")
          .insert({
            organization_id: org.id,
            stripe_subscription_id: subscription.id,
            event_type: "subscription_canceled",
            previous_tier: org.subscription_tier,
            new_tier: "free",
            previous_status: "active",
            new_status: "canceled",
          })
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          const { data: org } = await supabase
            .from("organizations")
            .select("id")
            .eq("stripe_subscription_id", invoice.subscription)
            .single()
          
          if (org) {
            await supabase
              .from("organizations")
              .update({ subscription_status: "past_due" })
              .eq("id", org.id)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
