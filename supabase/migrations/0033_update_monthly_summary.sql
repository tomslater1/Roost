-- migration 0033 — update get_monthly_summary to read from budgets table
--
-- Replaces recurring_bills as the source for fixed costs.
-- Now reads budgets WHERE budget_type = 'fixed' for fixed costs, and
-- budgets WHERE budget_type = 'envelope' for envelope totals.
--
-- New return fields:
--   fixed_costs            — sum of fixed budgets for the month
--   envelopes_total        — sum of envelope budgets for the month
--   total_budgeted         — fixed_costs + envelopes_total
--   actual_spend           — total expenses this month
--   surplus                — income - total_budgeted
--   projected_total        — projected spend at end of month + fixed costs
--   pct_of_income_budgeted — total_budgeted / income * 100
--   pct_spent              — actual_spend / total_budgeted * 100

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
  v_income                  numeric := 0;
  v_fixed                   numeric := 0;
  v_envelopes               numeric := 0;
  v_actual_spend            numeric := 0;
  v_total_budgeted          numeric := 0;
  v_surplus                 numeric := 0;
  v_days_elapsed            integer;
  v_days_in_month           integer;
  v_projected               numeric := 0;
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
    and month = date_trunc('month', p_month)::date;

  -- Fixed costs = sum of fixed-type budgets for this month
  select coalesce(sum(amount), 0)
  into v_fixed
  from public.budgets
  where home_id = p_home_id
    and budget_type = 'fixed'
    and month = date_trunc('month', p_month)::date;

  -- Envelopes = sum of envelope-type budgets for this month
  select coalesce(sum(amount), 0)
  into v_envelopes
  from public.budgets
  where home_id = p_home_id
    and budget_type = 'envelope'
    and month = date_trunc('month', p_month)::date;

  -- Actual spend = total expenses this month
  select coalesce(sum(amount), 0)
  into v_actual_spend
  from public.expenses
  where home_id = p_home_id
    and date >= date_trunc('month', p_month)
    and date < date_trunc('month', p_month) + interval '1 month';

  v_total_budgeted := v_fixed + v_envelopes;
  v_surplus        := v_income - v_total_budgeted;

  v_days_elapsed  := extract(day from current_date)::integer;
  v_days_in_month := extract(day from (
    date_trunc('month', p_month) + interval '1 month' - interval '1 day'
  )::date)::integer;

  if v_days_elapsed > 0 and v_days_in_month > 0
     and date_trunc('month', current_date) = date_trunc('month', p_month)
  then
    v_projected := (v_actual_spend / v_days_elapsed) * v_days_in_month + v_fixed;
  else
    v_projected := v_actual_spend + v_fixed;
  end if;

  return json_build_object(
    'income',                 round(v_income, 2),
    'fixed_costs',            round(v_fixed, 2),
    'envelopes_total',        round(v_envelopes, 2),
    'total_budgeted',         round(v_total_budgeted, 2),
    'actual_spend',           round(v_actual_spend, 2),
    'surplus',                round(v_surplus, 2),
    'projected_total',        round(v_projected, 2),
    'pct_of_income_budgeted', case when v_income > 0
                                then round((v_total_budgeted / v_income * 100)::numeric, 1)
                              else 0 end,
    'pct_spent',              case when v_total_budgeted > 0
                                then round((v_actual_spend / v_total_budgeted * 100)::numeric, 1)
                              else 0 end
  );
end;
$$;

grant execute on function public.get_monthly_summary(uuid, date) to authenticated;
