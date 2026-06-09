-- ============================================================
-- Migration 006: Demo lead capture
-- Stores leads from the public, login-free product demo.
-- Demo leads are intentionally NOT tied to an organization and
-- never touch production tenant data. Reads are restricted to
-- platform admins via the service role; the public can only insert.
-- ============================================================

create table if not exists public.demo_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  company_name text,
  phone text,
  entry_role text not null default 'employee'
    check (entry_role in ('employee', 'manager', 'finance', 'admin')),
  country text,
  device text,
  browser text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  ip_address inet,
  converted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_demo_leads_created_at on public.demo_leads (created_at desc);
create index if not exists idx_demo_leads_email on public.demo_leads (email);
create index if not exists idx_demo_leads_converted on public.demo_leads (converted);

alter table public.demo_leads enable row level security;

-- Anyone (including anonymous visitors) may submit a demo lead.
drop policy if exists "Anyone can submit a demo lead" on public.demo_leads;
create policy "Anyone can submit a demo lead"
  on public.demo_leads
  for insert
  to anon, authenticated
  with check (true);

-- Only platform admins may read demo leads. Regular tenant users cannot.
-- The admin API uses the service role key, which bypasses RLS, so no
-- broad select policy is granted here by design.
