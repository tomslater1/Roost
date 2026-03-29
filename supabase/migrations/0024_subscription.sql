-- migration 0024 — Roost Nest subscription foundation
--
-- Adds household-level subscription state to homes so both the macOS app and
-- future iOS app read from the same source of truth. Subscription writes are
-- webhook-driven; clients only ever read and react.

alter table homes
  add column if not exists subscription_status text
    not null default 'free'
    check (subscription_status in (
      'free', 'trialing', 'active', 'past_due', 'canceled', 'incomplete'
    )),
  add column if not exists subscription_tier text
    not null default 'free'
    check (subscription_tier in ('free', 'nest')),
  add column if not exists trial_ends_at timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists current_period_ends_at timestamptz,
  add column if not exists stripe_price_id text,
  add column if not exists has_used_trial boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'homes_stripe_customer_id_unique'
  ) then
    alter table homes
      add constraint homes_stripe_customer_id_unique unique (stripe_customer_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'homes_stripe_subscription_id_unique'
  ) then
    alter table homes
      add constraint homes_stripe_subscription_id_unique unique (stripe_subscription_id);
  end if;
end $$;

create table if not exists subscription_events (
  id uuid primary key default gen_random_uuid(),
  home_id uuid references homes(id) on delete set null,
  stripe_event_id text unique not null,
  event_type text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  payload jsonb not null,
  processed_at timestamptz default now()
);

alter table subscription_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'subscription_events'
      and policyname = 'Users can view their home subscription events'
  ) then
    create policy "Users can view their home subscription events"
      on subscription_events for select
      using (home_id = get_user_home_id());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'subscription_events_stripe_event_id_idx'
  ) then
    create index subscription_events_stripe_event_id_idx
      on subscription_events(stripe_event_id);
  end if;
end $$;

do $$
begin
  begin
    alter publication supabase_realtime add table subscription_events;
  exception
    when duplicate_object then null;
    when duplicate_table then null;
  end;
end $$;

-- New homes start with a warm 14-day Nest trial immediately.
create or replace function create_home_for_user(
  home_name text default 'Our Home',
  display_name text default 'User'
)
returns uuid
language plpgsql
security definer
as $$
declare
  new_home_id uuid;
begin
  insert into homes (
    name,
    subscription_status,
    subscription_tier,
    trial_ends_at,
    has_used_trial
  )
  values (
    home_name,
    'trialing',
    'nest',
    now() + interval '14 days',
    false
  )
  returning id into new_home_id;

  insert into home_members (home_id, user_id, role, display_name)
  values (new_home_id, auth.uid(), 'owner', display_name);

  insert into home_rooms (home_id, name, icon) values
    (new_home_id, 'Kitchen',     'ChefHat'),
    (new_home_id, 'Living Room', 'Sofa'),
    (new_home_id, 'Bedroom',     'Bed'),
    (new_home_id, 'Bathroom',    'Bath');

  return new_home_id;
end;
$$;