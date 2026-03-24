-- ============================================================
-- Roost — Phase 1 Fixes
-- Run this in the Supabase SQL Editor.
-- ============================================================


-- ============================================================
-- FIX 1: Invite code lookup for new users
--
-- Problem: A new user (not yet in any home) can't look up a
-- home by invite code. The RLS policy on `homes` only allows
-- selecting homes where id = get_user_home_id(). For a brand
-- new user, get_user_home_id() returns NULL, so they see nothing.
--
-- Fix: A security definer function that runs as postgres (bypasses
-- RLS) and returns the home id for a given invite code.
-- The app calls this instead of querying homes directly.
-- ============================================================

create or replace function get_home_by_invite_code(code text)
returns uuid
language sql
security definer
stable
as $$
  select id from homes where invite_code = code limit 1;
$$;


-- ============================================================
-- FIX 2: home_members realtime
--
-- Problem: When your partner joins your home, your Settings
-- "Household" section doesn't update until you restart the app.
--
-- Fix: Add home_members to the realtime publication so the
-- members list updates live on both machines.
-- ============================================================

alter publication supabase_realtime add table home_members;


-- ============================================================
-- FIX 3: updated_at trigger on shopping_items
--
-- Problem: The shopping_items table has an updated_at column
-- but nothing automatically updates it when a row changes.
--
-- Fix: A trigger function that sets updated_at = now() on
-- every update. This means the timestamp is always accurate
-- without the app having to set it manually.
-- ============================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger shopping_items_updated_at
  before update on shopping_items
  for each row
  execute procedure set_updated_at();
