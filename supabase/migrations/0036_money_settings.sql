-- migration 0036 — money settings
--
-- Adds per-member personal income with sharing consent, and per-home
-- money behaviour preferences (default split, carry-forward, scramble
-- mode, overspend alert threshold).
--
-- All new columns are nullable or have defaults so existing rows
-- degrade gracefully without requiring backfills.

-- ── home_members ──────────────────────────────────────────────────────────────

alter table home_members
  add column if not exists personal_income
    numeric(10,2),
  add column if not exists income_visible_to_partner
    boolean not null default false,
  add column if not exists income_set_at
    timestamptz;

-- ── homes ─────────────────────────────────────────────────────────────────────

alter table homes
  add column if not exists default_expense_split
    numeric(5,2) not null default 50.00
    check (default_expense_split between 0 and 100),
  add column if not exists budget_carry_forward
    text not null default 'auto'
    check (budget_carry_forward in ('auto','manual')),
  add column if not exists scramble_mode
    boolean not null default false,
  add column if not exists overspend_alert_threshold
    integer not null default 80
    check (overspend_alert_threshold between 50 and 100);
