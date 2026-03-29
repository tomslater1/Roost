import Stripe from 'npm:stripe@18.5.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const stripe = new Stripe(stripeSecretKey)
const supabase = createClient(supabaseUrl, serviceRoleKey)

function subscriptionToState(subscription: Stripe.Subscription) {
  return {
    subscription_status: subscription.status,
    subscription_tier: 'nest',
    stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    stripe_subscription_id: subscription.id,
    current_period_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
    stripe_price_id: subscription.items.data[0]?.price?.id ?? null,
    has_used_trial: true,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!stripeSecretKey || !stripeWebhookSecret || !supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Missing webhook env vars' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret)

    const existing = await supabase
      .from('subscription_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .maybeSingle()

    if (existing.data?.id) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let homeId: string | null = null
    let stripeCustomerId: string | null = null
    let stripeSubscriptionId: string | null = null

    if (event.type.startsWith('customer.subscription.')) {
      const subscription = event.data.object as Stripe.Subscription
      stripeCustomerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
      stripeSubscriptionId = subscription.id
      homeId = subscription.metadata.home_id || null

      if (!homeId && stripeCustomerId) {
        const lookup = await supabase.from('homes').select('id').eq('stripe_customer_id', stripeCustomerId).maybeSingle()
        homeId = lookup.data?.id ?? null
      }

      if (homeId) {
        await supabase.from('homes').update(subscriptionToState(subscription)).eq('id', homeId)
      }
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      homeId = session.metadata?.home_id ?? null
      stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null
      stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null

      if (homeId) {
        await supabase.from('homes').update({
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          subscription_status: session.mode === 'subscription' ? 'active' : 'free',
          subscription_tier: session.mode === 'subscription' ? 'nest' : 'free',
          has_used_trial: true,
        }).eq('id', homeId)
      }
    }

    await supabase.from('subscription_events').insert({
      home_id: homeId,
      stripe_event_id: event.id,
      event_type: event.type,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      payload: event as unknown as Record<string, unknown>,
    })

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})