-- Monytar — real, org-scoped expense categories.
--
-- Audit finding (P1-7): "Custom categories" was marketed as a Starter-plan
-- feature but categories were a hardcoded 6-value CHECK constraint with no
-- admin UI anywhere — a fully aspirational claim. This adds a real table:
-- organization_id IS NULL rows are the 6 system defaults (visible to every
-- org), organization_id = <org> rows are that org's custom additions.
--
-- expense_requests.category stays a plain TEXT column (not migrated to a
-- foreign key) to avoid rewriting every existing row — validity is enforced
-- at the API layer (app/api/categories, app/api/requests) against this
-- table instead of a hardcoded CHECK. System defaults are seeded with the
-- exact same lowercase slugs the CHECK constraint used to enforce
-- ('travel', 'meals', ...), so existing expense_requests rows keep matching
-- and lib/utils.ts's getCategoryLabel() lookup keeps working unchanged.
--
-- Safe to run repeatedly.

CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One name per org (case-insensitive). System-default rows (organization_id
-- IS NULL) are excluded — they're seeded once below, not user-created.
CREATE UNIQUE INDEX IF NOT EXISTS idx_expense_categories_org_name
  ON expense_categories (organization_id, lower(name))
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_expense_categories_org ON expense_categories(organization_id);

-- Drop the old hardcoded CHECK — validity now lives in the app layer against
-- this table (system defaults ∪ the org's own custom categories).
ALTER TABLE expense_requests DROP CONSTRAINT IF EXISTS expense_requests_category_check;

-- Seed the 6 system defaults exactly once (matches the old CHECK constraint's
-- values and lib/utils.ts's getCategoryLabel()).
INSERT INTO expense_categories (organization_id, name, is_active)
SELECT NULL, v.name, true
FROM (VALUES ('travel'), ('meals'), ('supplies'), ('software'), ('equipment'), ('other')) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM expense_categories WHERE organization_id IS NULL AND name = v.name
);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

-- Every org member can see the system defaults plus their own org's custom
-- categories (mirrors the departments/vendors SELECT policy pattern).
DROP POLICY IF EXISTS "Users can view expense categories" ON expense_categories;
CREATE POLICY "Users can view expense categories" ON expense_categories
  FOR SELECT USING (organization_id IS NULL OR organization_id = public.user_org_id());

-- Only admin/finance can add or manage their own org's custom categories.
-- Nobody (not even service-role via a normal policy) can touch the
-- organization_id IS NULL system-default rows through this policy.
DROP POLICY IF EXISTS "Admins can manage org expense categories" ON expense_categories;
CREATE POLICY "Admins can manage org expense categories" ON expense_categories
  FOR ALL USING (organization_id = public.user_org_id() AND public.user_role() IN ('admin', 'finance'))
  WITH CHECK (organization_id = public.user_org_id() AND public.user_role() IN ('admin', 'finance'));
