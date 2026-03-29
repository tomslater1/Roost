-- migration 0025 — lifetime Roost Nest access via promo codes

alter table homes
  drop constraint if exists homes_subscription_status_check;

alter table homes
  add constraint homes_subscription_status_check
  check (subscription_status in (
    'free', 'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'lifetime'
  ));

create table if not exists promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text,
  type text not null default 'lifetime_nest'
    check (type in ('lifetime_nest')),
  max_redemptions integer not null default 1,
  redemption_count integer not null default 0,
  redeemed_by_home_id uuid references homes(id) on delete set null,
  redeemed_at timestamptz,
  created_at timestamptz default now(),
  expires_at timestamptz
);

alter table promo_codes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'promo_codes'
      and policyname = 'Users can look up available codes'
  ) then
    create policy "Users can look up available codes"
      on promo_codes for select
      using (
        redeemed_by_home_id is null
        or redeemed_by_home_id = get_user_home_id()
      );
  end if;
end $$;

insert into promo_codes (
  code,
  description,
  max_redemptions
) values (
  'ROOST-TEST',
  'Test lifetime code — development only',
  1
) on conflict (code) do nothing;