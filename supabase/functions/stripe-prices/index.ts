import Stripe from 'npm:stripe@18.5.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const monthlyId = Deno.env.get('STRIPE_MONTHLY_PRICE_ID') ?? ''
    const annualId = Deno.env.get('STRIPE_ANNUAL_PRICE_ID') ?? ''

    if (!monthlyId || !annualId) return error(500, 'Price IDs not configured')

    const [monthly, annual] = await Promise.all([
      stripe.prices.retrieve(monthlyId),
      stripe.prices.retrieve(annualId),
    ])

    return json({
      monthly: {
        id: monthly.id,
        unitAmount: monthly.unit_amount ?? 499,
        currency: monthly.currency,
        interval: monthly.recurring?.interval ?? 'month',
        formattedAmount: formatAmount(monthly.unit_amount, monthly.currency),
        trialDays: 14,
      },
      annual: {
        id: annual.id,
        unitAmount: annual.unit_amount ?? 3999,
        currency: annual.currency,
        interval: annual.recurring?.interval ?? 'year',
        formattedAmount: formatAmount(annual.unit_amount, annual.currency),
        trialDays: 14,
      },
    })
  } catch (e) {
    return error(500, e instanceof Error ? e.message : 'Unknown error')
  }
})

function formatAmount(unitAmount: number | null, currency: string): string {
  const amount = (unitAmount ?? 0) / 100
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: currency.toUpperCase() }).format(amount)
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function error(status: number, message: string) {
  return json({ error: message }, status)
}
