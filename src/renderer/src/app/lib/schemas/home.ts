import { z } from 'zod'
import { homeSubscriptionSchema } from '@/lib/schemas/subscription'

export const homeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Home name is required').max(100),
  invite_code: z.string().length(8),
  // Optional — added in migration 0004. App degrades gracefully if not yet applied.
  calendar_token: z.string().uuid().optional(),
  // Optional — added in migration 0006. App degrades gracefully if not yet applied.
  next_shop_date: z.string().nullable().optional(), // YYYY-MM-DD
  // Optional — added in migration 0016. Null means never fetched (no active subscription).
  calendar_last_fetched_at: z.string().datetime({ offset: true }).nullable().optional(),
  // Optional — added in migration 0031. ISO 4217 currency code. Defaults to GBP.
  currency_symbol: z.string().optional().default('GBP'),
  created_at: z.string().datetime({ offset: true }),
  // Optional — added in migration 0036. Money settings. Defaults below match DB defaults.
  default_expense_split: z.number().min(0).max(100).optional().default(50),
  budget_carry_forward: z.enum(['auto', 'manual']).optional().default('auto'),
  scramble_mode: z.boolean().optional().default(false),
  overspend_alert_threshold: z.number().int().min(50).max(100).optional().default(80),
}).extend(homeSubscriptionSchema.shape)

export const homeMemberSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(['owner', 'member']),
  display_name: z.string().nullable().optional(),
  avatar_color: z.string().default('#7F77DD'),
  // Optional — added in migration 0011. Null = show first letter of display name.
  // App degrades gracefully if the column is not yet applied.
  avatar_icon: z.string().nullable().optional(),
  joined_at: z.string().datetime({ offset: true }),
  // Optional — added in migration 0036. Personal income & sharing consent.
  personal_income: z.number().nullable().optional(),
  income_visible_to_partner: z.boolean().optional().default(false),
  income_set_at: z.string().nullable().optional(),
})

export const updateHomeMemberSchema = homeMemberSchema.pick({
  display_name: true,
  avatar_color: true,
  avatar_icon: true,
})

export type Home = z.infer<typeof homeSchema>
export type HomeMember = z.infer<typeof homeMemberSchema>
export type UpdateHomeMember = z.infer<typeof updateHomeMemberSchema>
