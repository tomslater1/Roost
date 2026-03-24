-- migration 0013 — rooms
--
-- Adds:
--   home_rooms   per-home list of rooms (all user-managed, none hardcoded)
--   chores.room  text field storing the room name on a chore
--
-- icon stores a Lucide icon name string (e.g. 'ChefHat', 'Sofa').
-- Room name is stored as plain text on chores so renaming a room in
-- home_rooms doesn't silently orphan existing chore labels.

-- ============================================================
-- home_rooms
-- ============================================================
create table home_rooms (
  id         uuid primary key default gen_random_uuid(),
  home_id    uuid references homes(id) on delete cascade not null,
  name       text not null,
  icon       text not null default 'Home',
  created_at timestamptz not null default now(),
  unique(home_id, name)
);

alter table home_rooms enable row level security;

create policy "read own home rooms"
  on home_rooms for select
  using (home_id = (select get_user_home_id()));

create policy "insert own home rooms"
  on home_rooms for insert
  with check (home_id = (select get_user_home_id()));

create policy "update own home rooms"
  on home_rooms for update
  using (home_id = (select get_user_home_id()));

create policy "delete own home rooms"
  on home_rooms for delete
  using (home_id = (select get_user_home_id()));

alter publication supabase_realtime add table home_rooms;

-- ============================================================
-- chores — plain text room name
-- ============================================================
alter table chores add column room text;
