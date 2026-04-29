import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * RevenueCat Webhook Handler
 *
 * Handles RevenueCat subscription events and updates the homes table.
 * RevenueCat app_user_id is set to the Supabase auth.users.id string.
 *
 * Option A (first subscriber wins): if a home already has a subscription_owner_user_id,
 * only that user's events can update the home's subscription status.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const webhookAuthKey = Deno.env.get('REVENUECAT_WEBHOOK_AUTH_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing required env vars for revenuecat-webhook')
    return new Response('Server error', { status: 500, headers: corsHeaders })
  }

  // Verify RevenueCat webhook auth header if configured
  if (webhookAuthKey) {
    const authHeader = req.headers.get('Authorization')
    if (authHeader !== webhookAuthKey) {
      console.error('Invalid webhook auth header')
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders })
  }

  const event = body?.event as Record<string, unknown> | undefined
  if (!event) {
    return new Response('Missing event', { status: 400, headers: corsHeaders })
  }

  const eventType = String(event.type ?? '')
  const appUserId = String(event.app_user_id ?? '').trim()
  const periodType = String(event.period_type ?? 'NORMAL')
  const expirationAtMs = event.expiration_at_ms as number | undefined

  if (!appUserId) {
    console.error('Missing app_user_id in RevenueCat event')
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  console.log(`RevenueCat webhook: ${eventType} for user ${appUserId}`)

  const db = createClient(supabaseUrl, serviceRoleKey)

  // Find the home this user belongs to
  const { data: membership } = await db
    .from('home_members')
    .select('home_id')
    .eq('user_id', appUserId)
    .maybeSingle()

  if (!membership) {
    // User has no home — log and return success (might be pre-home-join purchase)
    console.log(`No home found for user ${appUserId}, ignoring ${eventType}`)
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  const homeId = membership.home_id

  // Fetch current home subscription state
  const { data: home } = await db
    .from('homes')
    .select('subscription_status, subscription_owner_user_id')
    .eq('id', homeId)
    .maybeSingle()

  if (!home) {
    console.error(`Home ${homeId} not found`)
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  const existingOwner = home.subscription_owner_user_id
  const currentStatus = home.subscription_status

  // Option A: if there's already an owner and it's not this user, ignore their events
  // (except EXPIRATION for the owner which is handled below)
  if (existingOwner && existingOwner !== appUserId) {
    console.log(`Home ${homeId} already has owner ${existingOwner}, ignoring ${eventType} for user ${appUserId}`)
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  // Don't overwrite lifetime access via RevenueCat events
  if (currentStatus === 'lifetime') {
    console.log(`Home ${homeId} has lifetime access, ignoring ${eventType}`)
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  const expirationDate = expirationAtMs ? new Date(expirationAtMs).toISOString() : null

  let homeUpdate: Record<string, unknown> = {}

  switch (eventType) {
    case 'INITIAL_PURCHASE': {
      // period_type = "TRIAL" for trial starts, "NORMAL" for direct purchase
      const isTrial = periodType === 'TRIAL'
      homeUpdate = {
        subscription_status: isTrial ? 'trialing' : 'active',
        subscription_tier: 'nest',
        subscription_owner_user_id: appUserId,
        has_used_trial: true,
        ...(isTrial
          ? { trial_ends_at: expirationDate, current_period_ends_at: null }
          : { current_period_ends_at: expirationDate, trial_ends_at: null }),
      }
      break
    }

    case 'RENEWAL': {
      homeUpdate = {
        subscription_status: 'active',
        subscription_tier: 'nest',
        current_period_ends_at: expirationDate,
        has_used_trial: true,
      }
      break
    }

    case 'UNCANCELLATION': {
      homeUpdate = {
        subscription_status: 'active',
        current_period_ends_at: expirationDate,
      }
      break
    }

    case 'BILLING_ISSUE': {
      homeUpdate = {
        subscription_status: 'past_due',
      }
      break
    }

    case 'EXPIRATION': {
      // Only downgrade if this user is the current owner
      if (existingOwner === appUserId || !existingOwner) {
        homeUpdate = {
          subscription_status: 'free',
          subscription_tier: 'free',
          subscription_owner_user_id: null,
          current_period_ends_at: null,
          trial_ends_at: null,
        }
      }
      break
    }

    case 'PRODUCT_CHANGE': {
      // Update period end date on plan change
      homeUpdate = {
        subscription_status: 'active',
        current_period_ends_at: expirationDate,
      }
      break
    }

    default:
      // CANCELLATION, SUBSCRIBER_ALIAS, etc. — no home update needed
      console.log(`Unhandled RevenueCat event type: ${eventType}`)
      return new Response('ok', { status: 200, headers: corsHeaders })
  }

  if (Object.keys(homeUpdate).length > 0) {
    const { error } = await db.from('homes').update(homeUpdate).eq('id', homeId)
    if (error) {
      console.error(`Failed to update home ${homeId} for ${eventType}:`, error)
      return new Response('Server error', { status: 500, headers: corsHeaders })
    }
    console.log(`Updated home ${homeId} for ${eventType}:`, homeUpdate)
  }

  return new Response('ok', { status: 200, headers: corsHeaders })
})
