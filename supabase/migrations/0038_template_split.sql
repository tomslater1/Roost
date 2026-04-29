-- 0038_template_split.sql
--
-- Adds a member1_percentage column to budget_template_lines so each budget
-- line can carry a per-row split between the two household members.
-- The second member's percentage is always 100 - member1_percentage.
-- member1 is the home creator (the user who set up the household).
-- Defaults to 50 (equal split) for all existing and new rows.

alter table budget_template_lines
  add column if not exists member1_percentage
    numeric(5,2) not null default 50.00
    check (member1_percentage between 0 and 100);

comment on column budget_template_lines.member1_percentage is
  'Percentage of this budget line allocated to the home creator (member 1).
   The other member gets 100 minus this value. Default 50/50.';
