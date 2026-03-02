# Monytar - Modern Expense Management Platform

Monytar is a full-stack expense management platform built for modern teams. It streamlines expense requests, automates multi-level approval workflows, tracks department budgets in real-time, and provides comprehensive financial reporting -- all through an intuitive, role-based interface.

## Features

- **Expense Management** -- Submit, track, and manage expense requests with receipt uploads, auto-categorization, and real-time status updates
- **Approval Workflows** -- Configurable multi-level approval chains with automatic routing, escalation, and threshold-based auto-approval
- **Budget Tracking** -- Department and project-level budgets with automated alerts, spending limits, and real-time utilization monitoring
- **Reporting & Analytics** -- Interactive dashboards with spending trends, budget breakdowns, category analysis, and exportable CSV reports
- **Vendor Management** -- Maintain an approved vendor directory with contact details, payment terms, and spending history
- **Team Management** -- Role-based access control (Employee, Manager, Finance, Admin) with organization hierarchies and department-scoped permissions
- **Multi-Currency** -- Support for 16 currencies with configurable organization defaults
- **Dark Mode** -- Full light/dark/system theme support across the entire application

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui component library
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Authentication:** Supabase Auth with email/password
- **Payments:** Stripe Checkout + Customer Portal for subscription billing
- **Charts:** Recharts for data visualization
- **State:** React Context with in-memory store (demo mode) / Supabase (production)
- **Deployment:** Vercel

## Architecture

```
app/
  (dashboard)/       # Protected dashboard routes (dashboard, requests, approvals, vendors, etc.)
  about/             # Public landing pages
  features/
  pricing/
  contact/
  changelog/
  login/             # Authentication pages
  signup/
  checkout/          # Stripe checkout flow
  api/
    auth/            # Authentication API routes
    webhooks/stripe/ # Stripe webhook handler
  actions/           # Server actions (Stripe checkout)
components/
  landing/           # Shared header/footer for public pages
  layout/            # Dashboard sidebar, top bar, demo banner
  ui/                # shadcn/ui + custom components (logo, empty-state)
lib/
  supabase/          # Supabase client configuration (server + browser)
  stripe/            # Stripe client configuration
  store.tsx          # Client-side state management (demo mode)
  mock-data.ts       # Demo data for all entities
  products.ts        # Subscription plan definitions
  types.ts           # TypeScript type definitions
  utils.ts           # Shared utilities
  validations.ts     # Input validation schemas (Zod)
supabase/
  migrations/        # SQL migration files for database schema + RLS policies
```

## Demo Mode

Monytar ships with a fully interactive demo mode that works without any external services. When Supabase and Stripe environment variables are not configured, the application gracefully falls back to in-memory state with realistic mock data, allowing you to:

- Switch between four demo users (Employee, Manager, Finance, Admin)
- Submit, approve, reject, and pay expense requests
- Manage vendors, departments, and users
- View analytics dashboards with sample data
- Explore all features without any setup

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
git clone <repository-url>
cd monytar
pnpm install
pnpm dev
```

The app runs at `http://localhost:3000` in demo mode with no additional configuration needed.

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values for production:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

Run the SQL migrations in your Supabase project in order:

1. `supabase/migrations/001_initial_schema.sql` -- Creates all tables, indexes, and triggers
2. `supabase/migrations/002_rls_policies.sql` -- Enables Row Level Security policies

## Subscription Plans

| Plan         | Price      | Users    | Key Features                                    |
| ------------ | ---------- | -------- | ----------------------------------------------- |
| Starter      | $29/mo     | Up to 10 | Basic expense tracking, manual approvals        |
| Professional | $79/mo     | Up to 50 | Automated workflows, budget tracking, analytics |
| Business     | $199/mo    | Up to 200| Custom approval chains, API access, SSO         |
| Enterprise   | Custom     | Unlimited| On-premise option, SLA, dedicated support       |

## Team

- **Richmond Asare** -- Team Lead
- **Kelvin Fameyeh** -- Software Developer

## Developed By

[GydGen](https://www.gydgen.com)

## License

All rights reserved.
