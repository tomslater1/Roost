-- ============================================================
-- Roost — Initial Schema
-- Run this in the Supabase SQL Editor for your project.
-- ============================================================


-- ============================================================
-- TABLES
-- ============================================================

-- homes: the central shared workspace for a couple
create table homes (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our Home',
  -- invite_code is what you share with your partner to join your home.
  -- 8 random hex characters, unique across all homes.
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  created_at timestamptz default now()
);

-- home_members: links Supabase auth users to a home
create table home_members (
  id uuid primary key default gen_random_uuid(),
  home_id uuid references homes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  display_name text,
  avatar_color text default '#7F77DD',
  joined_at timestamptz default now(),
  unique(home_id, user_id)
);

-- shopping_items: the shared shopping list
create table shopping_items (
  id uuid primary key default gen_random_uuid(),
  home_id uuid references homes(id) on delete cascade not null,
  name text not null,
  quantity text,
  category text,
  checked boolean default false,
  added_by uuid references auth.users(id),
  checked_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- expenses: shared bills and costs
create table expenses (
  id uuid primary key default gen_random_uuid(),
  home_id uuid references homes(id) on delete cascade not null,
  title text not null,
  amount numeric(10,2) not null,
  paid_by uuid references auth.users(id) not null,
  split_type text not null default 'equal' check (split_type in ('equal', 'custom')),
  category text,
  is_recurring boolean default false,
  recurrence_interval text check (recurrence_interval in ('weekly', 'monthly', 'yearly')),
  notes text,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- expense_splits: the individual share each person owes for an expense
create table expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references expenses(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  amount numeric(10,2) not null,
  settled boolean default false,
  settled_at timestamptz
);

-- chores: recurring and one-off tasks around the home
create table chores (
  id uuid primary key default gen_random_uuid(),
  home_id uuid references homes(id) on delete cascade not null,
  title text not null,
  description text,
  assigned_to uuid references auth.users(id),
  frequency text check (frequency in ('once', 'daily', 'weekly', 'fortnightly', 'monthly')),
  last_completed_at timestamptz,
  completed_by uuid references auth.users(id),
  due_date date,
  created_at timestamptz default now()
);

-- activity_feed: a live log of everything that happens in the home
create table activity_feed (
  id uuid primary key default gen_random_uuid(),
  home_id uuid references homes(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  action text not null,        -- e.g. "added milk to the shopping list"
  entity_type text not null,   -- e.g. "shopping_item", "expense", "chore"
  entity_id uuid,              -- the id of the thing that was acted on
  metadata jsonb,              -- any extra data (e.g. the item name)
  created_at timestamptz default now()
);


-- ============================================================
-- HELPER FUNCTION
-- Must be created after home_members exists, because PostgreSQL
-- validates SQL function bodies at creation time.
-- Returns the home_id for the currently authenticated user.
-- security definer = runs with the privileges of the function
-- owner (postgres), not the calling user.
-- ============================================================

create or replace function get_user_home_id()
returns uuid as $$
  select home_id from home_members
  where user_id = auth.uid()
  limit 1;
$$ language sql security definer stable;


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Every table has RLS enabled. Users can only see and modify
-- data that belongs to their home. This is enforced at the
-- database level — not just in the application code.
-- ============================================================

-- homes
alter table homes enable row level security;

create policy "Authenticated users can create a home"
  on homes for insert
  with check (auth.uid() is not null);

create policy "Users can view their own home"
  on homes for select
  using (id = get_user_home_id());

create policy "Users can update their own home"
  on homes for update
  using (id = get_user_home_id());

-- home_members
alter table home_members enable row level security;

create policy "Users can view members in their home"
  on home_members for select
  using (home_id = get_user_home_id());

-- Allows insert for both signup (creating a new home) and join (joining an existing home).
-- The key constraint is that you can only insert a record for yourself.
create policy "Users can insert themselves as a member"
  on home_members for insert
  with check (user_id = auth.uid());

create policy "Users can update their own member record"
  on home_members for update
  using (user_id = auth.uid());

create policy "Users can delete their own member record"
  on home_members for delete
  using (user_id = auth.uid());

-- shopping_items
alter table shopping_items enable row level security;

create policy "Users can view their home's shopping items"
  on shopping_items for select
  using (home_id = get_user_home_id());

create policy "Users can insert into their home's shopping items"
  on shopping_items for insert
  with check (home_id = get_user_home_id());

create policy "Users can update their home's shopping items"
  on shopping_items for update
  using (home_id = get_user_home_id());

create policy "Users can delete their home's shopping items"
  on shopping_items for delete
  using (home_id = get_user_home_id());

-- expenses
alter table expenses enable row level security;

create policy "Users can view their home's expenses"
  on expenses for select
  using (home_id = get_user_home_id());

create policy "Users can insert into their home's expenses"
  on expenses for insert
  with check (home_id = get_user_home_id());

create policy "Users can update their home's expenses"
  on expenses for update
  using (home_id = get_user_home_id());

create policy "Users can delete their home's expenses"
  on expenses for delete
  using (home_id = get_user_home_id());

-- expense_splits
-- Splits belong to an expense, so we join through to check the home
alter table expense_splits enable row level security;

create policy "Users can view splits for their home's expenses"
  on expense_splits for select
  using (
    exists (
      select 1 from expenses
      where expenses.id = expense_splits.expense_id
        and expenses.home_id = get_user_home_id()
    )
  );

create policy "Users can insert splits for their home's expenses"
  on expense_splits for insert
  with check (
    exists (
      select 1 from expenses
      where expenses.id = expense_splits.expense_id
        and expenses.home_id = get_user_home_id()
    )
  );

create policy "Users can update splits for their home's expenses"
  on expense_splits for update
  using (
    exists (
      select 1 from expenses
      where expenses.id = expense_splits.expense_id
        and expenses.home_id = get_user_home_id()
    )
  );

create policy "Users can delete splits for their home's expenses"
  on expense_splits for delete
  using (
    exists (
      select 1 from expenses
      where expenses.id = expense_splits.expense_id
        and expenses.home_id = get_user_home_id()
    )
  );

-- chores
alter table chores enable row level security;

create policy "Users can view their home's chores"
  on chores for select
  using (home_id = get_user_home_id());

create policy "Users can insert into their home's chores"
  on chores for insert
  with check (home_id = get_user_home_id());

create policy "Users can update their home's chores"
  on chores for update
  using (home_id = get_user_home_id());

create policy "Users can delete their home's chores"
  on chores for delete
  using (home_id = get_user_home_id());

-- activity_feed
alter table activity_feed enable row level security;

create policy "Users can view their home's activity feed"
  on activity_feed for select
  using (home_id = get_user_home_id());

create policy "Users can insert into their home's activity feed"
  on activity_feed for insert
  with check (home_id = get_user_home_id());

-- Activity feed entries are immutable — no update or delete policies


-- ============================================================
-- REALTIME
-- Enable Supabase Realtime on the tables that need live sync.
-- The shopping list, chores, and activity feed all update live.
-- ============================================================

alter publication supabase_realtime add table shopping_items;
alter publication supabase_realtime add table chores;
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table activity_feed;
