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

function buildExpensePrompt(text: string, categories: string[]): string {
  const catList = categories.length > 0
    ? `Existing categories: ${categories.join(', ')}\n\nPick from the existing categories if one clearly fits. Otherwise suggest a new clean category name.`
    : 'There are no existing categories — suggest a clean, concise category name.'

  return `Clean up this expense title and assign it to the most appropriate category.

Expense: "${text}"
${catList}

Rules:
- Clean the title (fix spelling, title case, remove junk)
- Be specific — "Groceries" not "Food"
- Use UK household terminology
- Category should be 1-3 words, title case
- If the expense is from a known UK retailer, use the appropriate category

Return exactly: {"text":"cleaned title","category":"Category Name"}`
}

async function categorizeExpense(
  text: string,
  categories: string[]
): Promise<{ text: string; category: string } | null> {
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
      messages: [{ role: 'user', content: buildExpensePrompt(text, categories) }],
    }),
  })

  if (!response.ok) {
    console.error('hazel-categorize-expense anthropic error', response.status, await response.text())
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
    if (typeof parsed.text === 'string' && typeof parsed.category === 'string') {
      return {
        text: parsed.text.trim(),
        category: parsed.category.trim(),
      }
    }
  } catch (error) {
    console.error('hazel-categorize-expense parse error', error)
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

    const { text, categories, homeId } = await req.json() as {
      text?: string
      categories?: string[]
      homeId?: string
    }

    if (!text || !homeId) {
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

    // Expense categorization is NEST ONLY
    const { data: home } = await supabase
      .from('homes')
      .select('subscription_status, subscription_tier')
      .eq('id', homeId)
      .maybeSingle()

    const hasNestAccess =
      home?.subscription_tier === 'nest' &&
      ['active', 'trialing', 'lifetime'].includes(home?.subscription_status ?? '')

    if (!hasNestAccess) {
      return json({ success: false, reason: 'not_nest' }, 200)
    }

    const result = await categorizeExpense(text, categories ?? [])
    if (!result) return json({ success: false, reason: 'api_error' }, 200)

    return json({ success: true, data: result }, 200)
  } catch (error) {
    console.error('hazel-categorize-expense unhandled error', error)
    return json({ success: false, reason: 'api_error' }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
