import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const HAZEL_SYSTEM = `You are Hazel, a household assistant built into Roost, a shared home management app for UK couples. You clean up text inputs and categorize items precisely. You have thorough knowledge of UK supermarkets, brands, and household goods. You are decisive — you always commit to the single best answer. You output only raw JSON with no markdown, no code fences, and no explanation.`

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

function buildSuggestChoresPrompt(existingChores: string[], month: string): string {
  const existing = existingChores.length > 0
    ? `Existing chores: ${existingChores.join(', ')}`
    : 'No existing chores yet.'

  return `Suggest 5 household chores appropriate for a UK couple in ${month}.

${existing}

Rules:
- Suggest chores NOT already in the existing list
- Use title case, action-oriented titles (2-5 words)
- Mix of daily, weekly, and monthly tasks
- Focus on practical UK household chores
- Be specific (e.g. "Hoover Living Room" not just "Clean")

Return exactly: {"suggestions":["Chore 1","Chore 2","Chore 3","Chore 4","Chore 5"]}`
}

async function suggestChores(existingChores: string[], month: string): Promise<string[] | null> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
  if (!apiKey) return null

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system: HAZEL_SYSTEM,
      messages: [{ role: 'user', content: buildSuggestChoresPrompt(existingChores, month) }],
    }),
  })

  if (!response.ok) {
    console.error('hazel-suggest-chores anthropic error', response.status, await response.text())
    return null
  }

  const payload = await response.json() as { content?: Array<{ type?: string; text?: string }> }
  const textBlock = payload.content?.find((b) => b.type === 'text' && typeof b.text === 'string')
  if (!textBlock?.text) return null

  let raw = textBlock.text.trim()
  const fenced = raw.match(/```(?:\w+)?\s*([\s\S]*?)```/)
  if (fenced) raw = fenced[1].trim()

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed.suggestions)) {
      return parsed.suggestions
        .filter((item: unknown): item is string => typeof item === 'string')
        .slice(0, 5)
    }
  } catch (error) {
    console.error('hazel-suggest-chores parse error', error)
  }

  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const jwt = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!jwt) return json({ success: false, reason: 'api_error' }, 401)

    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    if (authError || !user) return json({ success: false, reason: 'api_error' }, 401)

    const { existingChores, month, homeId } = await req.json() as {
      existingChores?: string[]
      month?: string
      homeId?: string
    }

    if (!homeId || !month) {
      return json({ success: false, reason: 'api_error' }, 400)
    }

    // Verify home membership
    const { data: membership } = await supabase
      .from('home_members')
      .select('home_id')
      .eq('home_id', homeId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) return json({ success: false, reason: 'api_error' }, 403)

    // Chore suggestions are FREE — no Nest check

    const suggestions = await suggestChores(existingChores ?? [], month)
    if (!suggestions) return json({ success: false, reason: 'api_error' }, 200)

    return json({ success: true, data: { suggestions } }, 200)
  } catch (error) {
    console.error('hazel-suggest-chores unhandled error', error)
    return json({ success: false, reason: 'api_error' }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
