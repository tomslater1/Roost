-- migration 0034 — permanent budget template lines
--
-- Creates budget_template_lines: a home's permanent financial plan.
-- Lines are NOT monthly — they roll forward every month automatically.
-- The month navigator on the Budgets screen overlays actual spend data
-- from the expenses table on top of this permanent template.
--
-- budget_type: 'fixed' (committed cost, e.g. rent) | 'envelope' (allowance)
-- section_group: the UI section the line belongs to
--   fixed:    'housing-bills' | 'subscriptions-leisure' | 'transport'
--   envelope: 'food-drink' | 'household' | 'personal' | 'savings'

create table if not exists public.budget_template_lines (
  id           uuid         primary key default gen_random_uuid(),
  home_id      uuid         references public.homes(id) on delete cascade not null,
  name         text         not null,
  amount       numeric(10,2) not null check (amount >= 0),
  budget_type  text         not null default 'envelope'
                              check (budget_type in ('fixed', 'envelope')),
  section_group text        not null,
  day_of_month integer      check (day_of_month between 1 and 31),
  note         text,
  is_active    boolean      not null default true,
  sort_order   integer      default 0,
  created_at   timestamptz  default now(),
  updated_at   timestamptz  default now()
);

alter table public.budget_template_lines enable row level security;

create policy "home members can select budget_template_lines"
  on public.budget_template_lines for select
  using (home_id = public.get_user_home_id());

create policy "home members can insert budget_template_lines"
  on public.budget_template_lines for insert
  with check (home_id = public.get_user_home_id());

create policy "home members can update budget_template_lines"
  on public.budget_template_lines for update
  using (home_id = public.get_user_home_id());

create policy "home members can delete budget_template_lines"
  on public.budget_template_lines for delete
  using (home_id = public.get_user_home_id());

-- Trigger to auto-update updated_at on row change
create or replace function public.set_budget_template_lines_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger budget_template_lines_updated_at
  before update on public.budget_template_lines
  for each row execute function public.set_budget_template_lines_updated_at();

-- Enable realtime for live sync between partners
alter publication supabase_realtime add table public.budget_template_lines;
