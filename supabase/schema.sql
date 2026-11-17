-- Swim & Dry-Land plan: shared log for two people.
-- Run once in Supabase → SQL Editor. Replace the two emails first.

-- 1. Who may use the app
create table if not exists public.allowed_users (
  email text primary key
);
insert into public.allowed_users (email) values
  ('ahmed@example.com'),   -- replace with Ahmed's email (lowercase)
  ('yousr@example.com')    -- replace with Yousr's email (lowercase)
on conflict do nothing;

alter table public.allowed_users enable row level security;
drop policy if exists "read own allow-list row" on public.allowed_users;
create policy "read own allow-list row" on public.allowed_users
  for select to authenticated
  using (email = lower(auth.jwt() ->> 'email'));

-- 2. One table holds every log entry as a JSON document
create table if not exists public.docs (
  col        text not null,          -- log, sessions, swims, daily, bench, inbody, health, reviews, config
  id         text not null,          -- e.g. a_2026-11-28
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text default lower(auth.jwt() ->> 'email'),
  primary key (col, id)
);
alter table public.docs replica identity full;   -- so deletes sync in realtime
alter table public.docs enable row level security;

create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.allowed_users where email = lower(auth.jwt() ->> 'email'));
$$;

drop policy if exists "members read"   on public.docs;
drop policy if exists "members insert" on public.docs;
drop policy if exists "members update" on public.docs;
drop policy if exists "members delete" on public.docs;
create policy "members read"   on public.docs for select to authenticated using (public.is_member());
create policy "members insert" on public.docs for insert to authenticated with check (public.is_member());
create policy "members update" on public.docs for update to authenticated using (public.is_member()) with check (public.is_member());
create policy "members delete" on public.docs for delete to authenticated using (public.is_member());

-- 3. Live updates between your two devices
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;
