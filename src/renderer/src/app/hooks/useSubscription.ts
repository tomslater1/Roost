import { useMemo } from 'react'
import { differenceInCalendarDays } from 'date-fns'
import { useHome } from './useHome'
import type { NestFeature, SubscriptionStatus, SubscriptionTier } from '@/lib/schemas/subscription'

const NEST_FEATURES: NestFeature[] = [
  'expense_history',
  'budget_insights',
  'chore_recurrence',
  'calendar_sync',
  'hazel_categorisation',
  'hazel_budget_insights',
]

export function useSubscription() {
  const { home } = useHome()

  const status = (home?.subscription_status ?? 'free') as SubscriptionStatus
  const tier = (home?.subscription_tier ?? 'free') as SubscriptionTier

  const trialEnds = home?.trial_ends_at ? new Date(home.trial_ends_at) : null
  const currentPeriodEnds = home?.current_period_ends_at ? new Date(home.current_period_ends_at) : null
  const now = new Date()

  const isTrial = status === 'trialing' && !!trialEnds && trialEnds.getTime() > now.getTime()
  const trialDaysLeft = isTrial && trialEnds
    ? Math.max(differenceInCalendarDays(trialEnds, now), 0)
    : 0

  const isNest = useMemo(() => {
    if (status === 'active') return true
    if (status === 'lifetime') return true
    if (status === 'trialing') return !!trialEnds && trialEnds.getTime() > now.getTime()
    return false
  }, [status, trialEnds, now])

  const isLifetime = status === 'lifetime'

  const isExpired = useMemo(() => {
    if (status === 'free') return !!home?.has_used_trial
    if (status === 'trialing') return !!trialEnds && trialEnds.getTime() <= now.getTime()
    if (status === 'canceled') return !!currentPeriodEnds && currentPeriodEnds.getTime() <= now.getTime()
    return false
  }, [status, home?.has_used_trial, trialEnds, currentPeriodEnds, now])

  const canAccess = (feature: NestFeature) => {
    if (!NEST_FEATURES.includes(feature)) return false
    if (isLifetime) return true

    switch (feature) {
      case 'expense_history':
      case 'budget_insights':
      case 'chore_recurrence':
      case 'calendar_sync':
      case 'hazel_categorisation':
      case 'hazel_budget_insights':
        return isNest && tier === 'nest'
      default:
        return false
    }
  }

  return {
    isNest,
    isTrial,
    isLifetime,
    trialDaysLeft,
    isExpired,
    status,
    tier,
    trialEndsAt: trialEnds,
    currentPeriodEnds,
    stripeCustomerId: home?.stripe_customer_id ?? null,
    stripePriceId: home?.stripe_price_id ?? null,
    hasUsedTrial: !!home?.has_used_trial,
    canAccess,
  }
}