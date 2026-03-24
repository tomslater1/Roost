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
    exportCalendar: (icsContent: string) => Promise<{ success?: boolean; error?: string } | undefined>
    openExternal: (url: string) => Promise<{ error?: string } | undefined>
    onUpdateStatus: (callback: (status: UpdateStatus) => void) => void
    removeUpdateStatusListener: () => void
    checkForUpdates: () => Promise<void>
    downloadUpdate: () => Promise<void>
    installUpdate: () => Promise<void>
  }
}
