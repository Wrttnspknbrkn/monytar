# Monytar — Run From Scratch (Self-Hosted Setup)

This guide runs the entire product from a clean checkout, with **every external
service provisioned and configured by you, directly with each provider** — not
through the v0 or Vercel integration marketplaces. You paste the resulting
credentials into a local `.env.local` (and into your host's env settings at
deploy time).

The app has two runtime modes:

- **Demo mode** — no Supabase env vars set. The app serves seeded mock data, the
  dashboard is reachable without login, and no external service is required.
  Great for a first look and for running the E2E suite.
- **Connected mode** — Supabase env vars set. Real auth, database, storage, and
  (optionally) Stripe, Resend, Sentry, and Upstash.

---

## 0. Prerequisites

- **Node.js 20+** and **pnpm 9+** (`corepack enable` then `corepack prepare pnpm@latest --activate`)
- Accounts you will create yourself, each outside v0/Vercel:
  - [Supabase](https://supabase.com) — database, auth, receipt storage (**required** for connected mode)
  - [Stripe](https://stripe.com) — billing (optional; billing UI degrades gracefully without it)
  - [Resend](https://resend.com) — transactional email (optional; email no-ops without it)
  - [Sentry](https://sentry.io) — error tracking (optional; capture no-ops without it)
  - [Upstash](https://upstash.com) — Redis for distributed rate limiting (optional; falls back to in-memory)

```bash
git clone <your-fork-url> monytar
cd monytar
pnpm install
```

---

## 1. Supabase (database, auth, storage) — required for connected mode

### 1.1 Create the project

1. Go to <https://supabase.com/dashboard> → **New project**. Choose a strong DB
   password and a region close to your users.
2. When it finishes provisioning, open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose to the client)

### 1.2 Apply the schema (migrations run in order)

The SQL lives in `supabase/migrations/`. Apply **all ten, in filename order**.
Easiest path is the SQL editor; the CLI path is below it.

**Option A — SQL editor (copy/paste):** open **SQL Editor** in the dashboard and
run each file's contents in sequence:

```
001_initial_schema.sql          -- tables + enums
002_rls_policies.sql            -- row-level security
003_subscription_columns.sql
004_organization_billing.sql
005_billing_rls_policies.sql
006_demo_leads.sql
007_stripe_webhook_events.sql   -- idempotent webhook ledger
008_receipts_storage_vendor_totals.sql  -- private "receipts" bucket + storage RLS + vendor totals
009_align_budget_alert_types.sql
010_query_performance.sql       -- composite indexes + RLS (SELECT) optimization
```

**Option B — Supabase CLI (recommended for repeatability):**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push        # applies everything in supabase/migrations in order
```

Migration `008` creates the private **`receipts`** storage bucket and its
path-prefixed RLS, so you do **not** create the bucket by hand. Verify under
**Storage** that a private bucket named `receipts` exists after running it.

### 1.3 Configure Auth

1. **Authentication → Providers → Email**: enable **Email/Password**. (This app
   uses email + password only; do not enable other providers unless you extend it.)
2. **Authentication → URL Configuration**:
   - **Site URL**: your app origin (e.g. `http://localhost:3000` for local, your
     domain in production).
   - **Redirect URLs**: add your local and production origins.
3. Decide whether to require email confirmation (**Authentication → Sign In / Up**).
   For a quick internal rollout you may disable confirmation; for public use, keep it on.

---

## 2. Stripe (billing) — optional

Skip this to run without billing (the pricing page still renders; checkout is
simply inert). To enable it:

1. In the [Stripe Dashboard](https://dashboard.stripe.com) create your
   **Products** and recurring **Prices** (one per plan tier). Copy each Price ID.
2. Map those Price IDs to the tiers in **`lib/products.ts`** so checkout charges
   the right plan.
3. **Developers → API keys**: copy
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`
4. **Developers → Webhooks → Add endpoint**:
   - URL: `https://<your-domain>/api/webhooks/stripe`
   - Events: at minimum `checkout.session.completed`,
     `customer.subscription.created|updated|deleted`,
     `invoice.paid`, `invoice.payment_failed`.
   - Copy the endpoint's **Signing secret** → `STRIPE_WEBHOOK_SECRET`.
   - For local testing use the Stripe CLI:
     `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
     and use the secret it prints.

Checkout is configured for a **14-day trial with no card up front**
(`trial_period_days: 14`, `payment_method_collection: "if_required"`), matching
the pricing page. The webhook ledger (migration `007`) makes event handling
idempotent.

---

## 3. Resend (email) — optional

Without this, in-app notifications still fire; email sending simply no-ops.

1. In [Resend](https://resend.com/domains), **verify your sending domain** (add
   the DNS records they provide).
2. **API Keys → Create** → copy to `RESEND_API_KEY`.
3. Set `EMAIL_FROM` to a verified sender, e.g. `Monytar <notifications@yourdomain.com>`.
4. Set `NEXT_PUBLIC_APP_URL` to your app origin so email links resolve correctly.

---

## 4. Sentry (error tracking) — optional

Without a DSN, errors are still logged locally; remote capture is skipped.

1. Create a project in [Sentry](https://sentry.io) → **Settings → Client Keys (DSN)**.
2. Copy the DSN to `SENTRY_DSN` (and `NEXT_PUBLIC_SENTRY_DSN` if you want
   client-side capture).
3. Optionally set `SENTRY_ENVIRONMENT` (e.g. `production`).

---

## 5. Upstash Redis (rate limiting) — optional

Auth-sensitive endpoints are rate-limited. With Upstash they use a distributed
sliding window; without it they fall back to a per-instance in-memory limiter
(fine for local/demo, not for multi-instance production).

1. Create a Redis database at [Upstash](https://console.upstash.com).
2. From **REST API**, copy:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

---

## 6. Environment variables

Create **`.env.local`** in the project root. Only the Supabase trio is required
for connected mode; everything else is optional and degrades gracefully.

```bash
# --- Supabase (required for connected mode) ---
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# --- App ---
NEXT_PUBLIC_APP_URL=http://localhost:3000

# --- Stripe (optional) ---
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# --- Resend (optional) ---
RESEND_API_KEY=re_...
EMAIL_FROM=Monytar <notifications@yourdomain.com>

# --- Sentry (optional) ---
SENTRY_DSN=https://...ingest.sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...ingest.sentry.io/...
SENTRY_ENVIRONMENT=development

# --- Upstash Redis (optional) ---
KV_REST_API_URL=https://<db>.upstash.io
KV_REST_API_TOKEN=<token>

# --- Logging (optional) ---
LOG_LEVEL=info
```

> To run **demo mode** instead, leave `NEXT_PUBLIC_SUPABASE_URL` and
> `NEXT_PUBLIC_SUPABASE_ANON_KEY` unset (or empty).

---

## 7. Run it

```bash
pnpm dev            # http://localhost:3000
```

- **Demo mode:** visit `/demo`, pick a role, and explore — no login needed.
- **Connected mode:** visit `/signup` to create the first organization and admin
  user, then sign in at `/login`.

Production build:

```bash
pnpm build
pnpm start
```

---

## 8. Tests

```bash
pnpm test           # unit + integration (Vitest)
pnpm typecheck      # tsc --noEmit
pnpm lint           # Next.js/ESLint
```

**End-to-end (Playwright):** the E2E suite runs against the app in **demo mode**
and expects a dev server already running on `http://localhost:3000` (it does not
spawn its own, to avoid port collisions).

```bash
# Terminal 1 — start the app in demo mode (Supabase vars unset):
pnpm dev

# Terminal 2:
pnpm exec playwright install --with-deps chromium   # first run only
pnpm test:e2e
```

Override the target with `E2E_BASE_URL` if the app runs elsewhere.

---

## 9. Deploy (any Node host)

The app is a standard Next.js application and can be deployed anywhere that runs
Node (Vercel, Fly, Render, a container, etc.). Wherever you deploy:

1. Set the **same environment variables** from Section 6 in that host's config.
2. Point the **Stripe webhook** and Supabase **Site/Redirect URLs** at the
   deployed domain.
3. Enable the CI workflow: copy `docs/ci.yml` to `.github/workflows/ci.yml` and
   commit it (see `docs/OPERATIONS.md` — the workflow can't be committed by the
   v0 GitHub App directly).

See **`docs/OPERATIONS.md`** for migration order, backups/PITR, observability
activation, and the incident runbook.
