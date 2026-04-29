import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Admin-only endpoint to generate Roost Pro gift codes.
 * Protected by SUPABASE_SERVICE_ROLE_KEY in the Authorization header.
 *
 * POST /functions/v1/generate-promo-code
 * Headers: Authorization: Bearer <service_role_key>
 *
 * Body:
 * {
 *   "type": "lifetime_nest" | "timed_nest",          // required
 *   "grants_access_days": 7 | 30 | 365 | null,       // required for timed_nest
 *   "count": 1,                                       // optional, default 1, max 100
 *   "prefix": "ROOST",                               // optional, default "ROOST"
 *   "description": "Beta tester gift",               // optional
 *   "max_redemptions": 1,                            // optional, default 1
 *   "expires_at": "2026-12-31T00:00:00Z" | null      // optional, default null
 * }
 *
 * Example (lifetime):
 *   curl -X POST https://<project>.supabase.co/functions/v1/generate-promo-code \
 *     -H "Authorization: Bearer <service_role_key>" \
 *     -H "Content-Type: application/json" \
 *     -d '{"type":"lifetime_nest","count":5,"description":"Beta tester gift"}'
 *
 * Example (1 month):
 *   curl -X POST https://<project>.supabase.co/functions/v1/generate-promo-code \
 *     -H "Authorization: Bearer <service_role_key>" \
 *     -H "Content-Type: application/json" \
 *     -d '{"type":"timed_nest","grants_access_days":30,"count":3,"description":"Influencer trial"}'
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_SEGMENT_LENGTH = 4
const CODE_SEGMENTS = 3

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateCode(prefix: string): string {
  const segments: string[] = []
  for (let s = 0; s < CODE_SEGMENTS; s++) {
    let segment = ''
    for (let i = 0; i < CODE_SEGMENT_LENGTH; i++) {
      segment += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
    }
    segments.push(segment)
  }
  return `${prefix}-${segments.join('-')}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Authenticate — must be called with the service role key
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  if (token !== serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const type = String(body.type ?? '').trim()
  if (type !== 'lifetime_nest' && type !== 'timed_nest') {
    return new Response(JSON.stringify({ error: 'type must be "lifetime_nest" or "timed_nest"' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const grantsAccessDays = body.grants_access_days != null ? Number(body.grants_access_days) : null
  if (type === 'timed_nest' && (grantsAccessDays == null || isNaN(grantsAccessDays) || grantsAccessDays < 1)) {
    return new Response(JSON.stringify({ error: 'grants_access_days is required for timed_nest and must be >= 1' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const count = Math.min(Math.max(Number(body.count ?? 1), 1), 100)
  const prefix = String(body.prefix ?? 'ROOST').toUpperCase().trim() || 'ROOST'
  const description = body.description ? String(body.description).trim() : null
  const maxRedemptions = Math.max(Number(body.max_redemptions ?? 1), 1)
  const expiresAt = body.expires_at ? String(body.expires_at) : null

  const db = createClient(supabaseUrl, serviceRoleKey)
  const created: unknown[] = []

  for (let i = 0; i < count; i++) {
    let code = ''
    let attempts = 0
    let inserted = false

    while (!inserted && attempts < 10) {
      code = generateCode(prefix)
      attempts++

      const { data, error } = await db
        .from('promo_codes')
        .insert({
          code,
          type,
          grants_access_days: type === 'lifetime_nest' ? null : grantsAccessDays,
          description,
          max_redemptions: maxRedemptions,
          expires_at: expiresAt,
        })
        .select('id, code, type, grants_access_days, max_redemptions, expires_at, created_at')
        .single()

      if (!error && data) {
        created.push(data)
        inserted = true
      } else if (error?.code === '23505') {
        // Unique constraint violation — regenerate
        continue
      } else {
        console.error('Insert error:', error)
        break
      }
    }
  }

  return new Response(JSON.stringify({ codes: created, count: created.length }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
