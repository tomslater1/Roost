-- Add a stable per-home UUID used to authenticate the public iCal feed.
-- Apple Calendar doesn't send auth headers, so we use a secret token in the URL.
-- Each home gets a unique token generated automatically.
alter table homes add column if not exists calendar_token uuid not null default gen_random_uuid();
