-- Monytar — CRITICAL: close a free-tier self-upgrade / billing-hijack hole.
--
-- Audit finding: "Admins can update organization" (005_billing_rls_policies.sql)
-- is FOR UPDATE USING (caller is an admin of this org) with no WITH CHECK and
-- no column restriction. Since Postgres reuses USING as the check when
-- WITH CHECK is omitted, any org admin can PATCH ANY column on their own
-- organizations row via the Supabase REST API directly — including
-- subscription_tier, subscription_status, max_users, and stripe_customer_id.
--
-- Live-verified exploit: an org admin set their own org to
-- {"subscription_tier":"enterprise","subscription_status":"active"} via a
-- plain authenticated REST PATCH — no Stripe payment, no webhook involved.
-- Worse: app/actions/stripe.ts openBillingPortal() opens a live Stripe
-- Billing Portal session for whatever stripe_customer_id is on the org row —
-- so an admin who sets that field to another real customer's Stripe ID could
-- open that customer's live billing portal from their own org's Settings page.
--
-- Fix: freeze every subscription/billing column on UPDATE unless the write
-- comes from a service-role context (Stripe webhook, admin signup route),
-- mirroring the users-table trigger in 017_security_hardening.sql. Regular
-- org fields (name, logo_url, currency, timezone, settings) remain editable
-- by admins as before.
--
-- Safe to run repeatedly.

CREATE OR REPLACE FUNCTION public.prevent_org_billing_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- service_role / admin-client writes (Stripe webhook, signup route) are
  -- exempt — auth.uid() is NULL in that context since there's no end-user JWT.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.subscription_tier := OLD.subscription_tier;
  NEW.subscription_status := OLD.subscription_status;
  NEW.max_users := OLD.max_users;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  NEW.enterprise_features := OLD.enterprise_features;
  NEW.subscription_started_at := OLD.subscription_started_at;
  NEW.subscription_ends_at := OLD.subscription_ends_at;
  NEW.current_period_start := OLD.current_period_start;
  NEW.current_period_end := OLD.current_period_end;
  NEW.cancel_at_period_end := OLD.cancel_at_period_end;
  NEW.trial_end := OLD.trial_end;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_org_billing_restrictions ON organizations;
CREATE TRIGGER enforce_org_billing_restrictions
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_org_billing_tampering();
