-- ============================================================
-- Notifications
-- ============================================================
-- Stores one notification row per recipient per activity event.
-- Rows are created automatically by a trigger on activity_feed —
-- clients never insert directly.

create table notifications (
  id           uuid primary key default gen_random_uuid(),
  home_id      uuid references homes(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null, -- who sees it
  actor_id     uuid references auth.users(id) on delete set null,          -- who did it
  type         text not null,         -- mirrors entity_type: 'expense', 'chore', etc.
  title        text not null,         -- human-readable, e.g. 'logged £45.00 for Groceries'
  entity_id    uuid,                  -- the expense/chore/etc that triggered this
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table notifications enable row level security;

-- Each user can only see their own notifications
create policy "Users can view their own notifications"
  on notifications for select
  using (user_id = auth.uid());

-- Users can only mark their own notifications as read
create policy "Users can update their own notifications"
  on notifications for update
  using (user_id = auth.uid());

-- No client INSERT policy — rows are created exclusively by the trigger below
-- (which runs as postgres / SECURITY DEFINER and bypasses RLS)

-- ── Realtime ──────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table notifications;

-- ── Trigger ───────────────────────────────────────────────────────────────────
-- Every time someone logs an activity, create a notification for every
-- OTHER member of the same home. The actor does not get a notification
-- for their own actions.

create or replace function create_notifications_for_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Skip system events with no actor
  if NEW.user_id is null then
    return NEW;
  end if;

  insert into public.notifications (home_id, user_id, actor_id, type, title, entity_id)
  select
    NEW.home_id,
    hm.user_id,    -- recipient (everyone in the home except the actor)
    NEW.user_id,   -- actor
    coalesce(NEW.entity_type, 'general'),
    NEW.action,    -- e.g. 'logged £45.00 for Groceries'
    NEW.entity_id
  from public.home_members hm
  where hm.home_id = NEW.home_id
    and hm.user_id != NEW.user_id;

  return NEW;
end;
$$;

create trigger on_activity_inserted
  after insert on activity_feed
  for each row
  execute function create_notifications_for_activity();
