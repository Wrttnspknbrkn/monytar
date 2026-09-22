// The Stripe dashboard endpoint was originally registered as /api/webhook/stripe
// (singular). Stripe never follows redirects and does not retry a 404 into success,
// so keep this path working as an alias of the canonical /api/webhooks/stripe handler.
export { POST } from "../../webhooks/stripe/route"
