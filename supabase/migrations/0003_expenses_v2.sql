-- ============================================================
-- Roost — Expenses v2
-- Run this in the Supabase SQL Editor.
-- Adds: settlements table, settle_up RPC, realtime for splits
-- ============================================================


-- ============================================================
-- TABLE: settlements
-- Immutable record of every settle-up event between partners.
-- Created when one person clears all outstanding debt.
-- ============================================================

create table settlements (
  id         uuid primary key default gen_random_uuid(),
  home_id    uuid references homes(id) on delete cascade not null,
  paid_by    uuid references auth.users(id) not null,  -- the debtor (who transferred money)
  paid_to    uuid references auth.users(id) not null,  -- the creditor (who received money)
  amount     numeric(10,2) not null,
  note       text,
  created_at timestamptz default now()
);

-- ============================================================
-- RLS: settlements
-- Scoped to the home. Immutable — no update or delete policies.
-- (Allowing deletion would create a broken ledger: splits would
-- remain settled=true but the record of why would be gone.)
-- ============================================================

alter table settlements enable row level security;

create policy "Users can view their home's settlements"
  on settlements for select
  using (home_id = get_user_home_id());

create policy "Users can insert into their home's settlements"
  on settlements for insert
  with check (home_id = get_user_home_id());


-- ============================================================
-- REALTIME: expense_splits and settlements
--
-- expense_splits has no home_id column (it joins through expenses),
-- so the app subscribes without a filter and relies on RLS to
-- scope what each user receives.
-- ============================================================

alter publication supabase_realtime add table expense_splits;
alter publication supabase_realtime add table settlements;


-- ============================================================
-- RPC: settle_up
--
-- Atomically:
--   1. Marks all unsettled splits belonging to the debtor (for
--      expenses in this home) as settled.
--   2. Inserts a settlement record.
--   3. Returns the new settlement id.
--
-- Uses SECURITY DEFINER so it can update expense_splits without
-- relying on the join-based RLS policy. The explicit home_members
-- check replaces the RLS guard — do not remove it.
-- ============================================================

create or replace function settle_up(
  p_home_id     uuid,
  p_debtor_id   uuid,   -- person who owes money; their splits are marked settled
  p_creditor_id uuid,   -- person being paid
  p_amount      numeric,
  p_note        text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_settlement_id uuid;
begin
  -- Verify the caller is a member of this home before doing anything.
  -- This is the sole security gate (security definer bypasses RLS).
  if not exists (
    select 1 from home_members
    where home_id = p_home_id
      and user_id = auth.uid()
  ) then
    raise exception 'Not a member of this home' using errcode = '42501';
  end if;

  -- Mark all of the debtor's unsettled splits (for this home) as settled
  update expense_splits es
  set
    settled    = true,
    settled_at = now()
  where es.settled = false
    and es.user_id = p_debtor_id
    and exists (
      select 1 from expenses e
      where e.id = es.expense_id
        and e.home_id = p_home_id
    );

  -- Record the settlement
  insert into settlements (home_id, paid_by, paid_to, amount, note)
  values (p_home_id, p_debtor_id, p_creditor_id, p_amount, p_note)
  returning id into v_settlement_id;

  return v_settlement_id;
end;
$$;
