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
