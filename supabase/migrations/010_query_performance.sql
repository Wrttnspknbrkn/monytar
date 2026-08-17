-- Monytar — Phase 6: Query performance & RLS optimization
-- Safe to run repeatedly (idempotent). Run after 009.

-- 1. Composite indexes matching real query patterns
-- --------------------------------------------------------------------------
-- Keyset pagination on the requests list orders by (created_at, id) DESC and
-- filters by organization (via RLS) and optionally status. These composite
-- indexes let Postgres satisfy the ordering + filter from a single index scan.
CREATE INDEX IF NOT EXISTS idx_expense_requests_org_created
  ON expense_requests (organization_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_expense_requests_org_status_created
  ON expense_requests (organization_id, status, created_at DESC, id DESC);

-- Managers list requests for their department; finance/employees by employee.
CREATE INDEX IF NOT EXISTS idx_expense_requests_dept_status
  ON expense_requests (department_id, status);

CREATE INDEX IF NOT EXISTS idx_expense_requests_employee_created
  ON expense_requests (employee_id, created_at DESC);

-- Budget alerts are read per-org, newest first.
CREATE INDEX IF NOT EXISTS idx_budget_alerts_org_created
  ON budget_alerts (organization_id, created_at DESC);

-- Unread-notification lookups per user.
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

-- 2. RLS helper optimization: wrap auth.* calls in (SELECT …)
-- --------------------------------------------------------------------------
-- Wrapping a STABLE function call in a scalar subquery lets Postgres evaluate
-- it ONCE per statement (as an InitPlan) instead of once per row, a large win
-- on multi-row scans. Recreate the hot policies accordingly.

-- expense_requests SELECT
DROP POLICY IF EXISTS "Employees see own requests" ON expense_requests;
CREATE POLICY "Employees see own requests" ON expense_requests FOR SELECT USING (
  organization_id = (SELECT auth.user_org_id()) AND (
    employee_id = (SELECT auth.uid()) OR
    (SELECT auth.user_role()) IN ('admin', 'finance') OR
    ((SELECT auth.user_role()) = 'manager' AND department_id IN (
      SELECT department_id FROM users WHERE id = (SELECT auth.uid())
    ))
  )
);

-- expense_requests INSERT
DROP POLICY IF EXISTS "Users can create requests" ON expense_requests;
CREATE POLICY "Users can create requests" ON expense_requests FOR INSERT WITH CHECK (
  organization_id = (SELECT auth.user_org_id()) AND employee_id = (SELECT auth.uid())
);

-- expense_requests UPDATE
DROP POLICY IF EXISTS "Users can update own drafts" ON expense_requests;
CREATE POLICY "Users can update own drafts" ON expense_requests FOR UPDATE USING (
  organization_id = (SELECT auth.user_org_id()) AND (
    (employee_id = (SELECT auth.uid()) AND status = 'draft') OR
    (SELECT auth.user_role()) IN ('admin', 'finance', 'manager')
  )
);

-- notifications
DROP POLICY IF EXISTS "Users see own notifications" ON notifications;
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (
  user_id = (SELECT auth.uid())
);
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (
  user_id = (SELECT auth.uid())
);

-- budget_alerts
DROP POLICY IF EXISTS "Users can view budget alerts" ON budget_alerts;
CREATE POLICY "Users can view budget alerts" ON budget_alerts FOR SELECT USING (
  organization_id = (SELECT auth.user_org_id())
);

-- activity_logs
DROP POLICY IF EXISTS "Admin/finance view logs" ON activity_logs;
CREATE POLICY "Admin/finance view logs" ON activity_logs FOR SELECT USING (
  organization_id = (SELECT auth.user_org_id()) AND (SELECT auth.user_role()) IN ('admin', 'finance')
);
