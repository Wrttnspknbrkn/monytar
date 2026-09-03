-- Monytar — Allow managers to manage departments, matching app intent
--
-- The "Admins can manage departments" RLS policy only allowed
-- admin/finance, but the application's own permission model already
-- treats managers as allowed to manage departments:
--   - app/(dashboard)/departments/page.tsx: canEdit includes "manager"
--   - components/layout/sidebar.tsx: the Departments nav item is shown for
--     roles ["manager", "finance", "admin"]
-- The mismatch meant every department create/update from a manager
-- silently failed with 42501 "new row violates row-level security policy",
-- while the UI offered no indication the action was disallowed.
--
-- Safe to run repeatedly.

DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
CREATE POLICY "Admins can manage departments" ON departments
  FOR ALL USING (organization_id = public.user_org_id() AND public.user_role() IN ('admin', 'finance', 'manager'));
