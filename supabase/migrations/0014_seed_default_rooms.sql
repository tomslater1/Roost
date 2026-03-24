-- migration 0014 — seed default rooms on home creation
--
-- Updates create_home_for_user to insert Kitchen, Living Room,
-- Bedroom, and Bathroom into home_rooms for every new home.
-- Existing homes are unaffected; users can rename or delete these
-- rooms like any other.

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

  -- Seed four common rooms every household starts with.
  -- Users can rename, reorder, or delete these like any other room.
  insert into home_rooms (home_id, name, icon) values
    (new_home_id, 'Kitchen',     'ChefHat'),
    (new_home_id, 'Living Room', 'Sofa'),
    (new_home_id, 'Bedroom',     'Bed'),
    (new_home_id, 'Bathroom',    'Bath');

  return new_home_id;
end;
$$;
