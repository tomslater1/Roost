/**
 * LockContext — React context for app-lock state.
 *
 * Renders a full-screen LockScreen overlay when the app is locked.
 * Handles IPC blur/focus events from the Electron main process to
 * auto-lock after the configured delay.
 *
 * Face ID architecture note: when biometric unlock lands in a future session,
 * it will call `unlock()` after a successful biometric check — the same path
 * the PIN keypad uses. No changes to this context will be needed.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence } from 'motion/react'
import * as appLock from '@/lib/appLock'
import { LockScreen } from '@/components/security/LockScreen'

interface LockContextValue {
  locked: boolean
  lock: () => void
  unlock: () => void
  /** Call after PIN setup / config change to re-sync in-memory state. */
  refreshLockEnabled: () => void
}

const LockContext = createContext<LockContextValue>({
  locked: false,
  lock: () => {},
  unlock: () => {},
  refreshLockEnabled: () => {},
})

export function useLock() {
  return useContext(LockContext)
}

export function LockProvider({ children }: { children: ReactNode }) {
  // On mount: if lock is enabled and a PIN exists, start locked.
  // "Never" auto-lock still locks on launch — it only affects blur behaviour.
  const [locked, setLocked] = useState<boolean>(() => {
    const config = appLock.getConfig()
    if (!config.isEnabled || !config.pinHash) return false
    appLock.lock()
    return true
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doLock = useCallback(() => {
    appLock.lock()
    setLocked(true)
  }, [])

  const doUnlock = useCallback(() => {
    appLock.setUnlocked()
    setLocked(false)
  }, [])

  // Stable refs so the IPC handlers always see the latest functions.
  const doLockRef = useRef(doLock)
  doLockRef.current = doLock

  const refreshLockEnabled = useCallback(() => {
    const config = appLock.getConfig()
    // If lock was just disabled, ensure we're unlocked.
    if (!config.isEnabled || !config.pinHash) {
      setLocked(false)
    }
  }, [])

  // Register IPC listeners for window blur / focus once at mount.
  useEffect(() => {
    const handleBlur = () => {
      const cfg = appLock.getConfig()
      if (!cfg.isEnabled || !cfg.pinHash) return

      if (cfg.autoLockDelay === 0) {
        doLockRef.current()
      } else if (cfg.autoLockDelay > 0) {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => doLockRef.current(), cfg.autoLockDelay)
      }
      // autoLockDelay === -1 means "never" — don't start a timer.
    }

    const handleFocus = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    window.api?.onAppBlur?.(handleBlur)
    window.api?.onAppFocus?.(handleFocus)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      window.api?.removeAppWindowListeners?.()
    }
  }, [])

  return (
    <LockContext.Provider value={{ locked, lock: doLock, unlock: doUnlock, refreshLockEnabled }}>
      {children}
      <AnimatePresence>
        {locked && <LockScreen key="lock-screen" onUnlock={doUnlock} />}
      </AnimatePresence>
    </LockContext.Provider>
  )
}
