import { z } from 'zod'

export const notificationSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  user_id: z.string().uuid(),
  actor_id: z.string().uuid().nullable().optional(),
  type: z.string(),
  title: z.string(),
  entity_id: z.string().uuid().nullable().optional(),
  read: z.boolean(),
  created_at: z.string().datetime({ offset: true }),
})

// Use AppNotification to avoid clashing with the browser's global Notification class
export type AppNotification = z.infer<typeof notificationSchema>

// ── Notification preferences ───────────────────────────────────────────────

export const notificationPrefsSchema = z.object({
  user_id: z.string(),
  in_app_enabled: z.boolean().default(true),
  macos_enabled: z.boolean().default(true),
  chores_enabled: z.boolean().default(true),
  expenses_enabled: z.boolean().default(true),
  shopping_enabled: z.boolean().default(true),
  settlements_enabled: z.boolean().default(true),
  quiet_hours_enabled: z.boolean().default(false),
  quiet_hours_start: z.string().default('22:00'),
  quiet_hours_end: z.string().default('08:00'),
})

export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>

export function defaultPrefs(userId: string): NotificationPrefs {
  return notificationPrefsSchema.parse({ user_id: userId })
}
