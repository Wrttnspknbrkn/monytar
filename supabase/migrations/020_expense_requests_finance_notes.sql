-- Monytar — add the missing finance_notes column.
--
-- lib/types.ts's ExpenseRequest interface and the New Request form
-- (app/(dashboard)/requests/new/page.tsx) have always included an
-- "Additional Notes" field mapped to finance_notes, but no migration ever
-- created the column. Confirmed live: inserting a row with finance_notes set
-- fails with PGRST204 "Could not find the 'finance_notes' column" — any user
-- who types into that field cannot submit their request at all.
ALTER TABLE expense_requests
ADD COLUMN IF NOT EXISTS finance_notes TEXT;
