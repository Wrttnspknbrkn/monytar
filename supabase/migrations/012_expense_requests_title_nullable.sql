-- Monytar — Drop the NOT NULL constraint on expense_requests.title
--
-- `title` was part of the original 001_initial_schema.sql before `purpose`
-- was added in 003_subscription_columns.sql as the field the application
-- actually uses. No application code ever sets or reads `title` on an
-- expense request (the TypeScript ExpenseRequest type doesn't even model
-- it), so every real insert has been failing with:
--   23502 null value in column "title" of relation "expense_requests"
--   violates not-null constraint
-- This went unnoticed because the client-side create-request flow was
-- separately broken (calling a demo-only stub that never reached the
-- database at all) until that was fixed alongside this migration.
--
-- Safe to run repeatedly.

ALTER TABLE expense_requests ALTER COLUMN title DROP NOT NULL;
