# Monytar — Product Case Study

This document describes what Monytar actually is today, derived from the live codebase (schema, RLS policies, API routes, and UI) rather than aspiration. It is the reference for future product/engineering decisions. Where the current implementation is ambiguous or incomplete, that is called out explicitly rather than papered over.

## 1. What this is

Monytar is a multi-tenant SaaS expense-management platform: each customer signs up as an **organization** (tenant), invites teammates, submits expense requests, routes them through configurable approval rules, and pays them out. Stack: Next.js 16 (App Router, Turbopack) + Supabase (Postgres, Auth, Storage) + Stripe (billing) + Resend (transactional email).

Tenant isolation is enforced primarily through Postgres Row-Level Security, gated by two `SECURITY DEFINER` helper functions (`public.user_org_id()`, `public.user_role()`) that resolve the caller's org/role from their own `users` row via `auth.uid()`. API routes layer additional server-side authorization on top (`lib/api/authorize.ts`) rather than relying on RLS alone — this defense-in-depth pattern is deliberate and should be preserved.

## 2. Roles

Defined in the `users.role` CHECK constraint and used consistently across RLS policies and API authorization:

| Role | Scope |
|---|---|
| `employee` | Submits their own expense requests; sees only their own requests plus org-wide read access to departments/vendors. |
| `manager` | Everything an employee can do, plus approve/reject requests **from their own department only**. Cannot manage users, vendors currency, or org settings. |
| `finance` | Approve/reject/mark-paid on any request org-wide; manage vendors and departments; change currency and approval-threshold settings; cannot manage users. |
| `admin` | Everything, plus invite/manage users, delete/manage departments, all finance powers, organization settings, billing. |

There is no "platform admin" / super-admin concept in the schema — `/api/demo-leads` (a genuinely platform-wide, cross-tenant table) is now gated by a separate `PLATFORM_ADMIN_EMAILS` env allowlist rather than any org role, since "org admin" and "platform operator" are different concerns that were previously conflated (see audit finding).

## 3. Core entities

```
organizations (tenant root)
  ├─ organization_settings (1:1 — currency, approval thresholds, fiscal year)
  ├─ users (role, department_id, is_active)
  ├─ departments (budget_amount, budget_period, manager_id)
  ├─ vendors (is_approved, approval_required)
  ├─ expense_requests (employee_id, department_id, vendor_id, amount, category, status)
  │    ├─ receipts (file_url, uploaded_at)
  │    └─ approval_workflows (ordered approval stages)
  ├─ user_invitations (token-based, 7-day expiry)
  ├─ notifications (per-user, in-app)
  ├─ budget_alerts (per-department, triggered on approval)
  └─ subscription_history / stripe_* columns (billing)
```

**Categories** start from 6 system defaults (`travel`, `meals`, `supplies`, `software`, `equipment`, `other`) seeded into `expense_categories` (organization_id IS NULL). Starter-and-up organizations can add their own via Settings → Organization → Expense Categories (admin/finance only), stored as `organization_id`-scoped rows in the same table. `expense_requests.category` remains plain TEXT rather than a foreign key, validated against `expense_categories` at the API layer instead of the old hardcoded CHECK constraint.

## 4. Expense lifecycle (state machine)

`expense_requests.status`: `draft → pending → approved | rejected → paid` (plus `cancelled`, reachable in the schema but not currently wired to any UI action — a documented gap).

```
draft ──(submit)──> pending ──(approve)──> approved ──(mark paid)──> paid
                        │
                        └──(reject)──> rejected ──(resubmit, employee only)──> pending
```

Rules enforced by `lib/approvals/engine.ts`:
- **Auto-approve**: amount strictly under `auto_approve_under_amount` skips the chain entirely (empty chain = auto-approved).
- **Chain composition**: manager stage (if `require_manager_approval`) precedes finance stage (if `require_finance_approval` OR amount ≥ `approval_threshold_amount`, which always forces a finance stage regardless of the toggle — large spend always gets a second set of eyes).
- **Receipt requirement**: enforced when `require_receipts` is on and amount ≥ `receipt_required_above_amount`.
- **No self-approval**: a manager/finance/admin can never approve or reject their own submitted request (`.neq("employee_id", userId)` guard, added this audit — previously only RLS-level org/department scoping existed with no such check).
- **Department scoping**: managers may only act on requests from their own department; finance/admin act org-wide.

All four org-level threshold fields (`auto_approve_under_amount`, `receipt_required_above_amount`, `approval_threshold_amount`, plus the three boolean toggles) are editable by admin/finance in Settings → Organization → Approval Workflow.

## 5. Onboarding — current state vs. intent

**Current state**: `app/signup/page.tsx` is the one production signup flow — account details → organization name → **plan selection** (Free/Starter/Professional) → creates the org via `/api/auth/signup` → sends a confirmation email (see §7) → free tier lands on `/dashboard` once confirmed; paid tiers redirect to Stripe Checkout, return to `/dashboard` on success. New organizations get a dismissible first-run checklist on the dashboard (`components/dashboard/getting-started-checklist.tsx`, admin-only): create a department, invite the team, add a vendor, submit a first request — tracked from real data, not a separate flow.

The formerly-dead `app/onboarding/page.tsx` — a polished 2-step wizard nothing in the app linked to, whose submit handlers didn't call any real API — has been removed. Per the case study's own recommendation, onboarding now lives entirely in the first-run dashboard experience instead of a second pre-dashboard wizard duplicating signup.

## 6. Known, documented gaps (not hidden, not yet built)

- **Multi-currency conversion**: marketing copy claims "employees submit in local currency, finance sees your base currency" — no FX conversion is wired to expense creation (every request is created with `currency: "USD"` by default, no currency picker in the New Request form). `lib/currency/index.ts` has a real `convertCurrency()` with a static reference-rate table, ready to be used, but nothing calls it yet. Documented as a future feature requiring an actual FX-rate provider decision, not something to fake.
- **Google OAuth**: "Continue with Google" is a non-functional UI placeholder — no `signInWithOAuth` call exists anywhere. Needs external config (a Google Cloud OAuth client + Supabase Auth provider setup) regardless of code.
