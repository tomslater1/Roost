-- migration 0009 — add 'solo' to split_type constraint
--
-- 'solo' means one person paid and isn't splitting at all
-- (e.g. a personal purchase logged for visibility only).
-- The balance calculation skips solo expenses entirely.
-- The code schema already includes 'solo'; this aligns the DB.

alter table expenses
  drop constraint if exists expenses_split_type_check;

alter table expenses
  add constraint expenses_split_type_check
  check (split_type in ('equal', 'custom', 'solo'));
