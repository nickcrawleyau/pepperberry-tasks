-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- ===========================================
-- USERS TABLE
-- ===========================================
create table public.users (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  pin_hash text not null,
  role text not null check (role in ('admin', 'tradesperson', 'riding_school')),
  trade_type text check (
    trade_type is null or trade_type in (
      'fencer', 'plumber', 'electrician', 'handyman',
      'landscaper', 'general', 'animal_carer'
    )
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Index for login lookups
create index idx_users_name on public.users (name);
create index idx_users_role on public.users (role);

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================
alter table public.users enable row level security;

-- Admins can do everything with users
create policy "Admins have full access to users"
  on public.users
  for all
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- All authenticated users can read their own record
create policy "Users can view own profile"
  on public.users
  for select
  using (id = auth.uid());
