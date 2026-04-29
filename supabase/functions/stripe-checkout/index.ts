import Stripe from 'npm:stripe@18.5.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '')
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

function allowedWebsiteOrigins() {
  return [
    Deno.env.get('SITE_URL'),
    Deno.env.get('WEBSITE_URL'),
    Deno.env.get('PUBLIC_SITE_URL'),
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean) as string[]
}

function resolveCheckoutUrls(returnUrl?: string) {
  const fallback = {
    successUrl: 'roost://subscription/success',
    cancelUrl: 'roost://subscription/cancel',
  }

  if (!returnUrl) return fallback
  if (returnUrl.startsWith('roost://subscription/')) {
    return { successUrl: returnUrl, cancelUrl: 'roost://subscription/cancel' }
  }

  try {
    const url = new URL(returnUrl)
    const allowed = allowedWebsiteOrigins().some((origin) => {
      try {
        return new URL(origin).origin === url.origin
      } catch {
        return false
      }
    })
    if (!allowed) return fallback

    const cancelUrl = new URL(url.toString())
    cancelUrl.searchParams.set('checkout', 'cancelled')
    return {
      successUrl: url.toString(),
      cancelUrl: cancelUrl.toString(),
    }
  } catch {
    return fallback
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Verify the caller is a signed-in Roost user
    const jwt = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!jwt) return error(401, 'Unauthorised')

    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    if (authError || !user) return error(401, 'Unauthorised')

    const { plan, homeId, customerEmail, returnUrl } = await req.json() as {
      plan: 'monthly' | 'annual'
      homeId: string
      customerEmail: string
      returnUrl?: string
    }

    if (!plan || !homeId || !customerEmail) return error(400, 'Missing plan, homeId or customerEmail')
    if (plan !== 'monthly' && plan !== 'annual') return error(400, 'plan must be monthly or annual')

    // Resolve the price ID from server-side env — never trust the client for this
    const priceId = plan === 'monthly'
      ? Deno.env.get('STRIPE_MONTHLY_PRICE_ID') ?? ''
      : Deno.env.get('STRIPE_ANNUAL_PRICE_ID') ?? ''

    if (!priceId) return error(500, `STRIPE_${plan.toUpperCase()}_PRICE_ID is not set`)

    // Look up existing Stripe customer for this home
    const { data: home } = await supabase
      .from('homes')
      .select('stripe_customer_id, has_used_trial')
      .eq('id', homeId)
      .single()

    if (!home) return error(404, 'Home not found')

    const checkoutUrls = resolveCheckoutUrls(returnUrl)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer: home.stripe_customer_id || undefined,
      customer_email: home.stripe_customer_id ? undefined : customerEmail,
      success_url: checkoutUrls.successUrl,
      cancel_url: checkoutUrls.cancelUrl,
      allow_promotion_codes: true,
      metadata: { home_id: homeId },
      subscription_data: {
        metadata: { home_id: homeId },
        ...(home.has_used_trial ? {} : { trial_period_days: 14 }),
      },
    })

    return json({ url: session.url })
  } catch (e) {
    return error(500, e instanceof Error ? e.message : 'Unknown error')
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function error(status: number, message: string) {
  return json({ error: message }, status)
}
