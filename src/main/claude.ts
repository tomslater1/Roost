import Anthropic from '@anthropic-ai/sdk'

// Hazel is the household AI assistant built into Roost.
// She runs silently in the background, tidying up inputs and categorizing entries
// so everything in the shared home stays clean and consistent.

const HAZEL_SYSTEM = `You are Hazel, a household assistant built into Roost, a shared home management app for UK couples. You clean up text inputs and categorize items precisely. You have thorough knowledge of UK supermarkets, brands, and household goods. You are decisive — you always commit to the single best answer. You output only raw JSON with no markdown, no code fences, and no explanation.`

const SHOPPING_CATEGORIES = `Produce        → fresh fruit, vegetables, herbs, salad, mushrooms, garlic
Meat & Fish    → raw meat, poultry, fish, seafood, bacon, mince, sausages, prawns
Dairy & Eggs   → milk, cheese, yogurt, butter, cream, eggs, oat milk, dairy alternatives
Bakery & Bread → bread, rolls, wraps, pitta, crumpets, croissants, pastries, bagels
Deli & Chilled → hummus, dips, cooked meats, pizza, ready meals, chilled soup, fresh pasta, chilled pastry, quiche
Frozen         → items bought from the freezer aisle (only use when the word "frozen" is present, or it is clearly a freezer product like ice cream, oven chips, or frozen peas)
Pantry         → dried pasta, rice, noodles, couscous, tinned goods, cereal, porridge, flour, sugar, oil, stock cubes, dried beans, lentils, breadcrumbs
Condiments     → ketchup, mayo, mustard, hot sauce, soy sauce, pasta sauce, salad dressing, jam, honey, peanut butter, Marmite, gravy, vinegar
Drinks         → water, juice, squash, cordial, soft drinks, tea, coffee, energy drinks
Alcohol        → beer, wine, spirits, cider, prosecco, champagne, gin, whisky
Snacks         → crisps, popcorn, nuts, crackers, biscuits, chocolate, sweets, cereal bars, dried fruit
Household      → cleaning sprays, washing up liquid, laundry detergent, dishwasher tablets, bin bags, kitchen roll, toilet roll, foil, cling film, batteries
Personal Care  → shampoo, conditioner, soap, shower gel, toothpaste, deodorant, razors, skincare, makeup, vitamins, medicine
Pet Care       → pet food, cat litter, dog treats, pet accessories`

const STATIC_CONTEXT_PROMPTS: Record<string, string> = {
  shopping: `Clean up a shopping list item name and assign it to the best category.

Step 1 — Clean the name: fix capitalisation, expand abbreviations (choc → Chocolate, OJ → Orange Juice), fix typos. Keep it concise and natural.

Step 2 — Pick the best category from this list (use the exact name on the left):
${SHOPPING_CATEGORIES}

Key rules:
- Only use Frozen if the item explicitly says "frozen" or is unambiguously a freezer product (ice cream, oven chips). Default ambiguous items like "pizza" to Deli & Chilled.
- Dried pasta, rice, noodles = Pantry. Fresh pasta = Deli & Chilled.
- Toilet roll, kitchen roll, bin bags, foil, cling film = Household (not food).
- Tea, coffee = Drinks. Beer, wine, spirits = Alcohol.
- If nothing fits, use "Other".

Return JSON only — no markdown, no explanation:
{"text": "cleaned name", "category": "category name"}`,

  chore: `Clean up this household chore title. Fix capitalisation, correct typos, and make it a clear action phrase (e.g. "clean bathrom" → "Clean Bathroom").

Return JSON only — no markdown, no explanation:
{"text": "cleaned chore title"}`,

  budget: `Clean up this budget category name. Fix capitalisation and correct obvious typos.

Return JSON only — no markdown, no explanation:
{"text": "cleaned category name"}`,
}

function buildExpensePrompt(categories: string[]): string {
  const catList = categories.map((c) => `"${c}"`).join(', ')
  return `Clean up an expense title and assign it to the best category.

Step 1 — Clean the title: fix capitalisation, expand abbreviations (amzn → Amazon, mcds → McDonald's), fix typos. Keep it short.

Step 2 — Categorise using real-world knowledge of UK brands and services:
- Restaurants/takeaways (Five Guys, Deliveroo, Nando's, any café or restaurant) → eating out category
- Supermarkets (Tesco, Sainsbury's, Aldi, Waitrose, Ocado, M&S Food) → groceries category
- Utilities/bills (BT, Sky, Octopus, Thames Water, Council Tax, TV Licence) → bills category
- Transport (TfL, Uber, fuel, parking, trains, flights) → transport category
- Streaming/subscriptions (Netflix, Spotify, Disney+, iCloud, Adobe) → subscriptions category
- Clothing/shopping (ASOS, Zara, Amazon, John Lewis, Primark) → shopping category
- Gym/health (Pure Gym, Boots, pharmacy, dentist) → health category
- Rent/mortgage → housing category

Available categories — use one of these exact strings: ${catList}

Return JSON only — no markdown, no explanation:
{"text": "cleaned title", "category": "exact category name"}`
}

const CHORE_SUGGESTIONS_PROMPT = (existingList: string, month: string) =>
  `Suggest exactly 5 household chores for a UK couple to do in ${month}. ${existingList}

Rules:
- Each suggestion must be a clear, concise action phrase (e.g. "Clean the oven", "Wipe down skirting boards")
- Cover a variety of rooms and task types — not all cleaning tasks
- Make them practical and achievable in under an hour each
- Use seasonal context where relevant (e.g. spring cleaning in March/April, checking radiators in autumn)
- Never duplicate or closely resemble an existing chore

Return JSON only — no markdown, no explanation:
{"suggestions": ["chore 1", "chore 2", "chore 3", "chore 4", "chore 5"]}`

let client: Anthropic | null = null

function getClient(): Anthropic | null {
  const apiKey = import.meta.env.MAIN_VITE_ANTHROPIC_API_KEY
  if (!apiKey) return null
  if (!client) client = new Anthropic({ apiKey })
  return client
}

export interface HazelResult {
  text: string
  category?: string
}

export type HazelResponse<T> =
  | { success: true; data: T }
  | { success: false; reason: 'not_nest' | 'api_error' }

export interface BudgetInsightInput {
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

export interface BudgetInsights {
  summary: string
  outlook: string
  focus: string[]
}

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

export async function suggestChores(existingChores: string[], month: string): Promise<string[]> {
  const ai = getClient()
  if (!ai) return []

  const existingList =
    existingChores.length > 0
      ? `Existing chores (avoid duplicating): ${existingChores.map((c) => `"${c}"`).join(', ')}.`
      : 'There are no existing chores.'

  const message = await ai.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    system: HAZEL_SYSTEM,
    messages: [
      {
        role: 'user',
        content: CHORE_SUGGESTIONS_PROMPT(existingList, month),
      },
    ],
  })

  const block = message.content[0]
  if (block.type !== 'text') return []

  let raw = block.text.trim()
  const fenced = raw.match(/```(?:\w+)?\s*([\s\S]*?)```/)
  if (fenced) raw = fenced[1].trim()

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed.suggestions)) {
      return parsed.suggestions
        .filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
        .slice(0, 5)
    }
    return []
  } catch {
    return []
  }
}

export async function normalizeText(rawText: string, context: string, categories?: string[]): Promise<HazelResult> {
  if (!rawText.trim()) return { text: rawText }

  const ai = getClient()
  if (!ai) return { text: rawText }

  const contextPrompt = context === 'expense' && categories && categories.length > 0
    ? buildExpensePrompt(categories)
    : STATIC_CONTEXT_PROMPTS[context]
  if (!contextPrompt) return { text: rawText }

  const message = await ai.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 120,
    system: HAZEL_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `${contextPrompt}\n\nInput: "${rawText}"`,
      },
    ],
  })

  const block = message.content[0]
  if (block.type !== 'text') return { text: rawText }

  let raw = block.text.trim()

  // Strip markdown code fences if present
  const fenced = raw.match(/```(?:\w+)?\s*([\s\S]*?)```/)
  if (fenced) raw = fenced[1].trim()

  try {
    const parsed = JSON.parse(raw)
    return {
      text: typeof parsed.text === 'string' && parsed.text.trim() ? parsed.text.trim() : rawText,
      category: typeof parsed.category === 'string' && parsed.category.trim() ? parsed.category.trim() : undefined,
    }
  } catch {
    const plain = raw.replace(/^["']|["']$/g, '')
    return { text: plain || rawText }
  }
}

export async function getBudgetInsights(input: BudgetInsightInput): Promise<BudgetInsights | null> {
  const ai = getClient()
  if (!ai) return null

  const message = await ai.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 220,
    system: HAZEL_SYSTEM,
    messages: [
      {
        role: 'user',
        content: buildBudgetInsightsPrompt(input),
      },
    ],
  })

  const block = message.content[0]
  if (block.type !== 'text') return null

  let raw = block.text.trim()
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
    return null
  } catch {
    return null
  }
}

export async function normalizeExpenseForNest(
  rawText: string,
  categories: string[] | undefined,
  isNest: boolean
): Promise<HazelResponse<HazelResult>> {
  if (!isNest) return { success: false, reason: 'not_nest' }
  try {
    const result = await normalizeText(rawText, 'expense', categories)
    return { success: true, data: result }
  } catch {
    return { success: false, reason: 'api_error' }
  }
}

export async function getBudgetInsightsForNest(
  input: BudgetInsightInput,
  isNest: boolean
): Promise<HazelResponse<BudgetInsights>> {
  if (!isNest) return { success: false, reason: 'not_nest' }
  try {
    const result = await getBudgetInsights(input)
    if (!result) return { success: false, reason: 'api_error' }
    return { success: true, data: result }
  } catch {
    return { success: false, reason: 'api_error' }
  }
}
