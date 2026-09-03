-- lib/types.ts, lib/approvals/engine.ts, and lib/approvals/settings.ts have
-- always referenced organization_settings.approval_threshold_amount (the
-- amount above which a request gets a finance review even when
-- require_finance_approval is off), but the column was never actually added
-- to the table — loadApprovalSettings() silently fell back to a hardcoded
-- default instead. This makes the threshold a real, per-org, editable value.
ALTER TABLE organization_settings
ADD COLUMN IF NOT EXISTS approval_threshold_amount NUMERIC DEFAULT 1000;
