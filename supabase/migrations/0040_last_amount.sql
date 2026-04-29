-- Migration 0040: last_amount tracking for budget template lines
-- Supports Feature 3 (budget vs last month comparison per line)

alter table budget_template_lines
  add column if not exists last_amount numeric(10,2),
  add column if not exists amount_changed_at timestamptz;

comment on column budget_template_lines.last_amount is
  'The previous amount before the most recent edit. Used for month-on-month comparison display.';

comment on column budget_template_lines.amount_changed_at is
  'Timestamp when the amount was last changed. Used to limit the comparison indicator to recent changes (≤60 days).';
