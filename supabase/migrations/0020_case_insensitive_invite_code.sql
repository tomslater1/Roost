-- Fix invite code lookup to be case-insensitive.
-- md5() generates lowercase hex codes but the app UI forces uppercase input,
-- causing the comparison to fail. Normalize both sides to lowercase.

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
  where lower(invite_code) = lower(code)
  limit 1;

  if target_home_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into home_members (home_id, user_id, display_name, role)
  values (target_home_id, auth.uid(), display_name, 'member')
  on conflict (home_id, user_id) do nothing;

  return target_home_id;
end;
$$;

create or replace function get_home_by_invite_code(code text)
returns uuid
language sql
security definer
as $$
  select id from homes where lower(invite_code) = lower(code) limit 1;
$$;
