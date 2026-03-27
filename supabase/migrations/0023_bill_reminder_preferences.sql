-- Bill reminder notification preference
alter table notification_preferences
  add column if not exists bill_reminders_enabled boolean not null default true;
