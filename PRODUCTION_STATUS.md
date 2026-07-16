# Monytar — Production Readiness Status

_Last updated: Phase 2 complete_

This document tracks progress toward a 100% production-complete product, based on the
17-section audit and the phased plan in `v0_plans/calm-spec.md`.

---

## Overall Progress

| Milestone | Status |
|-----------|--------|
| Core product (schema, RLS, roles, dashboard, demo, billing model) | Complete (pre-existing) |
| Automated test foundation (86 unit + integration tests) | Complete |
| **Phase 1 — Security & Authorization hardening** | **Complete** |
| **Phase 2 — Billing integrity** | **Complete** |
| Phase 3 — Receipts & storage | Not started |
| Phase 4 — Approval engine & expense logic | Not started |
| Phase 5 — Reporting, exports & notifications | Not started |
| Phase 6 — DevOps & observability | Not started |
| Phase 7 — E2E tests & marketing reconciliation | Partially (7.1/7.2 done) |

**Estimated completion: ~40% of the remaining hardening plan done (2 of 7 phases).**

---

## What Has Been Done

### Foundation (already in place before this effort)
- Multi-tenant Postgres schema with Row Level Security.
- Organization-based billing data model.
- Role-aware dashboard (employee / manager / finance / admin) with demo mode + lead capture.
- Signature-verified Stripe webhook; session-derived signup.
- 79 → 86 passing automated tests (Vitest: unit + API integration).

### Phase 1 — Security & Authorization hardening (DONE)
- Added shared `lib/api/authorize.ts` role/tenant guard helper.
- `approve` / `reject` now require manager/finance/admin **and** scope managers to their own department.
- `mark-paid` restricted to finance/admin. All three enforce `organization_id` and return 403 on non-entitlement.
- Rewrote `accept-invitation` to be fully server-authoritative (identity from the trusted invitation record, server-created auth account, expiry + rollback). Removed client-supplied `userId`.
- Added `/forgot-password` and `/reset-password` pages + rate-limited `/api/auth/reset-password` (enumeration-safe).
- Built `lib/api/rate-limit.ts` on Upstash Redis (sliding window + in-memory fallback); applied to signup, login, invitation create/accept, and password reset.

### Phase 2 — Billing integrity (DONE)
- **Fixed the tier-mapping bug:** `getSubscriptionTier` previously returned `"business"`, which violates the DB CHECK constraint and silently broke persistence. Replaced with `resolveSubscriptionTier` (metadata-first via `product_id`, price fallback) — always a DB-valid tier.
- Fixed cancel-downgrade to `"free"` (was `"starter"`).
- Added Stripe webhook **idempotency** via a `stripe_webhook_events` table (migration `007`), with rollback-on-error so retries reprocess correctly.
- Made **seat limits tier-authoritative** in both invitation creation and acceptance (derived from `getTierLimits`, not a stale `max_users` column).
- Added a session-authoritative `openBillingPortal` server action (resolves the customer id from the logged-in user's org — never trusts the client) and wired a **Manage Billing** button into Settings for admins/finance.
- Added 7 regression tests locking in "never emit an invalid tier."

---

## What Remains

### Phase 3 — Receipts & Storage
- Private storage bucket for receipts with per-tenant RLS/path scoping.
- Upload/download/delete flow wired into request create + detail views.
- Vendor-total aggregation triggers; race-safe request-number generation.

### Phase 4 — Approval Engine & Expense Logic
- Multi-level approval chains and auto-approval under threshold.
- Department/category budget enforcement.
- Multi-currency handling on requests (currently display-only).

### Phase 5 — Reporting, Exports & Notifications
- CSV export endpoints (advertised but missing) + accounting export (QuickBooks/Xero).
- Real aggregation queries (by category/department/vendor/time) with custom date ranges.
- Email delivery (Resend) for notifications; per-user preferences and digests.

### Phase 6 — DevOps & Observability
- Sentry error tracking + structured logging.
- Versioned migration runner + rollback strategy.
- Performance: indexes, read caching/SWR revalidation, connection pooling.
- CI pipeline (lint, typecheck, build, test gates).

### Phase 7 — E2E & Reconciliation
- 7.1 Unit tests — **done**.
- 7.2 API integration tests — **done**.
- 7.3 Playwright E2E for full employee/manager/finance/admin journeys + mobile.
- Reconcile all marketing claims with actual features (trials, exports, custom categories/roles).

---

## Reasonable Timeline

Assuming continued phase-by-phase execution (one focused phase per working session,
with tests + build verification each time):

| Phase | Scope | Estimated effort |
|-------|-------|-----------------|
| Phase 3 — Receipts & storage | 1 integration (Blob/Supabase storage) + triggers | 2–3 days |
| Phase 4 — Approval engine | Schema + logic + UI | 3–5 days |
| Phase 5 — Reporting/exports/notifications | Aggregations + Resend + export formats | 4–6 days |
| Phase 6 — DevOps & observability | Sentry, CI, indexes, pooling | 2–3 days |
| Phase 7.3 — E2E + reconciliation | Playwright suite + copy audit | 2–3 days |

**Total to 100% production-complete: approximately 3–4 weeks of focused engineering.**

External dependencies to connect when their phase begins:
- **Resend** (email delivery) — Phase 5.
- **Sentry** (error tracking) — Phase 6.
- **Blob or Supabase Storage** (receipts) — Phase 3.
