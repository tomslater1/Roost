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

function resolvePortalReturnUrl(returnUrl?: string) {
  const fallback = 'roost://subscription/success'

  if (!returnUrl) return fallback
  if (returnUrl.startsWith('roost://subscription/')) return returnUrl

  try {
    const url = new URL(returnUrl)
    const allowed = allowedWebsiteOrigins().some((origin) => {
      try {
        return new URL(origin).origin === url.origin
      } catch {
        return false
      }
    })
    return allowed ? url.toString() : fallback
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

    const { homeId, returnUrl } = await req.json() as { homeId: string; returnUrl?: string }
    if (!homeId) return error(400, 'Missing homeId')

    // Look up the Stripe customer ID for this home
    const { data: home } = await supabase
      .from('homes')
      .select('stripe_customer_id')
      .eq('id', homeId)
      .single()

    if (!home?.stripe_customer_id) return error(400, 'No Stripe customer found for this home')

    const session = await stripe.billingPortal.sessions.create({
      customer: home.stripe_customer_id,
      return_url: resolvePortalReturnUrl(returnUrl),
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
