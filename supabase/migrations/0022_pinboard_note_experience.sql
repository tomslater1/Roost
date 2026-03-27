-- ============================================================
-- Roost — Pinboard note experience enhancements
-- Targeted notes, acknowledgements, and notifications.
-- ============================================================

alter table pinboard_notes
  add column if not exists target_scope text not null default 'everyone'
    check (target_scope in ('self', 'partner', 'everyone')),
  add column if not exists target_user_id uuid references auth.users(id) on delete set null,
  add column if not exists notify_on_create boolean not null default true;

create table if not exists pinboard_note_acknowledgements (
  note_id uuid references pinboard_notes(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  seen_at timestamptz not null default now(),
  primary key (note_id, user_id)
);

alter table pinboard_note_acknowledgements enable row level security;

create policy "Users can view pinboard acknowledgements in their home"
  on pinboard_note_acknowledgements for select
  using (
    exists (
      select 1
      from pinboard_notes pn
      where pn.id = pinboard_note_acknowledgements.note_id
        and pn.home_id = get_user_home_id()
    )
  );

create policy "Users can acknowledge notes in their home"
  on pinboard_note_acknowledgements for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from pinboard_notes pn
      where pn.id = pinboard_note_acknowledgements.note_id
        and pn.home_id = get_user_home_id()
    )
  );

create policy "Users can update their own acknowledgements"
  on pinboard_note_acknowledgements for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter publication supabase_realtime add table pinboard_note_acknowledgements;

create or replace function notify_for_pinboard_note()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not new.notify_on_create then
    return new;
  end if;

  insert into public.notifications (home_id, user_id, actor_id, type, title, entity_id)
  select
    new.home_id,
    hm.user_id,
    new.author_id,
    'pinboard',
    case
      when new.target_scope = 'self' then 'You left yourself a pinboard note'
      when new.target_scope = 'partner' then 'Your partner left you a pinboard note'
      else 'A new pinboard note was added'
    end,
    new.id
  from public.home_members hm
  where hm.home_id = new.home_id
    and hm.user_id <> coalesce(new.author_id, hm.user_id)
    and (
      new.target_scope = 'everyone'
      or (new.target_scope in ('self', 'partner') and hm.user_id = new.target_user_id)
    );

  return new;
end;
$$;

drop trigger if exists on_pinboard_note_inserted on pinboard_notes;
create trigger on_pinboard_note_inserted
  after insert on pinboard_notes
  for each row
  execute function notify_for_pinboard_note();
