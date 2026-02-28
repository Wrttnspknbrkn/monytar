import { NextResponse, type NextRequest } from "next/server"
import { isStripeConfigured } from "@/lib/stripe/config"

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 501 })
  }

  const { stripe } = await import("@/lib/stripe/server")
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object
        // TODO: Update user's subscription in Supabase
        // - session.customer_email
        // - session.subscription (Stripe subscription ID)
        // - session.metadata (any custom metadata you passed)
        console.log("Checkout completed:", session.id, session.customer_email)
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object
        // TODO: Update subscription status in Supabase
        console.log("Subscription updated:", subscription.id, subscription.status)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object
        // TODO: Downgrade user in Supabase
        console.log("Subscription cancelled:", subscription.id)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object
        // TODO: Notify user of failed payment
        console.log("Payment failed for invoice:", invoice.id)
        break
      }

      default:
        // Unhandled event type - that's fine
        break
    }
  } catch (err) {
    console.error("Error processing webhook event:", err)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
