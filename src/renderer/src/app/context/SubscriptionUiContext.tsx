import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface SubscriptionUiContextValue {
  upgradeOpen: boolean
  openUpgrade: () => void
  closeUpgrade: () => void
}

const SubscriptionUiContext = createContext<SubscriptionUiContextValue | undefined>(undefined)

export function SubscriptionUiProvider({ children }: { children: ReactNode }) {
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const openUpgrade = useCallback(() => setUpgradeOpen(true), [])
  const closeUpgrade = useCallback(() => setUpgradeOpen(false), [])

  const value = useMemo(
    () => ({ upgradeOpen, openUpgrade, closeUpgrade }),
    [upgradeOpen, openUpgrade, closeUpgrade]
  )

  return <SubscriptionUiContext.Provider value={value}>{children}</SubscriptionUiContext.Provider>
}

export function useSubscriptionUi() {
  const ctx = useContext(SubscriptionUiContext)
  if (!ctx) throw new Error('useSubscriptionUi must be used within SubscriptionUiProvider')
  return ctx
}