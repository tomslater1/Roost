import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'server_error' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    const accessToken = String(body?.access_token ?? '').trim()
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error('Missing required env vars for redeem-promo')
      return new Response(JSON.stringify({ success: false, error: 'server_error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!accessToken) {
      return new Response(JSON.stringify({ success: false, error: 'server_error' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    })

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser()

    if (authError || !user) {
      console.error('Auth verification failed in redeem-promo:', authError?.message)
      return new Response(JSON.stringify({ success: false, error: 'server_error' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    const rawCode = String(body.code ?? '').trim().toUpperCase()
    const homeId = String(body.home_id ?? '').trim()

    if (!rawCode || !homeId) {
      return new Response(JSON.stringify({ success: false, error: 'not_found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: membership } = await serviceClient
      .from('home_members')
      .select('home_id')
      .eq('user_id', user.id)
      .eq('home_id', homeId)
      .maybeSingle()

    if (!membership) {
      console.error('Membership check failed in redeem-promo for user/home', user.id, homeId)
      return new Response(JSON.stringify({ success: false, error: 'server_error' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: home } = await serviceClient
      .from('homes')
      .select('subscription_status')
      .eq('id', homeId)
      .maybeSingle()

    if (home?.subscription_status === 'lifetime') {
      return new Response(JSON.stringify({ success: false, error: 'already_have_lifetime' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: promoCode } = await serviceClient
      .from('promo_codes')
      .select('*')
      .eq('code', rawCode)
      .maybeSingle()

    if (!promoCode) {
      return new Response(JSON.stringify({ success: false, error: 'not_found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (promoCode.redemption_count >= promoCode.max_redemptions) {
      return new Response(JSON.stringify({ success: false, error: 'already_redeemed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return new Response(JSON.stringify({ success: false, error: 'expired' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: homeUpdateError } = await serviceClient
      .from('homes')
      .update({
        subscription_status: 'lifetime',
        subscription_tier: 'nest',
      })
      .eq('id', homeId)

    if (homeUpdateError) {
      console.error('Home update error:', homeUpdateError)
      return new Response(JSON.stringify({ success: false, error: 'server_error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { error: codeUpdateError } = await serviceClient
      .from('promo_codes')
      .update({
        redemption_count: promoCode.redemption_count + 1,
        redeemed_by_home_id: homeId,
        redeemed_at: new Date().toISOString(),
      })
      .eq('id', promoCode.id)

    if (codeUpdateError) {
      console.error('Code update error:', codeUpdateError)
    }

    return new Response(JSON.stringify({ success: true, message: 'Welcome to Roost Nest' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Unhandled error:', error)
    return new Response(JSON.stringify({ success: false, error: 'server_error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})