-- 0039_goal_budget_link.sql
--
-- Five interconnected budget features:
--   Feature 1 — Goals as budget lines
--   Feature 3 — Annual costs spread monthly
--   Feature 4 — Rollover for lifestyle budgets
--   Feature 5 — Shared vs personal flags
--
-- (Feature 2 — Payment date column — is a UI-only change; no schema needed.)

-- ── Feature 1: Goals as budget lines ─────────────────────────────────────────

alter table savings_goals
  add column if not exists monthly_contribution
    numeric(10,2),
  add column if not exists contribution_day
    integer default 1
    check (contribution_day between 1 and 31),
  add column if not exists budget_line_id
    uuid references budget_template_lines(id)
      on delete set null;

comment on column savings_goals.monthly_contribution is
  'How much to contribute toward this goal each month. If set, a corresponding
   budget_template_line is created and linked via budget_line_id.';

comment on column savings_goals.contribution_day is
  'Day of month the contribution goes out. Default 1st. Creates a payment date
   on the linked budget line.';

comment on column savings_goals.budget_line_id is
  'The budget_template_line that funds this goal each month.
   Null if no monthly contribution is set.';

-- ── Feature 3: Annual costs spread monthly ────────────────────────────────────

alter table budget_template_lines
  add column if not exists is_annual
    boolean not null default false,
  add column if not exists annual_amount
    numeric(10,2);

comment on column budget_template_lines.is_annual is
  'If true, annual_amount is the yearly cost and amount is auto-calculated
   as annual_amount / 12.';

comment on column budget_template_lines.annual_amount is
  'The full annual cost. Only used when is_annual = true.';

-- ── Feature 4: Rollover for lifestyle budgets ─────────────────────────────────

alter table budget_template_lines
  add column if not exists rollover_enabled
    boolean not null default false;

create table if not exists budget_rollover_history (
  id                uuid          primary key default gen_random_uuid(),
  home_id           uuid          references homes(id) on delete cascade not null,
  template_line_id  uuid          references budget_template_lines(id) on delete cascade not null,
  month             date          not null,
  base_amount       numeric(10,2) not null,
  rollover_amount   numeric(10,2) not null default 0,
  effective_amount  numeric(10,2) not null,
  created_at        timestamptz   default now(),
  unique(template_line_id, month)
);

alter table budget_rollover_history enable row level security;

create policy "home members can select budget_rollover_history"
  on budget_rollover_history for select
  using (home_id = get_user_home_id());

create policy "home members can insert budget_rollover_history"
  on budget_rollover_history for insert
  with check (home_id = get_user_home_id());

create policy "home members can update budget_rollover_history"
  on budget_rollover_history for update
  using (home_id = get_user_home_id());

alter publication supabase_realtime add table budget_rollover_history;

-- ── Feature 5: Shared vs personal flags ──────────────────────────────────────

alter table budget_template_lines
  add column if not exists ownership
    text not null default 'shared'
    check (ownership in ('shared', 'member1', 'member2'));

comment on column budget_template_lines.ownership is
  'shared = both partners contribute.
   member1 = belongs to home creator only.
   member2 = belongs to partner only.
   Personal lines auto-set member1_percentage to 100/0 or 0/100.';
