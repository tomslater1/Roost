import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: `Missing env vars: ${[!supabaseUrl && 'SUPABASE_URL', !anonKey && 'SUPABASE_ANON_KEY', !serviceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY'].filter(Boolean).join(', ')}` }, 500)
    }

    const body = await req.json().catch(() => ({}))
    const accessToken = body?.access_token
    if (!accessToken) return json({ error: 'Missing access_token in request body' }, 400)

    // Verify the caller's identity using their access token
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    })
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: userError?.message ?? 'Invalid token' }, 401)

    // Clean up home data — leave_home() handles last-member cascade
    const { error: leaveError } = await userClient.rpc('leave_home')
    if (leaveError) return json({ error: `leave_home failed: ${leaveError.message}` }, 500)

    // Delete the auth user via admin API — only way to remove from auth.users
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
    if (deleteError) return json({ error: `deleteUser failed: ${deleteError.message}` }, 500)

    return json({ success: true })
  } catch (e: any) {
    return json({ error: e?.message ?? 'Unexpected error' }, 500)
  }
})
