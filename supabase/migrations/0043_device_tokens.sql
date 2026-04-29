-- ── Device Tokens ─────────────────────────────────────────────────────────────
-- Stores APNs device tokens so the backend can deliver push notifications
-- when the app is closed or suspended. One row per (user, token) pair so a
-- user with multiple devices gets notified on all of them.

create table device_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  token       text not null,
  platform    text not null default 'ios',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, token)
);

create index idx_device_tokens_user_id on device_tokens(user_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table device_tokens enable row level security;

-- Users can only read/write their own tokens
create policy "Users manage their own device tokens"
  on device_tokens for all
  using (user_id = auth.uid());

-- ── Updated-at trigger ────────────────────────────────────────────────────────

create or replace function touch_device_token_updated_at()
returns trigger language plpgsql as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

create trigger device_tokens_updated_at
  before update on device_tokens
  for each row execute function touch_device_token_updated_at();
