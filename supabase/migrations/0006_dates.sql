-- Add a "next shop" date to the homes table.
-- Both partners can see and update it; existing homes default to null (not set).
alter table homes add column if not exists next_shop_date date;
