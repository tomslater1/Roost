-- migration 0008 — budgets and custom categories
--
-- Adds:
--   home_custom_categories  per-home additions to the fixed built-in category list
--   budgets                 monthly budget limits per category per home

-- ============================================================
-- home_custom_categories
-- ============================================================
create table home_custom_categories (
  id         uuid primary key default gen_random_uuid(),
  home_id    uuid references homes(id) on delete cascade not null,
  name       text not null,
  color      text not null,
  emoji      text not null,
  created_at timestamptz not null default now(),
  unique(home_id, name)
);

alter table home_custom_categories enable row level security;

create policy "read own home categories"
  on home_custom_categories for select
  using (home_id = (select get_user_home_id()));

create policy "insert own home categories"
  on home_custom_categories for insert
  with check (home_id = (select get_user_home_id()));

create policy "update own home categories"
  on home_custom_categories for update
  using (home_id = (select get_user_home_id()));

create policy "delete own home categories"
  on home_custom_categories for delete
  using (home_id = (select get_user_home_id()));

alter publication supabase_realtime add table home_custom_categories;

-- ============================================================
-- budgets
-- month is always stored as YYYY-MM-01 (first day of month).
-- This avoids timezone edge cases and makes month-scoped queries trivial.
-- Upsert pattern: onConflict = 'home_id,category,month'
-- ============================================================
create table budgets (
  id         uuid primary key default gen_random_uuid(),
  home_id    uuid references homes(id) on delete cascade not null,
  category   text not null,
  month      date not null,
  amount     numeric(10,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(home_id, category, month)
);

alter table budgets enable row level security;

create policy "read own home budgets"
  on budgets for select
  using (home_id = (select get_user_home_id()));

create policy "insert own home budgets"
  on budgets for insert
  with check (home_id = (select get_user_home_id()));

create policy "update own home budgets"
  on budgets for update
  using (home_id = (select get_user_home_id()));

create policy "delete own home budgets"
  on budgets for delete
  using (home_id = (select get_user_home_id()));

alter publication supabase_realtime add table budgets;
