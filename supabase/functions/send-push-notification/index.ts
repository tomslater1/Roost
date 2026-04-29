import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Sends an APNs push notification to all registered devices for a user.
 *
 * Required Supabase secrets (set via Dashboard → Settings → Secrets):
 *   APNS_KEY_P8   — full content of the .p8 file downloaded from Apple Developer Portal
 *   APNS_KEY_ID   — the 10-character Key ID shown next to the .p8 download link
 *   APNS_TEAM_ID  — your Apple Developer Team ID (shown top-right in the portal)
 *   APNS_BUNDLE_ID — your app's bundle identifier, e.g. com.roostapp.ios
 *
 * Optional:
 *   APNS_SANDBOX  — set to "true" to use the sandbox endpoint (Xcode debug builds only)
 *                   Leave unset or "false" for TestFlight and App Store builds.
 *
 * This function is called by a Supabase Database Webhook on notifications INSERT.
 * To set up the webhook:
 *   Dashboard → Database → Webhooks → Create webhook
 *   Table: notifications | Event: INSERT | URL: .../functions/v1/send-push-notification
 *   HTTP headers: Authorization: Bearer <service_role_key>
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── APNs JWT helpers ───────────────────────────────────────────────────────────

function pemToDer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/-----BEGIN EC PRIVATE KEY-----/g, '')
    .replace(/-----END EC PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')
  const binaryStr = atob(base64)
  const bytes = new Uint8Array(binaryStr.length)
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i)
  }
  return bytes.buffer
}

function base64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function textToBase64url(text: string): string {
  return base64url(new TextEncoder().encode(text).buffer)
}

async function buildApnsJwt(keyPem: string, keyId: string, teamId: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(keyPem),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )

  const header = textToBase64url(JSON.stringify({ alg: 'ES256', kid: keyId }))
  const payload = textToBase64url(JSON.stringify({ iss: teamId, iat: Math.floor(Date.now() / 1000) }))
  const signingInput = `${header}.${payload}`

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput)
  )

  return `${signingInput}.${base64url(signature)}`
}

// ── Push delivery ──────────────────────────────────────────────────────────────

async function sendToDevice(
  deviceToken: string,
  jwt: string,
  bundleId: string,
  sandbox: boolean,
  payload: Record<string, unknown>
): Promise<{ token: string; success: boolean; status: number }> {
  const host = sandbox
    ? 'https://api.sandbox.push.apple.com'
    : 'https://api.push.apple.com'

  const url = `${host}/3/device/${deviceToken}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `bearer ${jwt}`,
      'apns-topic': bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error(`APNs error for token ${deviceToken.slice(-8)}: ${response.status} ${body}`)
  }

  return { token: deviceToken, success: response.ok, status: response.status }
}

// ── Main handler ───────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  // Validate the service role key so only trusted callers can invoke this
  const webhookAuthKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const authHeader = req.headers.get('Authorization')
  if (webhookAuthKey && authHeader !== `Bearer ${webhookAuthKey}`) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  // APNs configuration from secrets
  const keyPem    = Deno.env.get('APNS_KEY_P8')
  const keyId     = Deno.env.get('APNS_KEY_ID')
  const teamId    = Deno.env.get('APNS_TEAM_ID')
  const bundleId  = Deno.env.get('APNS_BUNDLE_ID')
  const sandbox   = Deno.env.get('APNS_SANDBOX') === 'true'

  if (!keyPem || !keyId || !teamId || !bundleId) {
    console.error('Missing APNs configuration. Set APNS_KEY_P8, APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID in Supabase secrets.')
    return new Response('APNs not configured', { status: 500, headers: corsHeaders })
  }

  // The body is the Database Webhook payload: { type, table, schema, record, old_record }
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders })
  }

  // Support both direct calls ({ user_id, title, type }) and DB webhook payloads ({ record: { ... } })
  const record = (body.record as Record<string, unknown>) ?? body
  const userId      = String(record.user_id ?? '')
  const title       = String(record.title ?? 'Roost update')
  const type        = String(record.type ?? '')

  if (!userId) {
    return new Response('Missing user_id', { status: 400, headers: corsHeaders })
  }

  const supabaseUrl      = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const db = createClient(supabaseUrl, serviceRoleKey)

  // Fetch all device tokens for this user
  const { data: tokens, error: tokensError } = await db
    .from('device_tokens')
    .select('token')
    .eq('user_id', userId)
    .eq('platform', 'ios')

  if (tokensError || !tokens?.length) {
    console.log(`No device tokens for user ${userId}`)
    return new Response('ok', { status: 200, headers: corsHeaders })
  }

  // Check user's notification preferences
  const { data: prefs } = await db
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (prefs) {
    const typeLC = type.toLowerCase()
    if (typeLC.includes('chore') && prefs.chores_enabled === false) {
      return new Response('ok', { status: 200, headers: corsHeaders })
    }
    if ((typeLC.includes('expense') || typeLC.includes('settle')) && prefs.expenses_enabled === false) {
      return new Response('ok', { status: 200, headers: corsHeaders })
    }
    if (typeLC.includes('shopping') && prefs.shopping_enabled === false) {
      return new Response('ok', { status: 200, headers: corsHeaders })
    }
  }

  // Build a human-readable body from the notification type
  const notificationBody = type
    ? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Something happened in your home'

  // Build the APNs payload
  const apnsPayload = {
    aps: {
      alert: { title: 'Roost', body: title || notificationBody },
      sound: 'default',
      badge: 1,
      'mutable-content': 1,
    },
    type,
    entity_id: String(record.entity_id ?? ''),
  }

  // Build the JWT (cached per invocation — valid for 60 minutes but we generate fresh each call)
  let jwt: string
  try {
    jwt = await buildApnsJwt(keyPem, keyId, teamId)
  } catch (e) {
    console.error('Failed to build APNs JWT:', e)
    return new Response('JWT generation failed', { status: 500, headers: corsHeaders })
  }

  // Send to all devices in parallel
  const results = await Promise.all(
    tokens.map((row: { token: string }) =>
      sendToDevice(row.token, jwt, bundleId, sandbox, apnsPayload)
    )
  )

  // Prune invalid tokens (APNs returns 410 for stale tokens)
  const invalidTokens = results.filter((r) => r.status === 410).map((r) => r.token)
  if (invalidTokens.length > 0) {
    await db
      .from('device_tokens')
      .delete()
      .in('token', invalidTokens)
      .eq('user_id', userId)
    console.log(`Pruned ${invalidTokens.length} invalid token(s) for user ${userId}`)
  }

  const sent = results.filter((r) => r.success).length
  console.log(`Push sent to ${sent}/${tokens.length} device(s) for user ${userId}`)

  return new Response(JSON.stringify({ sent, total: tokens.length }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
