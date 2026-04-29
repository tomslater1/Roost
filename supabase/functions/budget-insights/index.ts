import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const HAZEL_SYSTEM = `You are Hazel, a household assistant built into Roost, a shared home management app for UK couples. You clean up text inputs and categorize items precisely. You have thorough knowledge of UK supermarkets, brands, and household goods. You are decisive — you always commit to the single best answer. You output only raw JSON with no markdown, no code fences, and no explanation.`

interface BudgetInsightInput {
  monthLabel: string
  totalSpent: number
  totalBudget: number
  projectedMonthEnd: number
  remaining: number
  overspend: number
  topCategories: Array<{
    name: string
    spend: number
    limit: number | null
    pct: number
    recurringTotal: number
  }>
}

interface BudgetInsights {
  summary: string
  outlook: string
  focus: string[]
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

function buildBudgetInsightsPrompt(input: BudgetInsightInput): string {
  return `You are helping explain a household budget for a UK couple in a warm, calm, non-judgemental voice.

Month: ${input.monthLabel}
Total spent: £${input.totalSpent.toFixed(2)}
Total budget: £${input.totalBudget.toFixed(2)}
Projected end of month spend: £${input.projectedMonthEnd.toFixed(2)}
Remaining budget: £${input.remaining.toFixed(2)}
Overspend so far: £${input.overspend.toFixed(2)}

Top categories:
${input.topCategories.map((c) => `- ${c.name}: spend £${c.spend.toFixed(2)}, limit ${c.limit === null ? 'none' : `£${c.limit.toFixed(2)}`}, used ${Math.round(c.pct)}%, recurring £${c.recurringTotal.toFixed(2)}`).join('\n')}

Write:
- one short summary sentence
- one short outlook sentence
- exactly 3 concise focus points

Rules:
- Be warm, calm, and useful
- No scolding, no finance jargon, no corporate language
- Be specific to the numbers provided
- Keep each focus point under 12 words
- Output JSON only

Return exactly:
{"summary":"...","outlook":"...","focus":["...","...","..."]}`
}

async function getBudgetInsights(input: BudgetInsightInput): Promise<BudgetInsights | null> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY') ?? Deno.env.get('MAIN_VITE_ANTHROPIC_API_KEY') ?? ''
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
      max_tokens: 220,
      system: HAZEL_SYSTEM,
      messages: [
        {
          role: 'user',
          content: buildBudgetInsightsPrompt(input),
        },
      ],
    }),
  })

  if (!response.ok) {
    console.error('budget-insights anthropic error', response.status, await response.text())
    return null
  }

  const payload = await response.json() as { content?: Array<{ type?: string; text?: string }> }
  const textBlock = payload.content?.find((block) => block.type === 'text' && typeof block.text === 'string')
  if (!textBlock?.text) return null

  let raw = textBlock.text.trim()
  const fenced = raw.match(/```(?:\w+)?\s*([\s\S]*?)```/)
  if (fenced) raw = fenced[1].trim()

  try {
    const parsed = JSON.parse(raw)
    if (
      typeof parsed.summary === 'string' &&
      typeof parsed.outlook === 'string' &&
      Array.isArray(parsed.focus)
    ) {
      return {
        summary: parsed.summary.trim(),
        outlook: parsed.outlook.trim(),
        focus: parsed.focus.filter((item: unknown): item is string => typeof item === 'string').slice(0, 3),
      }
    }
  } catch (error) {
    console.error('budget-insights parse error', error)
  }

  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const jwt = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!jwt) return json({ success: false, reason: 'api_error' }, 401)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(jwt)

    if (authError || !user) return json({ success: false, reason: 'api_error' }, 401)

    const { homeId, input } = await req.json() as { homeId?: string; input?: BudgetInsightInput }
    if (!homeId || !input || !Array.isArray(input.topCategories)) {
      return json({ success: false, reason: 'api_error' }, 400)
    }

    const { data: membership } = await supabase
      .from('home_members')
      .select('home_id')
      .eq('home_id', homeId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return json({ success: false, reason: 'api_error' }, 403)
    }

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

    const result = await getBudgetInsights(input)
    if (!result) {
      return json({ success: false, reason: 'api_error' }, 200)
    }

    return json({ success: true, data: result }, 200)
  } catch (error) {
    console.error('budget-insights unhandled error', error)
    return json({ success: false, reason: 'api_error' }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
