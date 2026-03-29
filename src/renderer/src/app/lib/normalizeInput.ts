export type HazelContext = 'shopping' | 'expense' | 'chore' | 'budget'

export interface HazelResult {
  text: string
  category?: string
}

// Hazel toggle state is stored per-context in localStorage.
// Default is enabled for all sections.
export function isHazelEnabled(context: HazelContext): boolean {
  const stored = localStorage.getItem(`hazel:${context}`)
  return stored === null ? true : stored === 'true'
}

export function setHazelEnabled(context: HazelContext, enabled: boolean): void {
  localStorage.setItem(`hazel:${context}`, String(enabled))
}

export async function normalizeInput(text: string, context: HazelContext, categories?: string[]): Promise<HazelResult> {
  if (!text.trim() || !isHazelEnabled(context)) return { text }
  try {
    const result = await window.api.normalize(text, context, categories)
    if (result && typeof result.text === 'string' && result.text.trim()) {
      return result
    }
    return { text }
  } catch {
    return { text }
  }
}

export async function categorizeExpenseWithGate(
  text: string,
  categories: string[] | undefined,
  isNest: boolean
): Promise<{ text: string; category?: string; gated: boolean }> {
  if (!text.trim() || !isHazelEnabled('expense')) return { text, gated: false }
  try {
    const result = await window.api.hazelCategorizeExpense({ text, categories, isNest })
    if (!result.success) return { text, gated: result.reason === 'not_nest' }
    return { ...result.data, gated: false }
  } catch {
    return { text, gated: false }
  }
}
