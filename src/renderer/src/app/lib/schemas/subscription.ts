import { z } from 'zod'

export const subscriptionStatusSchema = z.enum([
  'free',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'lifetime',
])

export const subscriptionTierSchema = z.enum(['free', 'nest'])

export const homeSubscriptionSchema = z.object({
  subscription_status: subscriptionStatusSchema.optional(),
  subscription_tier: subscriptionTierSchema.optional(),
  trial_ends_at: z.string().datetime({ offset: true }).nullable().optional(),
  stripe_customer_id: z.string().nullable().optional(),
  stripe_subscription_id: z.string().nullable().optional(),
  current_period_ends_at: z.string().datetime({ offset: true }).nullable().optional(),
  stripe_price_id: z.string().nullable().optional(),
  has_used_trial: z.boolean().optional(),
})

export const subscriptionEventSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid().nullable(),
  stripe_event_id: z.string().min(1),
  event_type: z.string().min(1),
  stripe_customer_id: z.string().nullable().optional(),
  stripe_subscription_id: z.string().nullable().optional(),
  payload: z.record(z.string(), z.unknown()).or(z.array(z.unknown())),
  processed_at: z.string().datetime({ offset: true }).nullable().optional(),
})

export const checkoutSessionSchema = z.object({
  url: z.string().url(),
})

export const portalSessionSchema = z.object({
  url: z.string().url(),
})

export const stripePriceSchema = z.object({
  id: z.string(),
  unitAmount: z.number().nonnegative(),
  currency: z.string(),
  interval: z.enum(['month', 'year']),
  formattedAmount: z.string(),
  trialDays: z.number().int().nonnegative(),
})

export const stripePricesResponseSchema = z.object({
  monthly: stripePriceSchema,
  annual: stripePriceSchema,
})

export const promoCodeSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  description: z.string().nullable(),
  type: z.literal('lifetime_nest'),
  max_redemptions: z.number(),
  redemption_count: z.number(),
  redeemed_by_home_id: z.string().uuid().nullable(),
  redeemed_at: z.string().datetime({ offset: true }).nullable(),
  created_at: z.string().datetime({ offset: true }),
  expires_at: z.string().datetime({ offset: true }).nullable(),
})

export const promoRedeemErrorSchema = z.enum([
  'not_found',
  'already_redeemed',
  'expired',
  'already_have_lifetime',
  'server_error',
])

export const promoRedeemResponseSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), message: z.string() }),
  z.object({ success: z.literal(false), error: promoRedeemErrorSchema }),
])

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>
export type SubscriptionTier = z.infer<typeof subscriptionTierSchema>
export type HomeSubscription = z.infer<typeof homeSubscriptionSchema>
export type SubscriptionEvent = z.infer<typeof subscriptionEventSchema>
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>
export type PortalSession = z.infer<typeof portalSessionSchema>
export type StripePrice = z.infer<typeof stripePriceSchema>
export type StripePricesResponse = z.infer<typeof stripePricesResponseSchema>
export type PromoCode = z.infer<typeof promoCodeSchema>
export type PromoRedeemResponse = z.infer<typeof promoRedeemResponseSchema>
export type PromoRedeemError = z.infer<typeof promoRedeemErrorSchema>

export type NestFeature =
  | 'expense_history'
  | 'budget_insights'
  | 'chore_recurrence'
  | 'calendar_sync'
  | 'hazel_categorisation'
  | 'hazel_budget_insights'