-- migration 0029 — recurring_bills table
-- Applied directly in the Supabase dashboard on 2026-04-11.
-- This file is a local record of the SQL that was run.

create table if not exists public.recurring_bills (
  id           uuid primary key default gen_random_uuid(),
  home_id      uuid not null references public.homes(id) on delete cascade,
  name         text not null,
  amount       numeric(12, 2) not null,
  day_of_month integer not null check (day_of_month between 1 and 31),
  category     text,
  is_active    boolean default true,
  colour       text,
  sort_order   integer default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- RLS
alter table public.recurring_bills enable row level security;

create policy "recurring_bills: home members can read"
  on public.recurring_bills for select
  using (home_id = get_user_home_id());

create policy "recurring_bills: home members can insert"
  on public.recurring_bills for insert
  with check (home_id = get_user_home_id());

create policy "recurring_bills: home members can update"
  on public.recurring_bills for update
  using (home_id = get_user_home_id());

create policy "recurring_bills: home members can delete"
  on public.recurring_bills for delete
  using (home_id = get_user_home_id());

-- updated_at trigger
create trigger set_recurring_bills_updated_at
  before update on public.recurring_bills
  for each row execute function public.set_updated_at();

-- Limit free-tier households to 3 recurring bills
create or replace function public.check_recurring_bills_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  bill_count integer;
  home_tier  text;
begin
  select subscription_tier into home_tier
  from public.homes
  where id = new.home_id;

  if home_tier = 'free' then
    select count(*) into bill_count
    from public.recurring_bills
    where home_id = new.home_id
      and is_active = true;

    if bill_count >= 3 then
      raise exception 'upgrade_required: recurring_bills limit reached on free tier';
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_recurring_bills_limit
  before insert on public.recurring_bills
  for each row execute function public.check_recurring_bills_limit();
