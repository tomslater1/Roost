-- ============================================================
-- Account management RPCs
-- Both functions run as SECURITY DEFINER (owned by postgres)
-- so they can touch auth.users, which is off-limits to normal users.
-- ============================================================

-- leave_home: remove the calling user from their home.
-- If they are the last member the home is deleted, which cascades
-- and wipes all associated chores, expenses, shopping items, etc.
create or replace function leave_home()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_home_id     uuid;
  v_member_count int;
begin
  select home_id into v_home_id
  from public.home_members
  where user_id = auth.uid();

  if v_home_id is null then
    return;
  end if;

  select count(*) into v_member_count
  from public.home_members
  where home_id = v_home_id;

  if v_member_count <= 1 then
    -- Last person in the home — delete it (cascades all data)
    delete from public.homes where id = v_home_id;
  else
    -- Partner remains — just remove this user
    delete from public.home_members
    where home_id = v_home_id and user_id = auth.uid();
  end if;
end;
$$;

-- delete_account: fully remove the calling user from Supabase.
-- Leaves the home first (handles the last-member cascade), then
-- deletes the auth.users row which removes their login credentials.
create or replace function delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform leave_home();
  delete from auth.users where id = auth.uid();
end;
$$;
