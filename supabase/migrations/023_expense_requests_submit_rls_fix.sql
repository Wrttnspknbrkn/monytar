-- Monytar — fix: an employee can never actually submit their own draft or
-- resubmit a rejected request (QA finding, 2026-09-14).
--
-- Migration 018's "Users can update own drafts" policy specified only a
-- USING clause. Postgres defaults an UPDATE policy's WITH CHECK to the same
-- expression as USING when none is given — so the row, AFTER the update,
-- was also required to satisfy `employee_id = auth.uid() AND status IN
-- ('draft', 'rejected')`. That's precisely the one thing /api/requests/[id]/
-- submit's whole job is to change (draft/rejected -> pending/approved), so
-- every self-service submit has been silently rejected by RLS with
-- "new row violates row-level security policy for table expense_requests"
-- since 018 shipped. Live-verified: this affects every real user, not just
-- QA fixtures — "Save as Draft" has been a one-way door the whole time.
--
-- Fix: add an explicit WITH CHECK that keeps the ownership/department
-- scoping but drops the old-status re-check on the resulting row. This is
-- safe to relax because the two routes that perform these self-service
-- writes already control which status values can result: the PATCH route's
-- zod schema excludes `status` from its field allowlist entirely (can't be
-- smuggled through an edit), and the submit route hardcodes its own two
-- legal outcomes (pending, or approved when under the auto-approve floor).
-- RLS still fully gates *which rows* are touchable (USING, unchanged) and
-- *whose* organization/department a write can land in (WITH CHECK).
--
-- Safe to run repeatedly.

DROP POLICY IF EXISTS "Users can update own drafts" ON expense_requests;
CREATE POLICY "Users can update own drafts" ON expense_requests FOR UPDATE USING (
  organization_id = (SELECT public.user_org_id()) AND (
    -- Self-service: which rows can you even attempt to touch? Only your
    -- own, and only while still a draft or rejected — can't touch a
    -- request that's already pending/approved/paid.
    (employee_id = (SELECT auth.uid()) AND status IN ('draft', 'rejected')) OR
    (
      -- Privileged roles act on requests that are NOT their own, and managers
      -- are still confined to their own department.
      (SELECT public.user_role()) IN ('admin', 'finance', 'manager')
      AND employee_id != (SELECT auth.uid())
      AND (
        (SELECT public.user_role()) != 'manager'
        OR department_id IN (SELECT department_id FROM users WHERE id = (SELECT auth.uid()))
      )
    )
  )
) WITH CHECK (
  organization_id = (SELECT public.user_org_id()) AND (
    -- Self-service: the resulting row must still be the caller's own — but
    -- unlike USING above, status is free to move away from draft/rejected
    -- here. That's the entire point of submit() advancing a draft into
    -- pending/approved, or a PATCH edit keeping it in draft/rejected.
    employee_id = (SELECT auth.uid()) OR
    (
      (SELECT public.user_role()) IN ('admin', 'finance', 'manager')
      AND employee_id != (SELECT auth.uid())
      AND (
        (SELECT public.user_role()) != 'manager'
        OR department_id IN (SELECT department_id FROM users WHERE id = (SELECT auth.uid()))
      )
    )
  )
);
