-- Monytar — track billing interval; realign tier seat limits with the
-- current pricing (Free 3, Starter 10, Professional 50, Enterprise unlimited).
--
-- Bug fixed: Settings (app/(dashboard)/settings/page.tsx) had no way to know
-- whether an organization's subscription was monthly or yearly — nothing
-- persisted that, so it always displayed/matched against the "-monthly"
-- product row regardless of the org's real billing interval. This adds the
-- missing column; the webhook handler (app/api/webhooks/stripe/route.ts) and
-- the in-place plan-change action (createSubscriptionUpdateSession in
-- app/actions/stripe.ts) now populate it from the Stripe subscription/price.
--
-- Safe to run repeatedly.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'month'
    CHECK (billing_interval IN ('month', 'year'));

COMMENT ON COLUMN organizations.billing_interval IS
  'Billing interval of the active Stripe subscription (month/year). Written only by the webhook / service-role checkout flows — see prevent_org_billing_tampering().';

-- Freeze the new column the same way every other billing column is frozen
-- (migration 019): an org admin can view it but never write it via a direct
-- REST PATCH — only the Stripe webhook / server-role checkout flows may.
CREATE OR REPLACE FUNCTION public.prevent_org_billing_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.subscription_tier := OLD.subscription_tier;
  NEW.subscription_status := OLD.subscription_status;
  NEW.max_users := OLD.max_users;
  NEW.billing_interval := OLD.billing_interval;
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

-- Realign the seat-limit-on-tier-change trigger (004_organization_billing.sql)
-- with current pricing. Deliberately NOT backfilling every existing org's
-- max_users retroactively — this only takes effect the next time an org's
-- subscription_tier actually changes (new signup, upgrade, downgrade), so no
-- existing customer has their current seat allowance silently cut. If you
-- want existing orgs moved onto the new numbers immediately, run the
-- commented UPDATE at the bottom of this file deliberately.
CREATE OR REPLACE FUNCTION update_max_users_on_tier_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_tier != OLD.subscription_tier THEN
    NEW.max_users := CASE NEW.subscription_tier
      WHEN 'free' THEN 3
      WHEN 'starter' THEN 10
      WHEN 'professional' THEN 50
      WHEN 'enterprise' THEN 999999
      ELSE 3
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- To retroactively move EVERY existing organization onto the new seat caps
-- (only do this deliberately — it can shrink an active org's allowance below
-- its current active user count):
-- UPDATE organizations
-- SET max_users = CASE subscription_tier
--   WHEN 'free' THEN 3
--   WHEN 'starter' THEN 10
--   WHEN 'professional' THEN 50
--   WHEN 'enterprise' THEN 999999
--   ELSE 3
-- END;
