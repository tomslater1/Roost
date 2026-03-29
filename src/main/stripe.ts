import Stripe from 'stripe'

let client: Stripe | null = null

function getRequiredEnv(name: string): string {
  const value = import.meta.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

export function getStripeClient() {
  const secretKey = getRequiredEnv('MAIN_VITE_STRIPE_SECRET_KEY')
  if (!client) {
    client = new Stripe(secretKey)
  }
  return client
}

export function getStripePriceIds() {
  return {
    monthly: (import.meta.env.MAIN_VITE_STRIPE_MONTHLY_PRICE_ID || '').trim(),
    annual: (import.meta.env.MAIN_VITE_STRIPE_ANNUAL_PRICE_ID || '').trim(),
  }
}

export function isStripePriceId(value: string) {
  return value.startsWith('price_')
}

export function resolveStripePlan(priceId: string) {
  const ids = getStripePriceIds()
  const normalized = priceId.trim().toLowerCase()

  if (
    normalized === ids.annual.toLowerCase() ||
    normalized === 'annual' ||
    normalized === '39.99' ||
    normalized === '3999'
  ) {
    return {
      label: 'annual',
      unitAmount: 3999,
      interval: 'year' as const,
      lookupId: ids.annual,
    }
  }

  return {
    label: 'monthly',
    unitAmount: 499,
    interval: 'month' as const,
    lookupId: ids.monthly,
  }
}

export function formatAmount(unitAmount: number | null | undefined, currency: string) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format((unitAmount ?? 0) / 100)
}