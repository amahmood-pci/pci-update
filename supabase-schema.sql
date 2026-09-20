-- PCI — Supabase schema (idempotent).
-- Run this in the Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run repeatedly: every object uses `if not exists` / `drop … if exists`
-- so applying this to a fresh project or an existing one both work.
--
-- Auth (email + password, Google OAuth) needs NO tables — Supabase manages
-- auth.users for you. This file only adds the app tables: `carts` and `orders`.

-- ============================================================================
-- Extensions
-- ============================================================================
-- gen_random_uuid() lives in pgcrypto on Postgres.
create extension if not exists pgcrypto;


-- ============================================================================
-- Shared helper: touch updated_at on row change
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- ============================================================================
-- carts — one row per user, holds their in-progress cart as JSON
-- ============================================================================
create table if not exists public.carts (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  items      jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Trigger: server-authoritative updated_at (client can send anything; we ignore
-- it and always stamp with server time).
drop trigger if exists carts_touch_updated_at on public.carts;
create trigger carts_touch_updated_at
  before update on public.carts
  for each row execute function public.touch_updated_at();

-- Row Level Security — each user sees only their own cart row.
alter table public.carts enable row level security;

drop policy if exists "own cart - select" on public.carts;
create policy "own cart - select"
  on public.carts for select
  using (auth.uid() = user_id);

drop policy if exists "own cart - insert" on public.carts;
create policy "own cart - insert"
  on public.carts for insert
  with check (auth.uid() = user_id);

drop policy if exists "own cart - update" on public.carts;
create policy "own cart - update"
  on public.carts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own cart - delete" on public.carts;
create policy "own cart - delete"
  on public.carts for delete
  using (auth.uid() = user_id);


-- ============================================================================
-- orders — one row per checkout, transitioned to paid by the Stripe webhook
-- ============================================================================
create table if not exists public.orders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  items      jsonb not null,
  subtotal   numeric,
  currency   text default 'USD',
  status     text not null default 'submitted',
  reference  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Back-fill updated_at column on pre-existing DBs where the column didn't exist.
alter table public.orders add column if not exists updated_at timestamptz not null default now();

-- Constrain the status column to a known vocabulary. Adding it as NOT VALID
-- means existing rows aren't checked (safe for prod); new writes are.
alter table public.orders drop constraint if exists orders_status_valid;
alter table public.orders add constraint orders_status_valid
  check (status in ('submitted','paid','shipped','completed','cancelled','refunded'))
  not valid;

-- SECURITY: block clients from creating an order that is already 'paid'.
-- Insert policy alone can't check this, so we enforce with a BEFORE INSERT
-- trigger that clamps status to 'submitted' when the caller is a normal
-- authenticated user. Service-role (webhook) is allowed to insert with any
-- status (rarely used, but useful for backfills / manual entry).
create or replace function public.orders_force_submitted_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- current_user is 'authenticator'/'authenticated'/'anon' for browser calls
  -- and 'service_role' for server-side calls with the service key.
  if current_user <> 'service_role' then
    new.status := 'submitted';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_force_submitted on public.orders;
create trigger orders_force_submitted
  before insert on public.orders
  for each row execute function public.orders_force_submitted_on_insert();

-- Trigger: server-authoritative updated_at.
drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- Prevent the same Stripe payment_intent from being recorded twice. Partial
-- unique index skips NULLs (orders start with reference = NULL until paid).
create unique index if not exists orders_reference_unique_idx
  on public.orders (reference)
  where reference is not null;

-- Fast lookup of a user's orders on the account page.
create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);

-- Row Level Security.
alter table public.orders enable row level security;

drop policy if exists "own orders - select" on public.orders;
create policy "own orders - select"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "own orders - insert" on public.orders;
create policy "own orders - insert"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- NOTE: there is deliberately NO client UPDATE policy on orders. Customers may
-- create ('submitted') and read their orders, but they must NOT be able to
-- mark their own order 'paid' from the browser. The Stripe webhook updates
-- the status using the service-role key, which bypasses RLS. This is what
-- keeps "paid" honest — payment is confirmed server-side by Stripe, never
-- claimed by the client.
drop policy if exists "own orders - update" on public.orders;
