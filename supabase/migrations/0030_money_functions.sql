-- migration 0030 — get_monthly_summary RPC + category normalisation triggers
-- Applied directly in the Supabase dashboard on 2026-04-11.
-- This file is a local record of the SQL that was run.

-- ── get_monthly_summary ───────────────────────────────────────────────────────
-- Returns a JSON summary of the household's financial picture for a given month.
-- p_home_id: the household UUID
-- p_month:   the first day of the month as a date string (YYYY-MM-DD)

create or replace function public.get_monthly_summary(
  p_home_id uuid,
  p_month   date
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_income          numeric := 0;
  v_fixed_costs     numeric := 0;
  v_discretionary   numeric := 0;
  v_total_spent     numeric := 0;
  v_surplus         numeric := 0;
  v_days_in_month   integer;
  v_day_of_month    integer;
  v_projected_total numeric := 0;
  v_pct_spent       numeric := 0;
begin
  -- Verify the caller belongs to this home
  if p_home_id != public.get_user_home_id() then
    raise exception 'access denied';
  end if;

  -- Household income for the month
  select coalesce(combined_amount, 0)
  into v_income
  from public.household_income
  where home_id = p_home_id
    and date_trunc('month', month) = date_trunc('month', p_month)
  limit 1;

  -- Fixed costs = sum of active recurring bills
  select coalesce(sum(amount), 0)
  into v_fixed_costs
  from public.recurring_bills
  where home_id = p_home_id
    and is_active = true;

  -- Total spent this month from expenses
  select coalesce(sum(amount), 0)
  into v_total_spent
  from public.expenses
  where home_id = p_home_id
    and date_trunc('month', date::date) = date_trunc('month', p_month);

  -- Discretionary = total spent minus fixed costs (floored at 0)
  v_discretionary := greatest(v_total_spent - v_fixed_costs, 0);

  -- Surplus = income - total spent
  v_surplus := v_income - v_total_spent;

  -- Projected total based on current daily spend rate
  v_days_in_month := extract(day from (date_trunc('month', p_month) + interval '1 month - 1 day'))::integer;
  v_day_of_month  := extract(day from current_date)::integer;

  if v_day_of_month > 0 and date_trunc('month', current_date) = date_trunc('month', p_month) then
    v_projected_total := (v_total_spent / v_day_of_month) * v_days_in_month;
  else
    v_projected_total := v_total_spent;
  end if;

  -- Percentage of income spent (capped at 999 to avoid infinite display)
  if v_income > 0 then
    v_pct_spent := least((v_total_spent / v_income) * 100, 999);
  end if;

  return json_build_object(
    'income',          round(v_income, 2),
    'fixed_costs',     round(v_fixed_costs, 2),
    'discretionary',   round(v_discretionary, 2),
    'total_spent',     round(v_total_spent, 2),
    'surplus',         round(v_surplus, 2),
    'projected_total', round(v_projected_total, 2),
    'pct_spent',       round(v_pct_spent, 2)
  );
end;
$$;

grant execute on function public.get_monthly_summary(uuid, date) to authenticated;

-- ── Category normalisation trigger ────────────────────────────────────────────
-- Normalises the `category` field on expenses to a consistent casing/format
-- on every insert and update, so queries and grouping are reliable.

create or replace function public.normalise_expense_category()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.category is not null then
    -- Trim whitespace and apply title-case for consistent grouping
    new.category := initcap(trim(new.category));
  end if;
  return new;
end;
$$;

drop trigger if exists normalise_expense_category_on_insert on public.expenses;
create trigger normalise_expense_category_on_insert
  before insert on public.expenses
  for each row execute function public.normalise_expense_category();

drop trigger if exists normalise_expense_category_on_update on public.expenses;
create trigger normalise_expense_category_on_update
  before update of category on public.expenses
  for each row execute function public.normalise_expense_category();
