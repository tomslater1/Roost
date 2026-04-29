-- 0037_deprecate_categories.sql
--
-- The home_custom_categories table is deprecated as of this migration.
-- Categories are now derived exclusively from budget_template_lines where
-- budget_type = 'envelope'. This table is kept for data safety but should
-- no longer be written to by application code.
--
-- The app-level migration (useBudgetTemplate.migrate) already handles
-- copying existing budget rows into budget_template_lines on first load.
-- This SQL migration annotates the table and is idempotent.

comment on table home_custom_categories is
  'DEPRECATED: as of 0037. Categories are now derived from budget_template_lines (budget_type = ''envelope''). This table is retained for data safety only and is no longer written to by application code.';
