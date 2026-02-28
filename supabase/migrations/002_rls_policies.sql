-- SpendWell Row Level Security Policies
-- Run after 001_initial_schema.sql

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

-- Helper function: get current user's org
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Organizations: users can view their own org
CREATE POLICY "Users can view their org" ON organizations FOR SELECT USING (id = auth.user_org_id());

-- Organization Settings: users can view, admins can update
CREATE POLICY "Users can view org settings" ON organization_settings FOR SELECT USING (organization_id = auth.user_org_id());
CREATE POLICY "Admins can update org settings" ON organization_settings FOR UPDATE USING (organization_id = auth.user_org_id() AND auth.user_role() IN ('admin', 'finance'));

-- Users: org-scoped read, admin-only write
CREATE POLICY "Users can view org members" ON users FOR SELECT USING (organization_id = auth.user_org_id());
CREATE POLICY "Admins can manage users" ON users FOR ALL USING (organization_id = auth.user_org_id() AND auth.user_role() = 'admin');
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid());

-- Departments: org-scoped
CREATE POLICY "Users can view departments" ON departments FOR SELECT USING (organization_id = auth.user_org_id());
CREATE POLICY "Admins can manage departments" ON departments FOR ALL USING (organization_id = auth.user_org_id() AND auth.user_role() IN ('admin', 'finance'));

-- Vendors: org-scoped
CREATE POLICY "Users can view vendors" ON vendors FOR SELECT USING (organization_id = auth.user_org_id());
CREATE POLICY "Users can create vendors" ON vendors FOR INSERT WITH CHECK (organization_id = auth.user_org_id());
CREATE POLICY "Finance/admin can manage vendors" ON vendors FOR UPDATE USING (organization_id = auth.user_org_id() AND auth.user_role() IN ('admin', 'finance', 'manager'));

-- Expense Requests: users see own, managers see department, admin/finance see all
CREATE POLICY "Employees see own requests" ON expense_requests FOR SELECT USING (
  organization_id = auth.user_org_id() AND (
    employee_id = auth.uid() OR
    auth.user_role() IN ('admin', 'finance') OR
    (auth.user_role() = 'manager' AND department_id IN (
      SELECT department_id FROM users WHERE id = auth.uid()
    ))
  )
);
CREATE POLICY "Users can create requests" ON expense_requests FOR INSERT WITH CHECK (organization_id = auth.user_org_id() AND employee_id = auth.uid());
CREATE POLICY "Users can update own drafts" ON expense_requests FOR UPDATE USING (
  organization_id = auth.user_org_id() AND (
    (employee_id = auth.uid() AND status = 'draft') OR
    auth.user_role() IN ('admin', 'finance', 'manager')
  )
);

-- Receipts: linked through expense requests
CREATE POLICY "Users can view receipts" ON receipts FOR SELECT USING (
  expense_request_id IN (SELECT id FROM expense_requests)
);
CREATE POLICY "Users can upload receipts" ON receipts FOR INSERT WITH CHECK (
  expense_request_id IN (SELECT id FROM expense_requests WHERE employee_id = auth.uid())
);

-- Approval Workflows
CREATE POLICY "Users can view workflows" ON approval_workflows FOR SELECT USING (
  expense_request_id IN (SELECT id FROM expense_requests)
);

-- Notifications: users see only their own
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Activity Logs: org-scoped, admin/finance only
CREATE POLICY "Admin/finance view logs" ON activity_logs FOR SELECT USING (
  organization_id = auth.user_org_id() AND auth.user_role() IN ('admin', 'finance')
);

-- Budget Alerts: org-scoped
CREATE POLICY "Users can view budget alerts" ON budget_alerts FOR SELECT USING (organization_id = auth.user_org_id());
