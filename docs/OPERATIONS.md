# Monytar — Operations & Observability Runbook

This document covers production observability, error tracking, backups/restore,
and the CI gates that protect `main`.

---

## 1. Observability

### Structured logging (`lib/observability/logger.ts`)
- All logs are emitted as **single-line JSON** (`level`, `message`, `timestamp`,
  `context`) so Vercel/Datadog/any log drain can parse and index them.
- Secrets are **redacted automatically**: any context key containing `password`,
  `token`, `secret`, `authorization`, `cookie`, `api_key`, `signature`, etc. is
  replaced with `[REDACTED]` (recursively, arrays included).
- Log level is controlled by `LOG_LEVEL` (`debug` | `info` | `warn` | `error`).
  Defaults to `info` in production, `debug` otherwise.

### Error tracking (`lib/observability/capture.ts`)
- `captureException(err, context)` logs the error in structured form **and**
  forwards it to Sentry when a DSN is configured.
- **Graceful no-op:** without `SENTRY_DSN` (or `NEXT_PUBLIC_SENTRY_DSN`) it only
  logs — it never throws and never blocks the request path.
- Forwarding uses `fetch` against the Sentry Store endpoint (no SDK dependency).

### Safe error responses (`lib/api/errors.ts`)
- `serverError(err, context)` captures the full error server-side and returns a
  **generic** `{ error: "Something went wrong. Please try again." }` with status
  500 — raw Postgres messages and stack traces never reach clients.
- `clientError(message, status)` is for intentional, safe client-facing messages.
- Every API route's DB-error and catch paths route through these helpers.

### Enabling Sentry
1. Create a Sentry project, copy its DSN.
2. Add `SENTRY_DSN` to the Vercel project environment variables.
3. Redeploy. Errors captured via `serverError`/`captureException` start flowing.

---

## 2. Backups & Restore (Supabase Postgres)

Supabase manages Postgres backups. Verify these settings per environment:

- **Daily backups** are enabled on all paid plans (retention varies by plan).
- **Point-in-Time Recovery (PITR)** — enable on the Pro plan or above for the
  production project (Dashboard → Database → Backups). PITR allows restoring to
  any second within the retention window.

### Tested restore procedure (run quarterly)
1. In the Supabase dashboard, create a **new project** (the restore target).
2. Restore the latest backup / a PITR timestamp into that target project.
3. Point a staging deployment at the restored project's connection string.
4. Smoke-test: sign in, list requests, approve one, verify RLS still scopes by org.
5. Record the restore date + duration in the team ops log, then tear down the target.

> Do **not** practice restores against the live production project.

---

## 3. Database performance

- Migration `010_query_performance.sql` adds composite indexes matching the real
  query patterns (org + created_at keyset, org + status, department + status,
  employee + created_at) and unread-notification / budget-alert indexes.
- The requests list API uses **keyset (cursor) pagination** rather than
  `OFFSET` + `count: "exact"`, so page cost stays flat as the table grows.
  Clients paginate with `?cursor=<token>&limit=<n>` and read `nextCursor` from
  the response (null when there are no more rows).
- RLS hot policies wrap `auth.*` helper calls in `(SELECT …)` so Postgres
  evaluates them once per statement (InitPlan) instead of once per row.

---

## 4. CI gates

> **One-time install:** the CI config ships as `docs/ci.yml` (not under
> `.github/workflows/`) because the v0 GitHub App cannot create workflow files
> without the `workflows` permission. To activate it, copy the template into
> place and commit it from a client that has workflow permission:
>
> ```bash
> mkdir -p .github/workflows
> cp docs/ci.yml .github/workflows/ci.yml
> git add .github/workflows/ci.yml && git commit -m "chore: enable CI workflow"
> ```

Once installed, every push to `main` and every PR runs, in order:

1. `pnpm lint` — Next.js/ESLint
2. `pnpm typecheck` — `tsc --noEmit`
3. `pnpm test` — Vitest unit + integration suite
4. `pnpm build` — production build (succeeds in demo mode without secrets)

Any failing step blocks the merge. Configure branch protection on `main` to
require the **CI / verify** check.

---

## 5. Environment variables reference

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client | Prod (demo fallback without) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin ops (signup, invites) | Prod |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Billing + webhook verification | Billing |
| `SENTRY_DSN` | Error tracking (no-op if unset) | Optional |
| `LOG_LEVEL` | Log verbosity | Optional |
| `RESEND_API_KEY` / `EMAIL_FROM` / `NEXT_PUBLIC_APP_URL` | Email delivery (no-op if unset) | Optional |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash rate limiting | Recommended |

## Search (SEO) and Google Search Console

- Canonical host is `https://www.monytar.com` (the bare domain redirects to it). `lib/seo.ts` builds every canonical URL from it; set `NEXT_PUBLIC_APP_URL=https://www.monytar.com` in production.
- `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` and the share picture (`/opengraph-image`) are generated by `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts` and `app/opengraph-image.tsx`. New public pages: add the path to `PAGES` in `app/sitemap.ts` and give the page `pageMetadata({...})` from `lib/seo.ts`. Blog posts are added to the sitemap automatically.
- Sign-in, sign-up, checkout and password pages are `noindex`; the signed-in app and API are disallowed in robots and send `X-Robots-Tag: noindex`. The shareable `/handbook` is `noindex` too.
- **Search Console:** add the property (Domain + DNS TXT record is easiest and needs no code; or set `GOOGLE_SITE_VERIFICATION` for the HTML-tag method), then submit `https://www.monytar.com/sitemap.xml`.

## End-to-end test (every create / read / update / delete)

`scripts/e2e-crud.mjs` checks the whole app against the **real** Supabase project in `.env.local`, then deletes everything it made.

1. Start the app on its own port with email, billing, rate limiting and error reporting **off**, so the test cannot send anything to anyone:

   ```bash
   RESEND_API_KEY= STRIPE_SECRET_KEY= STRIPE_WEBHOOK_SECRET= NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY= \
   KV_REST_API_URL= KV_REST_API_TOKEN= SENTRY_DSN= NEXT_PUBLIC_SENTRY_DSN= npx next dev -p 3300
   ```

2. In another terminal: `node scripts/e2e-crud.mjs` (set `E2E_UI=0` to skip the browser section; it needs Google Chrome).

What it does:

- Creates two throwaway organisations (`ZZ-E2E-…`, addresses on `@zz-e2e-….example.test`) with one user per role.
- Signs in as each user and tests vendors, departments, users and invitations, expense requests (create, edit, receipts, submit, approve, reject, pay, the two-step approval), notifications, settings, categories and the logo, both through the API and as the browser does it. It checks what each role **can** and **must not** do, including across organisations.
- Then drives the real screens in Chrome: adding vendors (with a note) as every role, adding a department, the free-plan limit, and an expense from submit to paid.
- Finally deletes every row, uploaded file and auth user it created and compares row counts with a snapshot taken at the start. The exit code is non-zero on any failure or leftover.

A **WARN** is something worth knowing that is not a failure (for example a database update that has not been applied yet).

### Database updates to apply

Run each file in `supabase/migrations/` in the Supabase SQL editor, in order. Recently added:

- `024_request_number_unique_per_org.sql`: request numbers are unique per organisation, not globally.
- `025_vendors_notes.sql`: adds `vendors.notes`. Until it is applied, a vendor can still be added with a note typed in (the vendor is saved, the note is not, and the person is told).
- `026_inactive_users_and_self_service.sql`: a deactivated user loses all access to organisation data straight away, and people can no longer move themselves between departments.
