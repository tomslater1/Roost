-- Track when the calendar feed was last fetched by Apple Calendar (or any subscriber).
-- This is the source of truth for whether the subscription is active in the app UI.
ALTER TABLE homes ADD COLUMN IF NOT EXISTS calendar_last_fetched_at TIMESTAMPTZ;
