-- Monytar — Fix "Users can view their own invitation by token" policy
--
-- 005_billing_rls_policies.sql defined this policy as:
--   email = (SELECT email FROM auth.users WHERE id = auth.uid())
-- The `authenticated` role has no SELECT grant on auth.users (Supabase
-- locks that schema down by design; only service_role can read it), so
-- this subquery fails with 42501 "permission denied for table users"
-- whenever Postgres evaluates it.
--
-- Since Postgres combines multiple SELECT/ALL policies on the same table
-- with OR, evaluating this one policy's expression throws even when a
-- different policy (e.g. "Admins can manage invitations") would have
-- independently allowed the row — so the failure surfaced on the admin's
-- own POST /api/invitations flow (the insert's `.select().single()`
-- read-back), not just on the invitation-acceptance path this policy was
-- actually meant to cover.
--
-- The fix: read the email from the JWT claims (auth.jwt()), which is
-- already available to `authenticated` without needing auth.users access.
--
-- Safe to run repeatedly.

DROP POLICY IF EXISTS "Users can view their own invitation by token" ON user_invitations;
CREATE POLICY "Users can view their own invitation by token" ON user_invitations
  FOR SELECT USING (
    email = (auth.jwt() ->> 'email')
    OR token = current_setting('app.invitation_token', true)
  );
