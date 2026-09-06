-- Monytar — Make next_request_number() actually callable, and lock down
-- its backing counter table
--
-- 008_receipts_storage_vendor_totals.sql added a race-safe
-- next_request_number(org UUID) function backed by request_number_counters,
-- specifically so concurrent submissions can never collide on
-- request_number. The application never called it though — it computes the
-- next number client-side from whatever expense_requests rows RLS lets the
-- current user see (e.g. an employee only sees their own requests), so two
-- different users can independently compute the same "next" number and
-- collide on the UNIQUE constraint. Confirmed live: an employee's very
-- first submission collided with a manager's REQ-2026-00001 because the
-- employee's client had no visibility into that row at all.
--
-- request_number_counters also never had RLS enabled, leaving it wide open
-- to any role with table grants. This migration:
--   1. Makes the function SECURITY DEFINER (pinned search_path) so it can
--      upsert the counter regardless of the caller's row-level access,
--      without needing to grant broad table access to end users.
--   2. Grants EXECUTE to authenticated/service_role so the app can call it.
--   3. Enables RLS on request_number_counters with no policies, so it's
--      only ever touched through this function, never directly.
--
-- Safe to run repeatedly.

ALTER TABLE request_number_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION next_request_number(org UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  yr INTEGER := EXTRACT(YEAR FROM NOW());
  seq INTEGER;
BEGIN
  INSERT INTO request_number_counters (organization_id, year, last_value)
    VALUES (org, yr, 1)
  ON CONFLICT (organization_id, year)
    DO UPDATE SET last_value = request_number_counters.last_value + 1
  RETURNING last_value INTO seq;

  RETURN 'REQ-' || yr || '-' || LPAD(seq::text, 5, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION next_request_number(UUID) TO authenticated, service_role;
