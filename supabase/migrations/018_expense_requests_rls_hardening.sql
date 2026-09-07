-- Monytar — close the expense_requests self-approval / department-scoping gap
-- at the RLS layer itself.
--
-- Audit finding: the app/api/requests/[id]/approve|reject|mark-paid routes
-- were hardened earlier (no self-approval, org+department scoping, .eq on
-- status) — but the actual UI never calls those routes. It calls plain
-- Supabase updates directly from the browser (lib/hooks/use-supabase-data.ts:
-- approveExpenseRequest, rejectExpenseRequest, markRequestAsPaid,
-- updateExpenseRequest), which only RLS gates. The "Users can update own
-- drafts" policy's privileged-role branch (admin/finance/manager) had no
-- self-approval guard and no department scoping of its own — meaning any
-- finance/admin/manager could open devtools and directly PATCH/approve/pay
-- their own request via the Supabase client, using their own legitimate
-- session. This was the real, live hole; the route-level fixes were
-- defense-in-depth for a path nobody was taking.
--
-- Safe to run repeatedly.

DROP POLICY IF EXISTS "Users can update own drafts" ON expense_requests;
CREATE POLICY "Users can update own drafts" ON expense_requests FOR UPDATE USING (
  organization_id = (SELECT public.user_org_id()) AND (
    -- Self-service: edit/resubmit your own draft or rejected request.
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
);
