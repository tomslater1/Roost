-- migration 0041 — security hardening
--
-- Fixes 7 vulnerabilities identified in RLS security audit:
--
-- C1: homes UPDATE allows any member to set subscription_tier/status → bypass Stripe
-- C2: promo_codes SELECT exposes every unredeemed code to any authenticated user
-- H1: home_members UPDATE allows member to escalate their own role to 'owner'
-- H2: join_home_by_invite_code allows a user to join a second home (dual membership)
-- M1: pinboard_notes UPDATE has no author check — any member can edit any note
-- M2: activity_feed INSERT doesn't enforce user_id — can spoof partner's activity
-- M3: expense_splits UPDATE has no user check — can mark anyone's split as settled
-- M4: get_user_home_id() is missing set search_path (search_path injection risk)


-- ============================================================
-- C1: Block subscription field writes from client sessions
--
-- The homes UPDATE RLS policy is intentionally broad so partners
-- can change the home name, settings, etc. But billing/subscription
-- columns must only ever be written by the Stripe webhook running
-- as service_role. This trigger rejects any attempt to change
-- those fields from a normal client session.
-- ============================================================

create or replace function block_subscription_column_writes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_role text;
begin
  -- Allow service_role (Stripe webhook / Edge Functions) and postgres (migrations)
  if current_user = 'postgres' then
    return new;
  end if;

  begin
    caller_role := current_setting('request.jwt.claims', true)::jsonb ->> 'role';
  exception when others then
    caller_role := null;
  end;

  if caller_role = 'service_role' then
    return new;
  end if;

  -- Reject any attempt to modify subscription-related columns
  if (new.subscription_status      is distinct from old.subscription_status)     or
     (new.subscription_tier        is distinct from old.subscription_tier)       or
     (new.stripe_customer_id       is distinct from old.stripe_customer_id)      or
     (new.stripe_subscription_id   is distinct from old.stripe_subscription_id)  or
     (new.current_period_ends_at   is distinct from old.current_period_ends_at)  or
     (new.stripe_price_id          is distinct from old.stripe_price_id)         or
     (new.has_used_trial           is distinct from old.has_used_trial)          or
     (new.trial_ends_at            is distinct from old.trial_ends_at)
  then
    raise exception 'permission_denied: subscription fields are read-only for clients';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_subscription_immutability on public.homes;
create trigger enforce_subscription_immutability
  before update on public.homes
  for each row execute function block_subscription_column_writes();


-- ============================================================
-- C2: Remove promo_codes SELECT policy
--
-- Clients should never browse promo codes. They submit a code
-- and the redeem-promo Edge Function validates it server-side
-- using service_role. Dropping this policy means unauthenticated
-- and authenticated clients alike cannot read the codes table.
-- ============================================================

drop policy if exists "Users can look up available codes" on public.promo_codes;


-- ============================================================
-- H1: Block role escalation in home_members
--
-- The UPDATE policy only checks user_id = auth.uid(), which
-- allows a member to set role = 'owner' on their own record.
-- This trigger prevents any client from changing their role.
-- ============================================================

create or replace function block_home_member_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'permission_denied: role cannot be changed by clients';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_home_member_role_immutability on public.home_members;
create trigger enforce_home_member_role_immutability
  before update on public.home_members
  for each row execute function block_home_member_role_change();


-- ============================================================
-- H2: Prevent dual-home membership in join_home_by_invite_code
--
-- Without this guard a user in home A can call this RPC and
-- successfully join home B, resulting in two home_members rows.
-- get_user_home_id() uses LIMIT 1 with no ORDER BY, so which
-- home the user sees becomes non-deterministic.
-- ============================================================

create or replace function join_home_by_invite_code(
  code text,
  display_name text default 'User'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_home_id uuid;
begin
  -- Reject if caller is already a member of any home
  if public.get_user_home_id() is not null then
    raise exception 'already_in_home: leave your current home before joining another';
  end if;

  select id into target_home_id
  from public.homes
  where invite_code = code
  limit 1;

  if target_home_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.home_members (home_id, user_id, role, display_name)
  values (target_home_id, auth.uid(), 'member', display_name);

  return target_home_id;
end;
$$;


-- ============================================================
-- M1: Restrict pinboard_notes UPDATE to the note's author
--
-- The previous policy allowed any home member to silently edit
-- any other member's note. Authors should own their own notes.
-- ============================================================

drop policy if exists "Users can update pinboard notes in their home" on public.pinboard_notes;

create policy "Users can update their own pinboard notes"
  on public.pinboard_notes for update
  using (
    home_id = public.get_user_home_id()
    and author_id = auth.uid()
  );


-- ============================================================
-- M2: Enforce user_id on activity_feed INSERT
--
-- The previous policy only checked home_id, allowing a client
-- to insert an activity entry with their partner's user_id and
-- fabricate activity in their name.
-- ============================================================

drop policy if exists "Users can insert into their home's activity feed" on public.activity_feed;

create policy "Users can insert into their home's activity feed"
  on public.activity_feed for insert
  with check (
    home_id = public.get_user_home_id()
    and user_id = auth.uid()
  );


-- ============================================================
-- M3: Restrict expense_splits UPDATE to the owning user
--
-- Any home member could previously mark their partner's split
-- as settled. settle_up() is SECURITY DEFINER and bypasses RLS
-- correctly — this only restricts direct client writes.
-- ============================================================

drop policy if exists "Users can update splits for their home's expenses" on public.expense_splits;

create policy "Users can update their own expense splits"
  on public.expense_splits for update
  using (
    user_id = auth.uid()
    and exists (
      select 1 from public.expenses
      where expenses.id = expense_splits.expense_id
        and expenses.home_id = public.get_user_home_id()
    )
  );


-- ============================================================
-- M4: Fix get_user_home_id() search_path
--
-- All SECURITY DEFINER functions should set search_path = ''
-- and use fully-qualified names to prevent search_path injection.
-- This was fixed in all later functions but missed on the original.
-- ============================================================

create or replace function get_user_home_id()
returns uuid
language sql
security definer
stable
set search_path = ''
as $$
  select home_id from public.home_members
  where user_id = auth.uid()
  limit 1;
$$;
