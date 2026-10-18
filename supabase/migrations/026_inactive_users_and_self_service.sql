-- Monytar — deactivated users, and what a person may change about themselves
-- Safe to run repeatedly (idempotent).
--
-- Found by the end-to-end test (scripts/e2e-crud.mjs):
--
-- 1. A deactivated user kept full access. The app signs them out in the browser, but their session still
--    worked against the API and the database, because the helper functions every row-level-security policy
--    relies on (user_org_id / user_role) never looked at is_active. Anyone who had been deactivated, and kept
--    their session, could still read and write their old organisation's data.
--
-- 2. An employee could move THEMSELVES to another department (department_id was not in the list of columns
--    frozen on self-updates by migration 017). A manager may only approve requests from their own department,
--    so that let a person choose who approves their spending. The same goes for manager_id and status.

-- ---------------------------------------------------------------------------
-- 1. Deactivated people have no organisation and no role, so every policy that
--    depends on those two functions denies them.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_org_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid() AND COALESCE(is_active, true)
$$;

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() AND COALESCE(is_active, true)
$$;

-- A deactivated person can still read their OWN profile, so the app can tell them "this account has been
-- deactivated" and sign them out, instead of showing an empty, confusing screen.
DROP POLICY IF EXISTS "Users can view own row" ON users;
CREATE POLICY "Users can view own row" ON users FOR SELECT USING (id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2. Freeze department, manager and status on self-updates (admins and the
--    service role are still exempt, exactly as in migration 017).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_self_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.user_role() = 'admin' THEN
    RETURN NEW;
  END IF;

  NEW.role := OLD.role;
  NEW.organization_id := OLD.organization_id;
  NEW.is_active := OLD.is_active;
  NEW.department_id := OLD.department_id;
  NEW.manager_id := OLD.manager_id;
  NEW.status := OLD.status;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_self_update_restrictions ON users;
CREATE TRIGGER enforce_self_update_restrictions
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_privilege_escalation();

NOTIFY pgrst, 'reload schema';
