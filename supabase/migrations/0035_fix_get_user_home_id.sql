-- migration 0035 — fix get_user_home_id search path
--
-- The original function in 0001 references home_members without a schema prefix.
-- This works when called with the default search_path, but fails with
-- "42P01 relation home_members does not exist" when called from functions
-- that use `set search_path = ''` (e.g. get_monthly_summary).
--
-- Fix: recreate the function with explicit public. prefix and
-- set search_path = '' for security hardening.

create or replace function public.get_user_home_id()
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
