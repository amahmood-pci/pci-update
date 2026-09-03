-- PCI — Supabase schema for saved carts.
-- Run this once in your Supabase project:
--   Supabase Dashboard → SQL Editor → New query → paste → Run.
--
-- Auth (email magic link) needs NO tables — Supabase manages auth.users for you.
-- This only adds the table that stores each user's cart.

create table if not exists public.carts (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  items      jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: each user can only read/write THEIR OWN cart row.
-- This is what makes the public anon key safe to ship in the browser.
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

-- Orders. One row per checkout hand-off; status starts as 'submitted' and can be
-- updated by a Squarespace webhook (or manually) once payment completes.
create table if not exists public.orders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  items      jsonb not null,
  subtotal   numeric,
  currency   text default 'USD',
  status     text not null default 'submitted',
  reference  text,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);

alter table public.orders enable row level security;

drop policy if exists "own orders - select" on public.orders;
create policy "own orders - select"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "own orders - insert" on public.orders;
create policy "own orders - insert"
  on public.orders for insert
  with check (auth.uid() = user_id);

drop policy if exists "own orders - update" on public.orders;
create policy "own orders - update"
  on public.orders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
