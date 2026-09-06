-- Monytar — Security hardening pass
-- Safe to run repeatedly (idempotent).

-- ---------------------------------------------------------------------------
-- 1. CRITICAL: privilege escalation via the "Users can update own profile"
--    policy. That policy (002_rls_policies.sql) only checks `id = auth.uid()`
--    with no WITH CHECK, so any authenticated user — any role — can PATCH
--    their own `users` row directly via the Supabase REST API (the browser
--    already holds the anon key + the user's own session) and set
--    role = 'admin', or move themselves into a different organization_id and
--    self-promote there. This is a full tenant-takeover path that bypasses
--    the entire invitation/admin model, since every RLS policy in this
--    project trusts public.user_role()/public.user_org_id(), which just read
--    this same row back.
--
--    Fix: a BEFORE UPDATE trigger that freezes role/organization_id/is_active
--    on self-updates unless the actor is already an admin (or the write is
--    coming from a service-role/admin-client context, where auth.uid() is
--    NULL — those routes already do their own authorization in app code).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_self_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- service_role / admin-client writes (auth.uid() is NULL in that context)
  -- and org admins acting on a row (their own or someone else's, via the
  -- separate "Admins can manage users" policy) are exempt.
  IF auth.uid() IS NULL OR public.user_role() = 'admin' THEN
    RETURN NEW;
  END IF;

  NEW.role := OLD.role;
  NEW.organization_id := OLD.organization_id;
  NEW.is_active := OLD.is_active;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_self_update_restrictions ON users;
CREATE TRIGGER enforce_self_update_restrictions
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_privilege_escalation();

-- ---------------------------------------------------------------------------
-- 2. HIGH: check_subscription_feature() (003_subscription_columns.sql) is
--    SECURITY DEFINER with no pinned search_path — a schema-hijacking risk
--    (an attacker with CREATE on some schema earlier in the resolved path
--    could shadow an object it references) and it's callable by `anon` via
--    the broad routine grants in 011_fix_table_grants.sql. Re-declare with a
--    pinned search_path, matching the pattern already used for
--    user_org_id()/user_role() in 002_rls_policies.sql.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_subscription_feature(org_id UUID, feature_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  org_tier TEXT;
  org_features JSONB;
BEGIN
  SELECT subscription_tier, enterprise_features INTO org_tier, org_features
  FROM organizations WHERE id = org_id;

  IF org_tier = 'enterprise' THEN
    RETURN TRUE;
  END IF;

  CASE feature_name
    WHEN 'api_access' THEN
      RETURN org_tier IN ('business', 'enterprise');
    WHEN 'sso' THEN
      RETURN org_tier IN ('business', 'enterprise');
    WHEN 'custom_workflows' THEN
      RETURN org_tier IN ('professional', 'business', 'enterprise');
    WHEN 'advanced_reporting' THEN
      RETURN org_tier IN ('professional', 'business', 'enterprise');
    WHEN 'multi_currency' THEN
      RETURN org_tier IN ('professional', 'business', 'enterprise');
    WHEN 'vendor_management' THEN
      RETURN org_tier IN ('professional', 'business', 'enterprise');
    ELSE
      RETURN TRUE;
  END CASE;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Functional bugs from missing INSERT policies (RLS enabled, no policy =
--    silently denied, not a security hole, but it means these features have
--    never actually worked): in-app notifications and budget alerts are
--    created via the acting user's own RLS-scoped client (lib/notifications/
--    service.ts, app/api/requests/[id]/approve/route.ts), which has never had
--    permission to write to either table.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create org notifications" ON notifications;
CREATE POLICY "Users can create org notifications" ON notifications FOR INSERT WITH CHECK (
  organization_id = (SELECT public.user_org_id())
);

DROP POLICY IF EXISTS "Admin/finance/manager can create budget alerts" ON budget_alerts;
CREATE POLICY "Admin/finance/manager can create budget alerts" ON budget_alerts FOR INSERT WITH CHECK (
  organization_id = (SELECT public.user_org_id()) AND (SELECT public.user_role()) IN ('admin', 'finance', 'manager')
);

-- ---------------------------------------------------------------------------
-- 4. Functional bug: an employee resubmitting their own rejected request
--    (app/(dashboard)/requests/[id]/page.tsx handleResubmit, status
--    'rejected' -> 'pending') goes through the same RLS-scoped update path as
--    editing a draft, but the "Users can update own drafts" policy only
--    allows status = 'draft' — so resubmission has always been silently
--    blocked by RLS for plain employees. Allow the self-update branch to
--    also target a 'rejected' row; the actual target status is still decided
--    by application code (handleResubmit only ever sets 'pending').
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own drafts" ON expense_requests;
CREATE POLICY "Users can update own drafts" ON expense_requests FOR UPDATE USING (
  organization_id = (SELECT public.user_org_id()) AND (
    (employee_id = (SELECT auth.uid()) AND status IN ('draft', 'rejected')) OR
    (SELECT public.user_role()) IN ('admin', 'finance', 'manager')
  )
);
