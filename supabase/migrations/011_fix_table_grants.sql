-- Monytar — Fix missing table-level grants on public schema
--
-- Root cause of "failed to create organization" during signup (and any other
-- silent PostgREST 403s across the app): the `anon`, `authenticated`, and
-- `service_role` Postgres roles were missing basic GRANT privileges (SELECT/
-- INSERT/UPDATE/DELETE) on public schema tables. This is a table-privilege
-- error (Postgres code 42501, "permission denied for table ..."), raised
-- BEFORE Postgres ever evaluates Row Level Security — so RLS policies were
-- never the problem. Confirmed live against the project via PostgREST:
--   GET  /rest/v1/organizations           -> 403 42501 (service_role, anon)
--   POST /rest/v1/organizations           -> 403 42501 (service_role)
-- with hint: "Grant the required privileges to the current role with:
-- GRANT SELECT, INSERT ON public.organizations TO service_role;"
--
-- Supabase normally sets these grants automatically when tables are created
-- through its dashboard/SQL editor; this project's tables were missing them
-- (likely created via a direct `psql`/CI connection that bypassed Supabase's
-- default-privilege setup). RLS (see 002_rls_policies.sql) still fully
-- restricts row-level access for anon/authenticated — these grants only
-- restore the table-level access that RLS depends on to even run.
--
-- Safe to run repeatedly.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Ensure future tables/sequences/functions get the same grants automatically.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
