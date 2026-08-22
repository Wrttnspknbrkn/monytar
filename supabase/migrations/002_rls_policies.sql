-- Monytar Row Level Security Policies
-- Run after 001_initial_schema.sql
--
-- NOTE: The helper functions live in the `public` schema, NOT `auth`.
-- Supabase reserves the `auth` schema for the `supabase_auth_admin` role, so
-- `CREATE FUNCTION auth.*` fails with "42501: permission denied for schema auth".
--
-- This migration is idempotent and safe to re-run.

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_alerts ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER so they can read `users` without tripping the RLS policies
-- defined on `users` below (which would otherwise recurse infinitely).
-- `search_path` is pinned to prevent search-path hijacking, a real risk for
-- SECURITY DEFINER functions.

-- Helper function: get current user's org
CREATE OR REPLACE FUNCTION public.user_org_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid()
$$;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.user_org_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_role() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

-- Organizations: users can view their own org
DROP POLICY IF EXISTS "Users can view their org" ON organizations;
CREATE POLICY "Users can view their org" ON organizations FOR SELECT USING (id = public.user_org_id());

-- Organization Settings: users can view, admins can update
DROP POLICY IF EXISTS "Users can view org settings" ON organization_settings;
CREATE POLICY "Users can view org settings" ON organization_settings FOR SELECT USING (organization_id = public.user_org_id());
DROP POLICY IF EXISTS "Admins can update org settings" ON organization_settings;
CREATE POLICY "Admins can update org settings" ON organization_settings FOR UPDATE USING (organization_id = public.user_org_id() AND public.user_role() IN ('admin', 'finance'));

-- Users: org-scoped read, admin-only write
DROP POLICY IF EXISTS "Users can view org members" ON users;
CREATE POLICY "Users can view org members" ON users FOR SELECT USING (organization_id = public.user_org_id());
DROP POLICY IF EXISTS "Admins can manage users" ON users;
CREATE POLICY "Admins can manage users" ON users FOR ALL USING (organization_id = public.user_org_id() AND public.user_role() = 'admin');
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid());

-- Departments: org-scoped
DROP POLICY IF EXISTS "Users can view departments" ON departments;
CREATE POLICY "Users can view departments" ON departments FOR SELECT USING (organization_id = public.user_org_id());
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
CREATE POLICY "Admins can manage departments" ON departments FOR ALL USING (organization_id = public.user_org_id() AND public.user_role() IN ('admin', 'finance'));

-- Vendors: org-scoped
DROP POLICY IF EXISTS "Users can view vendors" ON vendors;
CREATE POLICY "Users can view vendors" ON vendors FOR SELECT USING (organization_id = public.user_org_id());
DROP POLICY IF EXISTS "Users can create vendors" ON vendors;
CREATE POLICY "Users can create vendors" ON vendors FOR INSERT WITH CHECK (organization_id = public.user_org_id());
DROP POLICY IF EXISTS "Finance/admin can manage vendors" ON vendors;
CREATE POLICY "Finance/admin can manage vendors" ON vendors FOR UPDATE USING (organization_id = public.user_org_id() AND public.user_role() IN ('admin', 'finance', 'manager'));

-- Expense Requests: users see own, managers see department, admin/finance see all
DROP POLICY IF EXISTS "Employees see own requests" ON expense_requests;
CREATE POLICY "Employees see own requests" ON expense_requests FOR SELECT USING (
  organization_id = public.user_org_id() AND (
    employee_id = auth.uid() OR
    public.user_role() IN ('admin', 'finance') OR
    (public.user_role() = 'manager' AND department_id IN (
      SELECT department_id FROM users WHERE id = auth.uid()
    ))
  )
);
DROP POLICY IF EXISTS "Users can create requests" ON expense_requests;
CREATE POLICY "Users can create requests" ON expense_requests FOR INSERT WITH CHECK (organization_id = public.user_org_id() AND employee_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own drafts" ON expense_requests;
CREATE POLICY "Users can update own drafts" ON expense_requests FOR UPDATE USING (
  organization_id = public.user_org_id() AND (
    (employee_id = auth.uid() AND status = 'draft') OR
    public.user_role() IN ('admin', 'finance', 'manager')
  )
);

-- Receipts: linked through expense requests (RLS on expense_requests applies
-- to this subquery, so it is implicitly org- and role-scoped)
DROP POLICY IF EXISTS "Users can view receipts" ON receipts;
CREATE POLICY "Users can view receipts" ON receipts FOR SELECT USING (
  expense_request_id IN (SELECT id FROM expense_requests)
);
DROP POLICY IF EXISTS "Users can upload receipts" ON receipts;
CREATE POLICY "Users can upload receipts" ON receipts FOR INSERT WITH CHECK (
  expense_request_id IN (SELECT id FROM expense_requests WHERE employee_id = auth.uid())
);

-- Approval Workflows
DROP POLICY IF EXISTS "Users can view workflows" ON approval_workflows;
CREATE POLICY "Users can view workflows" ON approval_workflows FOR SELECT USING (
  expense_request_id IN (SELECT id FROM expense_requests)
);

-- Notifications: users see only their own
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Activity Logs: org-scoped, admin/finance only
DROP POLICY IF EXISTS "Admin/finance view logs" ON activity_logs;
CREATE POLICY "Admin/finance view logs" ON activity_logs FOR SELECT USING (
  organization_id = public.user_org_id() AND public.user_role() IN ('admin', 'finance')
);

-- Budget Alerts: org-scoped
DROP POLICY IF EXISTS "Users can view budget alerts" ON budget_alerts;
CREATE POLICY "Users can view budget alerts" ON budget_alerts FOR SELECT USING (organization_id = public.user_org_id());
