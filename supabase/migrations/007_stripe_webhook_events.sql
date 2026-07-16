-- Idempotency ledger for Stripe webhook events.
-- Guarantees each event is processed at most once even if Stripe retries delivery.

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id TEXT PRIMARY KEY,               -- Stripe event id (evt_...)
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- This table is only ever written by the webhook using the service role key,
-- so it is not exposed to client sessions. Enable RLS with no policies to deny
-- all access via the anon/authenticated roles by default.
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;
