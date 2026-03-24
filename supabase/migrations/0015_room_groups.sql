-- migration 0015 — room groups
--
-- Adds:
--   home_room_groups      named groups of rooms per household (custom only)
--   room_group_members    junction: which rooms belong to each group
--
-- System groups ("All Rooms", "All Bedrooms", "All Bathrooms") are handled
-- entirely in client code and never stored here. "All Rooms" is always
-- available and non-removable for every household.
--
-- chores.room stores a plain text value that may be a room name, a
-- system group name, or a custom group name.

-- ============================================================
-- home_room_groups
-- ============================================================
create table home_room_groups (
  id         uuid primary key default gen_random_uuid(),
  home_id    uuid references homes(id) on delete cascade not null,
  name       text not null,
  icon       text not null default 'Layers',
  created_at timestamptz not null default now(),
  unique(home_id, name)
);

alter table home_room_groups enable row level security;

create policy "read own home room groups"
  on home_room_groups for select
  using (home_id = (select get_user_home_id()));

create policy "insert own home room groups"
  on home_room_groups for insert
  with check (home_id = (select get_user_home_id()));

create policy "update own home room groups"
  on home_room_groups for update
  using (home_id = (select get_user_home_id()));

create policy "delete own home room groups"
  on home_room_groups for delete
  using (home_id = (select get_user_home_id()));

alter publication supabase_realtime add table home_room_groups;

-- ============================================================
-- room_group_members
-- ============================================================
create table room_group_members (
  group_id  uuid references home_room_groups(id) on delete cascade not null,
  room_id   uuid references home_rooms(id) on delete cascade not null,
  primary key (group_id, room_id)
);

alter table room_group_members enable row level security;

-- Scoped through the group → home join so no home_id column is needed
create policy "read own room group members"
  on room_group_members for select
  using (
    exists (
      select 1 from home_room_groups g
      where g.id = group_id
        and g.home_id = (select get_user_home_id())
    )
  );

create policy "insert own room group members"
  on room_group_members for insert
  with check (
    exists (
      select 1 from home_room_groups g
      where g.id = group_id
        and g.home_id = (select get_user_home_id())
    )
  );

create policy "delete own room group members"
  on room_group_members for delete
  using (
    exists (
      select 1 from home_room_groups g
      where g.id = group_id
        and g.home_id = (select get_user_home_id())
    )
  );

alter publication supabase_realtime add table room_group_members;
