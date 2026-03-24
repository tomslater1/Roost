-- User preferences (personal, per-user)
CREATE TABLE user_preferences (
  user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  week_starts  TEXT        NOT NULL DEFAULT 'monday'       CHECK (week_starts IN ('monday', 'sunday')),
  time_format  TEXT        NOT NULL DEFAULT '12h'          CHECK (time_format  IN ('12h', '24h')),
  currency     TEXT        NOT NULL DEFAULT 'GBP',
  date_format  TEXT        NOT NULL DEFAULT 'DD/MM/YYYY',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences"
  ON user_preferences FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
