-- Idempotent re-creation of room group tables.
-- Migration 0015 was marked applied via `supabase migration repair` but never
-- actually executed, so the tables do not exist in the live database.

create table if not exists home_room_groups (
  id         uuid primary key default gen_random_uuid(),
  home_id    uuid references homes(id) on delete cascade not null,
  name       text not null,
  icon       text not null default 'Layers',
  created_at timestamptz not null default now(),
  unique(home_id, name)
);

alter table home_room_groups enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'home_room_groups' and policyname = 'read own home room groups'
  ) then
    create policy "read own home room groups"
      on home_room_groups for select
      using (home_id = (select get_user_home_id()));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'home_room_groups' and policyname = 'insert own home room groups'
  ) then
    create policy "insert own home room groups"
      on home_room_groups for insert
      with check (home_id = (select get_user_home_id()));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'home_room_groups' and policyname = 'update own home room groups'
  ) then
    create policy "update own home room groups"
      on home_room_groups for update
      using (home_id = (select get_user_home_id()));
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'home_room_groups' and policyname = 'delete own home room groups'
  ) then
    create policy "delete own home room groups"
      on home_room_groups for delete
      using (home_id = (select get_user_home_id()));
  end if;
end $$;

create table if not exists room_group_members (
  group_id  uuid references home_room_groups(id) on delete cascade not null,
  room_id   uuid references home_rooms(id) on delete cascade not null,
  primary key (group_id, room_id)
);

alter table room_group_members enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'room_group_members' and policyname = 'read own room group members'
  ) then
    create policy "read own room group members"
      on room_group_members for select
      using (
        exists (
          select 1 from home_room_groups g
          where g.id = group_id
            and g.home_id = (select get_user_home_id())
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'room_group_members' and policyname = 'insert own room group members'
  ) then
    create policy "insert own room group members"
      on room_group_members for insert
      with check (
        exists (
          select 1 from home_room_groups g
          where g.id = group_id
            and g.home_id = (select get_user_home_id())
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'room_group_members' and policyname = 'delete own room group members'
  ) then
    create policy "delete own room group members"
      on room_group_members for delete
      using (
        exists (
          select 1 from home_room_groups g
          where g.id = group_id
            and g.home_id = (select get_user_home_id())
        )
      );
  end if;
end $$;

-- Add to realtime publication if not already present
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'home_room_groups'
  ) then
    alter publication supabase_realtime add table home_room_groups;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'room_group_members'
  ) then
    alter publication supabase_realtime add table room_group_members;
  end if;
end $$;
