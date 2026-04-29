import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const HAZEL_SYSTEM = `You are Hazel, a household assistant built into Roost, a shared home management app for UK couples. You clean up text inputs and categorize items precisely. You have thorough knowledge of UK supermarkets, brands, and household goods. You are decisive — you always commit to the single best answer. You output only raw JSON with no markdown, no code fences, and no explanation.`

const SHOPPING_CATEGORIES = [
  'Produce', 'Meat & Fish', 'Dairy & Eggs', 'Bakery', 'Deli',
  'Frozen', 'Pantry', 'Condiments', 'Drinks', 'Alcohol',
  'Snacks', 'Household', 'Personal Care',
]

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

function buildShoppingPrompt(text: string): string {
  return `Normalize this shopping item name to title case and assign exactly one category from the list below.

Item: "${text}"
Categories: ${SHOPPING_CATEGORIES.join(', ')}

Rules:
- Clean up the name (fix spelling, title case, remove filler)
- Pick the single most appropriate category
- If unsure, default to Pantry

Return exactly: {"text":"normalized name","category":"Category"}`
}

function buildChorePrompt(text: string): string {
  return `Normalize this household chore title to be clear and concise.

Chore: "${text}"

Rules:
- Use title case
- Keep it short (2-5 words)
- Make it action-oriented (e.g. "Clean Bathroom", "Take Bins Out")
- Remove filler words

Return exactly: {"text":"normalized chore title"}`
}

function buildBudgetCategoryPrompt(text: string): string {
  return `Normalize this budget category name to be clean and consistent.

Category: "${text}"

Rules:
- Use title case
- Be concise (1-3 words)
- Use standard household budget terms

Return exactly: {"text":"normalized category"}`
}

async function callHazel(prompt: string): Promise<{ text: string; category?: string } | null> {
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
      max_tokens: 80,
      system: HAZEL_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    console.error('hazel-normalize anthropic error', response.status, await response.text())
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
    if (typeof parsed.text === 'string') {
      return {
        text: parsed.text.trim(),
        category: typeof parsed.category === 'string' ? parsed.category.trim() : undefined,
      }
    }
  } catch (error) {
    console.error('hazel-normalize parse error', error)
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

    const { type, text, homeId } = await req.json() as {
      type?: string
      text?: string
      homeId?: string
    }

    if (!type || !text || !homeId) {
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

    // All normalize features are FREE — no Nest check needed
    let prompt: string
    switch (type) {
      case 'shopping':
        prompt = buildShoppingPrompt(text)
        break
      case 'chore':
        prompt = buildChorePrompt(text)
        break
      case 'budget':
        prompt = buildBudgetCategoryPrompt(text)
        break
      default:
        return json({ success: false, reason: 'api_error' }, 400)
    }

    const result = await callHazel(prompt)
    if (!result) return json({ success: false, reason: 'api_error' }, 200)

    return json({ success: true, data: result }, 200)
  } catch (error) {
    console.error('hazel-normalize unhandled error', error)
    return json({ success: false, reason: 'api_error' }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
