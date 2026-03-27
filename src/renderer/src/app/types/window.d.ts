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
    suggestChores: (existingChores: string[], month: string) => Promise<string[]>
    budgetInsights: (input: {
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
    }) => Promise<{ summary: string; outlook: string; focus: string[] } | null>
    exportCalendar: (icsContent: string) => Promise<{ success?: boolean; error?: string } | undefined>
    openExternal: (url: string) => Promise<{ error?: string } | undefined>
    openMainWindow: () => Promise<void>
    onUpdateStatus: (callback: (status: UpdateStatus) => void) => void
    removeUpdateStatusListener: () => void
    checkForUpdates: () => Promise<void>
    downloadUpdate: () => Promise<void>
    installUpdate: () => Promise<void>
  }
}
