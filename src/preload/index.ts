import { contextBridge, ipcRenderer } from 'electron'

// The preload script runs in a sandboxed context that has access to both
// the DOM (like the renderer) and a limited set of Node.js/Electron APIs.
// contextBridge.exposeInMainWorld() safely bridges the main process and renderer.
//
// Types for window.api are declared in src/renderer/src/app/types/window.d.ts

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,

  // Called by the renderer to subscribe to deep-link auth callbacks.
  onAuthCallback: (callback: (url: string) => void) => {
    ipcRenderer.on('auth:callback', (_event, url: string) => callback(url))
  },

  // Clean up the listener when the auth handler unmounts.
  removeAuthCallback: () => {
    ipcRenderer.removeAllListeners('auth:callback')
  },

  // Show a native macOS notification.
  // Called when the partner takes an action and a realtime push arrives.
  notify: (title: string, body?: string) =>
    ipcRenderer.invoke('notify', { title, body }),

  // Normalize user input text via Claude (main process, API key never in renderer).
  // categories is passed for expense context so Hazel uses the household's actual category list.
  normalize: (text: string, context: string, categories?: string[]) =>
    ipcRenderer.invoke('normalize', text, context, categories),

  hazelCategorizeExpense: (payload: { text: string; categories?: string[]; isNest: boolean }) =>
    ipcRenderer.invoke('hazel:categorize-expense', payload),

  // Generate up to 5 chore suggestions, avoiding duplicates from existingChores.
  // month is the current month name (e.g. "March") for seasonal context.
  suggestChores: (existingChores: string[], month: string) =>
    ipcRenderer.invoke('chore:suggest', existingChores, month),

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
  }) => ipcRenderer.invoke('budget:insights', payload),

  stripeCreateCheckoutSession: (payload: {
    priceId: string
    homeId: string
    customerEmail: string
    stripeCustomerId?: string
    hasUsedTrial?: boolean
  }) => ipcRenderer.invoke('stripe:create-checkout-session', payload),

  stripeCreatePortalSession: (payload: { stripeCustomerId: string }) =>
    ipcRenderer.invoke('stripe:create-portal-session', payload),

  stripeGetPrices: () => ipcRenderer.invoke('stripe:get-prices'),

  // Write a ready-made .ics string to a temp file and open in the default calendar app.
  exportCalendar: (icsContent: string) =>
    ipcRenderer.invoke('export-calendar', icsContent),

  // Open a URL via the system's default handler (e.g. webcal:// opens Apple Calendar subscribe).
  openExternal: (url: string) =>
    ipcRenderer.invoke('open-external', url),

  openMainWindow: () =>
    ipcRenderer.invoke('open-main-window'),

  // App focus / blur — used by LockContext to trigger auto-lock timer.
  onAppBlur: (callback: () => void) => {
    ipcRenderer.on('app:blur', callback)
  },
  onAppFocus: (callback: () => void) => {
    ipcRenderer.on('app:focus', callback)
  },
  removeAppWindowListeners: () => {
    ipcRenderer.removeAllListeners('app:blur')
    ipcRenderer.removeAllListeners('app:focus')
  },

  // Subscribe to update status events pushed from the main process.
  onUpdateStatus: (callback: (status: unknown) => void) => {
    ipcRenderer.on('updater:status', (_event, status) => callback(status))
  },

  // Clean up the update status listener when the component unmounts.
  removeUpdateStatusListener: () => {
    ipcRenderer.removeAllListeners('updater:status')
  },

  // Manually trigger an update check (no-op in dev).
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),

  // Start downloading the available update.
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),

  // Quit and reinstall with the downloaded update.
  installUpdate: () => ipcRenderer.invoke('updater:install'),
})
