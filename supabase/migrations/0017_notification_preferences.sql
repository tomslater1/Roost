-- Per-user notification preferences.
-- One row per user (user_id is the PK). The app upserts on first change.
-- Defaults mean all notifications are on, which preserves existing behaviour
-- for users who have never visited the Notifications settings page.

CREATE TABLE notification_preferences (
  user_id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Channel toggles
  in_app_enabled       BOOLEAN NOT NULL DEFAULT true,
  macos_enabled        BOOLEAN NOT NULL DEFAULT true,

  -- Per-type toggles (apply to all active channels)
  chores_enabled       BOOLEAN NOT NULL DEFAULT true,
  expenses_enabled     BOOLEAN NOT NULL DEFAULT true,
  shopping_enabled     BOOLEAN NOT NULL DEFAULT true,
  settlements_enabled  BOOLEAN NOT NULL DEFAULT true,

  -- Quiet hours (suppresses macOS notifications only)
  quiet_hours_enabled  BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start    TEXT    NOT NULL DEFAULT '22:00',  -- HH:MM
  quiet_hours_end      TEXT    NOT NULL DEFAULT '08:00',  -- HH:MM

  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own notification prefs"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
