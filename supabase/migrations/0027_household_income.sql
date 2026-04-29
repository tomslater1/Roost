-- migration 0027 — household_income table
-- Applied directly in the Supabase dashboard on 2026-04-11.
-- This file is a local record of the SQL that was run.

create table if not exists public.household_income (
  id              uuid primary key default gen_random_uuid(),
  home_id         uuid not null references public.homes(id) on delete cascade,
  month           date not null,
  combined_amount numeric(12, 2) not null,
  tom_amount      numeric(12, 2),
  partner_amount  numeric(12, 2),
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (home_id, month)
);

-- RLS
alter table public.household_income enable row level security;

create policy "household_income: home members can read"
  on public.household_income for select
  using (home_id = get_user_home_id());

create policy "household_income: home members can insert"
  on public.household_income for insert
  with check (home_id = get_user_home_id());

create policy "household_income: home members can update"
  on public.household_income for update
  using (home_id = get_user_home_id());

create policy "household_income: home members can delete"
  on public.household_income for delete
  using (home_id = get_user_home_id());

-- updated_at trigger
create trigger set_household_income_updated_at
  before update on public.household_income
  for each row execute function public.set_updated_at();
