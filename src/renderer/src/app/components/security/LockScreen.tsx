/**
 * LockScreen — full-screen overlay rendered when the app is locked.
 *
 * Sits above all app content at z-[200]. App content stays mounted beneath it
 * so TanStack Query cache and React state are preserved across lock/unlock.
 *
 * Face ID architecture note: a "Use Touch ID" row is present below the keypad,
 * currently disabled. When biometric unlock ships, that button calls
 * `onUnlock()` after a successful system biometric prompt — no structural
 * changes to this component needed.
 */

import { useCallback, useRef, useState } from 'react'
import { Fingerprint, Home } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Delete } from 'lucide-react'
import * as appLock from '@/lib/appLock'

const ease = [0.16, 1, 0.3, 1] as const
const PIN_LENGTH = 6
const MAX_ATTEMPTS = 5
const COOLDOWN_SECONDS = 10

// ── Keypad ────────────────────────────────────────────────────────────────────

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'] as const
type Key = typeof KEYS[number]

function PINKeypad({ onKey, disabled }: { onKey: (k: Key) => void; disabled: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
      {KEYS.map((key, i) => {
        if (key === '') {
          return <div key={`blank-${i}`} />
        }
        return (
          <motion.button
            key={key}
            type="button"
            disabled={disabled}
            whileTap={{ scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={() => onKey(key as Key)}
            className="h-14 rounded-[14px] bg-card border border-border/60 flex items-center justify-center text-lg font-medium text-foreground hover:bg-muted/60 active:bg-muted transition-colors select-none disabled:opacity-40 disabled:pointer-events-none"
            aria-label={key === '⌫' ? 'Backspace' : key}
          >
            {key === '⌫' ? (
              <Delete className="w-5 h-5 text-muted-foreground" />
            ) : (
              key
            )}
          </motion.button>
        )
      })}
    </div>
  )
}

// ── PIN dots ──────────────────────────────────────────────────────────────────

function PINDots({
  count,
  shaking,
}: {
  count: number
  shaking: boolean
}) {
  return (
    <motion.div
      className="flex gap-3 items-center justify-center"
      animate={shaking ? { x: [0, -10, 10, -10, 10, -6, 6, 0] } : { x: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      {Array.from({ length: PIN_LENGTH }).map((_, i) => {
        const filled = i < count
        return (
          <motion.div
            key={i}
            initial={false}
            animate={{
              scale: filled ? [1, 1.2, 1] : 1,
              backgroundColor: filled ? '#d4795e' : 'transparent',
            }}
            transition={{ duration: 0.15, ease }}
            className="w-3.5 h-3.5 rounded-full border-2"
            style={{ borderColor: filled ? '#d4795e' : 'rgba(61,50,41,0.3)' }}
          />
        )
      })}
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('')
  const [shaking, setShaking] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const inCooldown = cooldownRemaining > 0

  const startCooldown = useCallback(() => {
    setCooldownRemaining(COOLDOWN_SECONDS)
    cooldownRef.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!)
          cooldownRef.current = null
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const handleKey = useCallback(async (key: Key) => {
    if (inCooldown) return

    if (key === '⌫') {
      setPin((p) => p.slice(0, -1))
      return
    }

    const next = pin + key
    if (next.length > PIN_LENGTH) return
    setPin(next)

    if (next.length === PIN_LENGTH) {
      const ok = await appLock.verifyPIN(next)
      if (ok) {
        // Small delay so the last dot fills visually before unlock animation
        setTimeout(onUnlock, 120)
      } else {
        setShaking(true)
        setTimeout(() => {
          setShaking(false)
          setPin('')
        }, 450)

        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        if (newAttempts >= MAX_ATTEMPTS) {
          setAttempts(0)
          startCooldown()
        }
      }
    }
  }, [pin, inCooldown, attempts, onUnlock, startCooldown])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.25, ease }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-8 bg-background"
      aria-label="App locked"
      aria-modal="true"
      role="dialog"
    >
      {/* Branding */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-[22px] bg-primary/15 flex items-center justify-center">
          <Home className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-foreground">Roost</p>
          <p className="text-sm text-muted-foreground mt-1">Enter your PIN to continue</p>
        </div>
      </div>

      {/* PIN dots */}
      <PINDots count={pin.length} shaking={shaking} />

      {/* Cooldown message */}
      <AnimatePresence mode="wait">
        {inCooldown ? (
          <motion.p
            key="cooldown"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-destructive font-medium"
          >
            Too many attempts. Try again in {cooldownRemaining}s.
          </motion.p>
        ) : (
          <motion.div
            key="spacer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-5"
          />
        )}
      </AnimatePresence>

      {/* Keypad */}
      <PINKeypad onKey={handleKey} disabled={inCooldown} />

      {/* Touch ID placeholder — activates after app signing */}
      <button
        type="button"
        disabled
        className="flex items-center gap-2 text-sm text-muted-foreground/50 mt-2 cursor-default select-none"
        aria-label="Touch ID not yet available"
      >
        <Fingerprint className="w-4 h-4" />
        Use Touch ID
      </button>
    </motion.div>
  )
}
