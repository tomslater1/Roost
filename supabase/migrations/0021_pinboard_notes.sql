-- ============================================================
-- Roost — Pinboard notes
-- Shared sticky-note style messages for a home.
-- ============================================================

create table if not exists pinboard_notes (
  id uuid primary key default gen_random_uuid(),
  home_id uuid references homes(id) on delete cascade not null,
  author_id uuid references auth.users(id) on delete set null,
  content text not null check (char_length(trim(content)) between 1 and 1000),
  link_type text check (
    link_type in ('room', 'category', 'chore', 'expense', 'shopping', 'budget', 'calendar')
  ),
  link_label text,
  linked_entity_id uuid,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table pinboard_notes enable row level security;

create policy "Users can view pinboard notes in their home"
  on pinboard_notes for select
  using (home_id = get_user_home_id());

create policy "Users can insert pinboard notes in their home"
  on pinboard_notes for insert
  with check (
    home_id = get_user_home_id()
    and (author_id = auth.uid() or author_id is null)
  );

create policy "Users can update pinboard notes in their home"
  on pinboard_notes for update
  using (home_id = get_user_home_id());

create policy "Users can delete pinboard notes in their home"
  on pinboard_notes for delete
  using (home_id = get_user_home_id());

create or replace function set_pinboard_notes_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_pinboard_notes_updated_at on pinboard_notes;
create trigger set_pinboard_notes_updated_at
before update on pinboard_notes
for each row execute function set_pinboard_notes_updated_at();

alter publication supabase_realtime add table pinboard_notes;
