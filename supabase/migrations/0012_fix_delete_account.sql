-- Fix delete_account: remove the broken `delete from auth.users` line.
-- Direct deletion from auth.users via SQL doesn't work in Supabase — it must go
-- through auth.admin.deleteUser() in the service role API.
-- Account deletion is now handled by the delete-account Edge Function which:
--   1. Calls leave_home() here to clean up home data
--   2. Calls auth.admin.deleteUser() via the service role key
--
-- This stub is kept so any legacy callers don't break, but the Edge Function
-- is the authoritative deletion path.

create or replace function delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform leave_home();
  -- Auth user deletion is handled by the delete-account Edge Function.
  -- Supabase does not permit direct DELETE on auth.users via SQL.
end;
$$;
