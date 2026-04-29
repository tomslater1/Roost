-- migration 0028 — savings_goals table
-- Applied directly in the Supabase dashboard on 2026-04-11.
-- This file is a local record of the SQL that was run.

create table if not exists public.savings_goals (
  id            uuid primary key default gen_random_uuid(),
  home_id       uuid not null references public.homes(id) on delete cascade,
  name          text not null,
  target_amount numeric(12, 2) not null,
  current_amount numeric(12, 2) not null default 0,
  target_date   date,
  colour        text,
  icon          text,
  is_complete   boolean default false,
  completed_at  timestamptz,
  sort_order    integer default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- RLS
alter table public.savings_goals enable row level security;

create policy "savings_goals: home members can read"
  on public.savings_goals for select
  using (home_id = get_user_home_id());

create policy "savings_goals: home members can insert"
  on public.savings_goals for insert
  with check (home_id = get_user_home_id());

create policy "savings_goals: home members can update"
  on public.savings_goals for update
  using (home_id = get_user_home_id());

create policy "savings_goals: home members can delete"
  on public.savings_goals for delete
  using (home_id = get_user_home_id());

-- updated_at trigger
create trigger set_savings_goals_updated_at
  before update on public.savings_goals
  for each row execute function public.set_updated_at();

-- Limit free-tier households to 1 savings goal (trigger enforces upgrade prompt)
create or replace function public.check_savings_goals_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  goal_count integer;
  home_tier  text;
begin
  select subscription_tier into home_tier
  from public.homes
  where id = new.home_id;

  if home_tier = 'free' then
    select count(*) into goal_count
    from public.savings_goals
    where home_id = new.home_id;

    if goal_count >= 1 then
      raise exception 'upgrade_required: savings_goals limit reached on free tier';
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_savings_goals_limit
  before insert on public.savings_goals
  for each row execute function public.check_savings_goals_limit();
