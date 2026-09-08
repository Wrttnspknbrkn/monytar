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

**Categories are a fixed, hardcoded enum** (`travel`, `meals`, `supplies`, `software`, `equipment`, `other`) baked into a Postgres `CHECK` constraint — not an organization-configurable table, despite "Custom categories" being advertised as a paid-plan feature in the marketing/pricing copy (`lib/products.ts`). This is a documented gap, not yet a real feature (see audit).

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

**Current state**: two disconnected pieces exist.
1. `app/signup/page.tsx` — the *actual* production signup flow: account details → organization name → **plan selection** (Free/Starter/Professional) → creates the org via `/api/auth/signup` → free tier lands on `/dashboard` immediately; paid tiers redirect to Stripe Checkout, return to `/dashboard` on success.
2. `app/onboarding/page.tsx` — a fully-built, polished 2-step wizard (workspace details + team invites) that **nothing in the app links to**, and whose submit handlers do not call any real API — they show a success toast and navigate to `/dashboard` regardless of what was entered. This is dead, decorative code today.

**Product decision** (documented per Rule 8, since this needed a call): rather than maintaining two competing onboarding surfaces, the sensible path is to fold onboarding into the *first-run dashboard experience* — a dismissible, resumable checklist (departments created, first vendor added, first teammate invited, first request submitted) rather than a second pre-dashboard wizard that duplicates signup. `app/onboarding/page.tsx` should either be wired to real actions and repositioned as a genuinely optional post-signup step, or removed in favor of the checklist. See audit for the concrete recommendation.

## 6. Known, documented gaps (not hidden, not yet built)

- **Multi-currency conversion**: marketing copy claims "employees submit in local currency, finance sees your base currency" — no FX conversion is wired to expense creation (every request is created with `currency: "USD"` by default, no currency picker in the New Request form). `lib/currency/index.ts` has a real `convertCurrency()` with a static reference-rate table, ready to be used, but nothing calls it yet. Documented as a future feature requiring an actual FX-rate provider decision, not something to fake.
- **Google OAuth**: "Continue with Google" is a non-functional UI placeholder — no `signInWithOAuth` call exists anywhere.
- **Organization branding/logo**: `organizations.logo_url` exists in the schema and type, but there is no upload UI or API endpoint anywhere.
- **Custom categories**: hardcoded enum, no admin UI, despite being marketed.
