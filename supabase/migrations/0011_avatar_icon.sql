-- migration 0011 — add avatar_icon to home_members
--
-- Members can choose a Lucide icon for their avatar instead of showing
-- the first letter of their display name. Null = letter fallback.
-- The column is optional so existing rows are unaffected.

alter table home_members add column if not exists avatar_icon text;
