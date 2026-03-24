-- ============================================================
-- Roost — Migration 0010: SECURITY DEFINER RPCs for home creation
--
-- Problem: When a new user signs up, the client-side call to
-- INSERT into `homes` fails with an RLS error. Even though the
-- policy allows inserts for authenticated users, there can be a
-- race between the supabase-js client receiving the session and
-- the RLS check running. Using a SECURITY DEFINER function runs
-- as the postgres role, bypassing RLS entirely and guaranteeing
-- atomicity (home + member created in one transaction).
-- ============================================================


-- ============================================================
-- RPC 1: create_home_for_user
--
-- Creates a new home and inserts the caller as the owner.
-- Returns the new home's UUID.
-- ============================================================

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
  insert into homes (name)
  values (home_name)
  returning id into new_home_id;

  insert into home_members (home_id, user_id, role, display_name)
  values (new_home_id, auth.uid(), 'owner', display_name);

  return new_home_id;
end;
$$;


-- ============================================================
-- RPC 2: join_home_by_invite_code
--
-- Looks up a home by invite code and inserts the caller as a
-- member. Returns the home's UUID, or raises an exception if
-- the code is invalid.
-- ============================================================

create or replace function join_home_by_invite_code(
  code text,
  display_name text default 'User'
)
returns uuid
language plpgsql
security definer
as $$
declare
  target_home_id uuid;
begin
  select id into target_home_id
  from homes
  where invite_code = code
  limit 1;

  if target_home_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into home_members (home_id, user_id, role, display_name)
  values (target_home_id, auth.uid(), 'member', display_name);

  return target_home_id;
end;
$$;
