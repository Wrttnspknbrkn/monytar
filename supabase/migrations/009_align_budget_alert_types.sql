-- Phase 5: align budget_alerts.alert_type with the application AlertType.
--
-- The app type (lib/types.ts) is: 'low_budget' | 'approaching_limit' | 'over_budget',
-- and lib/budgets/calc.ts::budgetLevelToAlertType emits 'approaching_limit' / 'over_budget'.
-- The original schema CHECK allowed 'warning' | 'critical' | 'exceeded', which the
-- server would violate on insert. This migration reconciles the two.

-- Drop the old CHECK constraint (name is auto-generated; drop defensively).
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'budget_alerts'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%alert_type%';
  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE budget_alerts DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

-- Migrate any legacy values to the new vocabulary.
UPDATE budget_alerts SET alert_type = 'approaching_limit' WHERE alert_type IN ('warning', 'critical');
UPDATE budget_alerts SET alert_type = 'over_budget' WHERE alert_type = 'exceeded';

-- Re-add the CHECK with the application-aligned values.
ALTER TABLE budget_alerts
  ADD CONSTRAINT budget_alerts_alert_type_check
  CHECK (alert_type IN ('low_budget', 'approaching_limit', 'over_budget'));
