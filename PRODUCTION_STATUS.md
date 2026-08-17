# Monytar — Production Readiness Status

_Last updated: Phase 6 complete_

This document tracks progress toward a 100% production-complete product, based on the
17-section audit and the phased plan in `v0_plans/calm-spec.md`.

---

## Overall Progress

| Milestone | Status |
|-----------|--------|
| Core product (schema, RLS, roles, dashboard, demo, billing model) | Complete (pre-existing) |
| Automated test foundation (174 unit + integration tests) | Complete |
| **Phase 1 — Security & Authorization hardening** | **Complete** |
| **Phase 2 — Billing integrity** | **Complete** |
| **Phase 3 — Receipts & storage** | **Complete** |
| **Phase 4 — Approval engine & expense logic** | **Complete** |
| **Phase 5 — Reporting, exports & notifications** | **Complete** |
| **Phase 6 — DevOps & observability** | **Complete** |
| Phase 7 — E2E tests & marketing reconciliation | Partially (7.1/7.2 done) |

**Estimated completion: ~90% of the remaining hardening plan done (6 of 7 phases).**

> **Action required to activate Phase 3 in production:** apply migration
> `008_receipts_storage_vendor_totals.sql` to the Supabase project (creates the private
> `receipts` bucket, storage RLS, vendor-total trigger, and the race-safe request-number
> function). The code degrades gracefully until then; in demo mode receipts are validated
> and captured client-side only.
>
> **Phase 4 note:** the approval engine, budget math, and multi-currency modules are pure
> and active in both demo and connected mode. Auto-approve, receipt-required, and budget
> alerting are enforced server-side in the API routes; the `organization_settings` row
> drives thresholds (safe defaults apply when columns are absent).
>
> **Phase 5 notes:** (1) apply migration `009_align_budget_alert_types.sql` to align the
> `budget_alerts.alert_type` CHECK with the app's `AlertType` (`approaching_limit` /
> `over_budget`) — a cross-phase mismatch surfaced while wiring alerts. (2) Email delivery
> uses Resend via `fetch` and **gracefully no-ops** without `RESEND_API_KEY` (in-app
> notifications still fire). To enable email, set `RESEND_API_KEY`, `EMAIL_FROM`, and
> `NEXT_PUBLIC_APP_URL`.
>
> **Phase 6 notes:** (1) apply migration `010_query_performance.sql` for composite indexes
> and the RLS `(SELECT auth.uid())` optimization. (2) Error tracking is wired via a
> DSN-gated Sentry transport that **no-ops without `SENTRY_DSN`** — set it (and optionally
> `SENTRY_ENVIRONMENT`) to activate. (3) The requests list API now uses **keyset
> pagination** (`?cursor=&limit=`) and returns `{ data, nextCursor, limit }` — the old
> `page`/`total` offset shape is gone (it had no client consumers). (4) CI runs on push/PR
> via `.github/workflows/ci.yml` (lint + typecheck + test + build); operational runbook in
> `docs/OPERATIONS.md`.

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

### Phase 3 — Receipts & Storage (DONE)
- Added migration `008_receipts_storage_vendor_totals.sql`:
  - Reconciled the `receipts` table with the app `Receipt` type (`organization_id`, `uploaded_by`, `created_at` + backfill) and added tenant-scoped **RLS** (select/insert/delete).
  - Created a **private `receipts` storage bucket** (10 MB cap, image/PDF mime allowlist) with storage RLS that scopes every object to `<organization_id>/…` on the path prefix.
  - Added a **vendor-total trigger** (`sync_vendor_totals`) that keeps `total_spend`/`transaction_count` accurate as requests move in and out of the `paid` state.
  - Added a **race-safe, per-org request-number** function (`next_request_number`) backed by an atomic counter table — eliminates the `count+1` collision risk.
- Built the receipt storage layer:
  - `lib/receipts/shared.ts` — pure helpers (filename sanitization, org-scoped path builder, mime/size validation) shared by client, server, and tests.
  - `lib/receipts/storage.ts` — server signed **upload/read URL** generation + object deletion.
  - `lib/receipts/client.ts` — browser upload flow (signed URL → direct-to-storage → record row).
- Added API routes: `POST /api/receipts/upload-url` (org-verified signed target), `POST /api/receipts` (records a row, path-prefix defense-in-depth), `GET /api/receipts?request_id=` (lists with short-lived signed view URLs), `DELETE /api/receipts/[id]` (uploader or admin/finance).
- Replaced the fake "click to add receipt-N.pdf" control with a real `ReceiptUploader` (multi-file `<input type=file>`, client-side type/size validation, dedupe, previews) and a `RequestReceipts` viewer that fetches signed URLs via SWR in connected mode and falls back to the store in demo mode.
- Hardened `POST /api/requests` to use the race-safe RPC (with fallback) and stop inserting the non-column `receipt_urls`.
- Added 22 receipt tests (filename sanitization, path isolation, mime/size validation, upload/record schemas). **Suite now 108 passing.**

### Phase 4 — Approval Engine & Expense Logic (DONE)
- Built three pure, dependency-free business-logic modules (reused by demo store, server APIs, and tests):
  - `lib/approvals/engine.ts` — `shouldAutoApprove`, `isReceiptRequired`, `buildApprovalChain` (manager → finance ordering, finance stage forced above the approval threshold, guaranteed ≥1 stage), plus `getCurrentStage` / `applyDecision` / `canActOnStage` for advancing a chain (rejection skips downstream stages; immutably applied).
  - `lib/budgets/calc.ts` — `computeBudgetStatus` (warning/critical/exceeded levels), `budgetLevelToAlertType` (maps to the DB `alert_type` CHECK values), and `projectBudgetAfter` for pre-approval checks.
  - `lib/currency/index.ts` — 8 supported currencies, locale-aware `formatMoney` (correct minor units, e.g. JPY = 0 decimals), and deterministic `convertCurrency` via a USD reference table. `formatCurrency` in `lib/utils.ts` now delegates here.
- Server enforcement:
  - `POST /api/requests` loads `organization_settings` (`lib/approvals/settings.ts`, safe defaults) and **auto-approves** sub-threshold requests (sets `approved`/`approved_at` + audit comment, returns `auto_approved`).
  - `POST /api/requests/[id]/approve` recomputes department spend after approval and writes a **budget alert** (`approaching_limit` / `over_budget`) when a threshold is crossed — best-effort, never blocks the approval.
- UI:
  - New `ApprovalChain` component renders a vertical stage timeline (auto-approved / awaiting / upcoming / rejected states) on the request detail page.
  - Added a **revise & resubmit** flow for the owner of a rejected request.
  - Multi-currency formatting wired into request detail (amount + pay dialog) and the departments budget view, which now uses the shared `computeBudgetStatus` for consistent thresholds and shows an "Over budget" state.
- Added 35 tests across the three modules (auto-approve boundaries, receipt gating, chain build/advance/reject, authority checks, budget levels/mapping/projection, currency format/convert/fallback). **Suite now 143 passing.**

### Phase 5 — Reporting, Exports & Notifications (DONE)
- Built a pure reporting aggregation module `lib/reports/aggregate.ts`:
  - `computeTotals`, `spendByCategory`, `countByStatus`, `topVendors`, `spendByDepartment`, and `monthlyTrend` — all deterministic and unit-tested.
  - **Removed the fake `Math.random()` monthly trend** from the reports page; the chart now derives submitted/approved/paid series from real request dates.
- Built the export layer:
  - `lib/reports/export.ts` — `buildExpenseReport` produces a properly RFC-escaped **CSV** (per-request rows) and a self-contained **printable HTML report** (summary + breakdowns) with all dynamic content HTML-escaped.
  - `lib/reports/download.ts` — browser helpers (`downloadCSV`, `downloadHTMLReport` which opens a print window → Save as PDF).
  - Wired an **Export** dropdown (CSV / Print-PDF) into the reports page, replacing the previously non-functional "Export CSV" button.
- Built the notification service:
  - `lib/notifications/templates.ts` — pure, HTML-escaped email templates (`requestApprovedEmail`, `requestRejectedEmail`, `invitationEmail`) returning `{ subject, html, text }`.
  - `lib/notifications/email.ts` — Resend transport via `fetch`; **gracefully no-ops** (returns `{ sent: false }`) when `RESEND_API_KEY` is unset, so flows never break.
  - `lib/notifications/service.ts` — `notify()` writes the in-app `notifications` row **and** sends a best-effort email in one call.
  - Wired into `approve` (approval email), `reject` (rejection email with reason), and `invitations` (real invite email; response now reports `emailSent`).
- Added migration `009_align_budget_alert_types.sql` to fix the `budget_alerts.alert_type` CHECK mismatch found during wiring.
- Added 17 tests (aggregation math, CSV escaping/row integrity, HTML-report content + injection safety, email templates, no-op transport). **Suite now 160 passing.**

### Phase 6 — DevOps & Observability (DONE)
- Built the observability layer:
  - `lib/observability/logger.ts` — structured JSON logger with **automatic redaction** of sensitive keys (password, token, secret, authorization, api key, etc.) applied recursively to nested context.
  - `lib/observability/capture.ts` — `captureException` posts to Sentry via `fetch` (Sentry Store API) and **gracefully no-ops** without `SENTRY_DSN`; logs the error locally regardless.
  - `lib/api/errors.ts` — `serverError()` logs/captures the real error server-side and returns a **generic client message** with a correlation `errorId`.
- **Stopped leaking Postgres/internal `error.message` to clients** across every API route (requests list/create/[id], approve, reject, mark-paid, departments, vendors, receipts + upload-url + [id], auth/login). Login now returns a generic "Invalid email or password" to prevent account enumeration.
- Performance:
  - `lib/api/pagination.ts` — reusable **keyset (cursor) pagination** helpers (opaque base64 cursor, `limit+1` has-more detection, limit clamping).
  - Rewrote `GET /api/requests` to keyset pagination ordered by `(created_at, id)` DESC — **removed the `OFFSET` + `count: "exact"`** full-scan pattern.
  - Migration `010_query_performance.sql` — composite indexes matching hot query paths (`expense_requests` by org/status/created_at, employee, department, vendor-paid; `notifications` unread; `receipts`, `budget_alerts`, `audit_logs`) and wrapped RLS `auth.uid()` calls in `(SELECT …)` so Postgres evaluates them once per query (initplan) instead of per row.
- CI/ops:
  - `.github/workflows/ci.yml` — runs lint, typecheck, test, and build on push/PR (pnpm, frozen lockfile).
  - Added a `typecheck` script (`tsc --noEmit`).
  - `docs/OPERATIONS.md` — environment variables, migration order + rollback strategy, backup/PITR guidance, observability activation, and an incident runbook.
- Added 14 tests (redaction depth/secret coverage, capture no-op without DSN, safe-error shape + no message leak, cursor encode/decode round-trip, has-more detection, limit clamping). **Suite now 174 passing; typecheck clean.**

---

## What Remains

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
| Phase 7.3 — E2E + reconciliation | Playwright suite + copy audit | 2–3 days |

**Total to 100% production-complete: approximately 2–3 days of focused engineering remaining.**

External dependencies to connect when their phase begins:
- **Resend** (email delivery) — Phase 5: wired; set `RESEND_API_KEY` + `EMAIL_FROM` + `NEXT_PUBLIC_APP_URL` to activate.
- **Sentry** (error tracking) — Phase 6: wired; set `SENTRY_DSN` (+ optional `SENTRY_ENVIRONMENT`) to activate.
- **Supabase Storage** (receipts) — Phase 3: activated by applying migration `008`.

Migrations to apply (in order): `007` → `008` → `009` → `010`.
