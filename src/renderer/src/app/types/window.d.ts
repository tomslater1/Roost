// TypeScript declarations for the window.api object exposed by the preload script.
// Keep this in sync with src/preload/index.ts.

type UpdateStatus =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available'; version: string }
  | { status: 'not-available' }
  | { status: 'downloading'; percent: number }
  | { status: 'downloaded'; version: string }
  | { status: 'error' }

interface Window {
  api: {
    platform: NodeJS.Platform
    onAuthCallback: (callback: (url: string) => void) => void
    removeAuthCallback: () => void
    notify: (title: string, body?: string) => Promise<void>
    normalize: (text: string, context: string, categories?: string[]) => Promise<{ text: string; category?: string }>
    hazelCategorizeExpense: (payload: { text: string; categories?: string[]; isNest: boolean }) => Promise<
      | { success: true; data: { text: string; category?: string } }
      | { success: false; reason: 'not_nest' | 'api_error' }
    >
    suggestChores: (existingChores: string[], month: string) => Promise<string[]>
    budgetInsights: (payload: {
      input: {
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
      isNest: boolean
    }) => Promise<
      | { success: true; data: { summary: string; outlook: string; focus: string[] } }
      | { success: false; reason: 'not_nest' | 'api_error' }
    >
    stripeCreateCheckoutSession: (payload: {
      priceId: string
      homeId: string
      customerEmail: string
      stripeCustomerId?: string
      hasUsedTrial?: boolean
    }) => Promise<{ url: string }>
    stripeCreatePortalSession: (payload: { stripeCustomerId: string }) => Promise<{ url: string }>
    stripeGetPrices: () => Promise<{
      monthly: { id: string; unitAmount: number; currency: string; interval: 'month' | 'year'; formattedAmount: string; trialDays: number }
      annual: { id: string; unitAmount: number; currency: string; interval: 'month' | 'year'; formattedAmount: string; trialDays: number }
    }>
    exportCalendar: (icsContent: string) => Promise<{ success?: boolean; error?: string } | undefined>
    openExternal: (url: string) => Promise<{ error?: string } | undefined>
    openMainWindow: () => Promise<void>
    onAppBlur: (callback: () => void) => void
    onAppFocus: (callback: () => void) => void
    removeAppWindowListeners: () => void
    onUpdateStatus: (callback: (status: UpdateStatus) => void) => void
    removeUpdateStatusListener: () => void
    checkForUpdates: () => Promise<void>
    downloadUpdate: () => Promise<void>
    installUpdate: () => Promise<void>
  }
}
