-- migration 0032 — add budget_type and day_of_month to budgets
--
-- Extends the budgets table to distinguish between:
--   envelope  = a spending allowance the user actively logs expenses against
--   fixed     = a committed recurring cost that auto-logs each month
--
-- This replaces the recurring_bills source for fixed costs in
-- get_monthly_summary (see migration 0033).

alter table budgets
  add column if not exists budget_type text
  not null default 'envelope'
  check (budget_type in ('fixed', 'envelope'));

alter table budgets
  add column if not exists day_of_month integer
  check (day_of_month between 1 and 31);

comment on column budgets.budget_type is
  'envelope = spending allowance user logs against,
   fixed = committed cost that auto-logs each month';

comment on column budgets.day_of_month is
  'For fixed budgets: day of month the cost goes out.
   Null for envelope budgets.';
