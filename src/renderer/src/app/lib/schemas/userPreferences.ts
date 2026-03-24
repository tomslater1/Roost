import { z } from 'zod'

export const userPreferencesSchema = z.object({
  user_id:     z.string().uuid(),
  week_starts: z.enum(['monday', 'sunday']),
  time_format: z.enum(['12h', '24h']),
  currency:    z.string(),
  date_format: z.string(),
  updated_at:  z.string().datetime({ offset: true }).optional(),
})

export type UserPreferences = z.infer<typeof userPreferencesSchema>

export function defaultUserPrefs(userId: string): UserPreferences {
  return {
    user_id:     userId,
    week_starts: 'monday',
    time_format: '12h',
    currency:    'GBP',
    date_format: 'DD/MM/YYYY',
  }
}
