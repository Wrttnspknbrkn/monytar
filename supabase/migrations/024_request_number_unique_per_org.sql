-- Monytar — request numbers are unique PER ORGANIZATION, not globally
--
-- next_request_number(org) (migration 008/014) hands out a separate sequence to
-- every organization, so each org's first request is REQ-<year>-00001, the
-- second REQ-<year>-00002, and so on. But 001_initial_schema.sql declared
--
--     request_number TEXT UNIQUE NOT NULL
--
-- i.e. unique across the entire table. As soon as a second organization
-- submitted a request whose number another organization already used, Postgres
-- rejected the insert:
--
--     duplicate key value violates unique constraint
--     "expense_requests_request_number_key"   (SQLSTATE 23505)
--
-- and the person's submission failed. Numbers only need to be unique inside
-- one organization (that is the scope users see and search in), so replace the
-- global constraint with a per-organization one.
--
-- The application also retries with a fresh number on a collision
-- (lib/requests/request-number.ts), so it works before and after this runs.
-- Safe to run repeatedly. Relaxing a uniqueness rule cannot fail on existing data.

ALTER TABLE expense_requests
  DROP CONSTRAINT IF EXISTS expense_requests_request_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS expense_requests_org_request_number_key
  ON expense_requests (organization_id, request_number);
