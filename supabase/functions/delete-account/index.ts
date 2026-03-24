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

    // Clean up home data — leave_home() handles last-member cascade.
    // If the user is the last member, the home and all its data cascade-delete automatically.
    // If a partner remains, we must manually clean up all FK references to this user.
    const { error: leaveError } = await userClient.rpc('leave_home')
    if (leaveError) return json({ error: `leave_home failed: ${leaveError.message}` }, 500)

    // Use admin client (service role) to bypass RLS for all cleanup below.
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Null out nullable columns that reference this user in shared home data.
    await adminClient.from('shopping_items').update({ added_by: null }).eq('added_by', user.id)
    await adminClient.from('shopping_items').update({ checked_by: null }).eq('checked_by', user.id)
    await adminClient.from('chores').update({ assigned_to: null }).eq('assigned_to', user.id)
    await adminClient.from('chores').update({ completed_by: null }).eq('completed_by', user.id)
    await adminClient.from('activity_feed').update({ user_id: null }).eq('user_id', user.id)

    // Delete rows with NOT NULL FK references — these can't be nulled.
    await adminClient.from('expense_splits').delete().eq('user_id', user.id)
    await adminClient.from('expenses').delete().eq('paid_by', user.id)
    await adminClient.from('settlements').delete().or(`paid_by.eq.${user.id},paid_to.eq.${user.id}`)

    // Delete user-specific tables (cascade would handle these but be explicit).
    await adminClient.from('notifications').delete().eq('user_id', user.id)
    await adminClient.from('notification_preferences').delete().eq('user_id', user.id)
    await adminClient.from('user_preferences').delete().eq('user_id', user.id)

    // Delete the auth user via admin API — only way to remove from auth.users.
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
    if (deleteError) return json({ error: `deleteUser failed: ${deleteError.message}` }, 500)

    return json({ success: true })
  } catch (e: any) {
    return json({ error: e?.message ?? 'Unexpected error' }, 500)
  }
})
