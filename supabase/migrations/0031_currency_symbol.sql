-- Add currency_symbol column to homes table
-- Stores ISO 4217 currency code (e.g. 'GBP', 'USD', 'EUR')
-- Defaults to GBP (British Pound) to match the app's original currency
alter table homes
  add column if not exists currency_symbol text not null default 'GBP';
