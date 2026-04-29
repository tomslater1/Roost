/**
 * PINSetupFlow — three-step modal for creating or changing a PIN.
 *
 * Step 1: Enter a 6-digit PIN.
 * Step 2: Confirm the PIN (must match step 1).
 * Step 3: Success moment — auto-closes after 1.5 s.
 *
 * On cancel (Escape or the X button): calls onCancel so the caller can
 * revert the app-lock toggle back to off.
 *
 * On completion: calls setupPIN(pin) internally, then onComplete().
 */

import { useCallback, useEffect, useState } from 'react'
import { Check, Delete, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import * as appLock from '@/lib/appLock'

const ease = [0.16, 1, 0.3, 1] as const
const PIN_LENGTH = 6

// ── Shared keypad ─────────────────────────────────────────────────────────────

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'] as const
type Key = typeof KEYS[number]

function PINKeypad({ onKey }: { onKey: (k: Key) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full">
      {KEYS.map((key, i) => {
        if (key === '') return <div key={`blank-${i}`} />
        return (
          <motion.button
            key={key}
            type="button"
            whileTap={{ scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={() => onKey(key as Key)}
            className="h-12 rounded-[12px] bg-muted/60 border border-border/50 flex items-center justify-center text-base font-medium text-foreground hover:bg-muted active:bg-muted/80 transition-colors select-none"
            aria-label={key === '⌫' ? 'Backspace' : key}
          >
            {key === '⌫' ? (
              <Delete className="w-4 h-4 text-muted-foreground" />
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

function PINDots({ count, shaking }: { count: number; shaking: boolean }) {
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
            className="w-3 h-3 rounded-full border-2"
            style={{ borderColor: filled ? '#d4795e' : 'rgba(61,50,41,0.3)' }}
          />
        )
      })}
    </motion.div>
  )
}

// ── PIN entry step ────────────────────────────────────────────────────────────

function PINEntryStep({
  title,
  body,
  onComplete,
  shaking,
  setShaking,
}: {
  title: string
  body: string
  onComplete: (pin: string) => void
  shaking: boolean
  setShaking: (v: boolean) => void
}) {
  const [pin, setPin] = useState('')

  // Reset pin when step resets (shaking clears it)
  useEffect(() => {
    if (shaking) {
      const t = setTimeout(() => {
        setPin('')
        setShaking(false)
      }, 450)
      return () => clearTimeout(t)
    }
  }, [shaking, setShaking])

  const handleKey = useCallback((key: Key) => {
    if (key === '⌫') {
      setPin((p) => p.slice(0, -1))
      return
    }
    const next = pin + key
    if (next.length > PIN_LENGTH) return
    setPin(next)
    if (next.length === PIN_LENGTH) {
      setTimeout(() => onComplete(next), 80)
    }
  }, [pin, onComplete])

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5">
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground leading-5">{body}</p>
      </div>
      <PINDots count={pin.length} shaking={shaking} />
      <PINKeypad onKey={handleKey} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

type Step = 'enter' | 'confirm' | 'success'

export function PINSetupFlow({
  onComplete,
  onCancel,
}: {
  onComplete: () => void
  onCancel: () => void
}) {
  const [step, setStep] = useState<Step>('enter')
  const [firstPIN, setFirstPIN] = useState('')
  const [shaking, setShaking] = useState(false)

  // Escape key cancels (unless on success step)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'success') {
        onCancel()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [step, onCancel])

  const handleEnterComplete = useCallback((pin: string) => {
    setFirstPIN(pin)
    setStep('confirm')
  }, [])

  const handleConfirmComplete = useCallback(async (pin: string) => {
    if (pin !== firstPIN) {
      setShaking(true)
      // Return to step 1 after shake clears
      setTimeout(() => setStep('enter'), 500)
      return
    }
    await appLock.setupPIN(pin)
    setStep('success')
    setTimeout(onComplete, 1500)
  }, [firstPIN, onComplete])

  return (
    // Backdrop
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-foreground/25 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.22, ease }}
        className="relative w-full max-w-[340px] mx-4 rounded-[24px] bg-card border border-border/70 shadow-xl p-6"
      >
        {/* Close button (not shown on success) */}
        {step !== 'success' && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-muted/60 text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Cancel PIN setup"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {step === 'enter' && (
            <motion.div
              key="enter"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease }}
            >
              <PINEntryStep
                title="Create your PIN"
                body="Choose a 6-digit PIN to protect your Roost data."
                onComplete={handleEnterComplete}
                shaking={false}
                setShaking={() => {}}
              />
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease }}
            >
              <PINEntryStep
                title="Confirm your PIN"
                body="Enter your PIN again to confirm."
                onComplete={handleConfirmComplete}
                shaking={shaking}
                setShaking={setShaking}
              />
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease }}
              className="flex flex-col items-center gap-4 py-4 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center"
              >
                <Check className="w-7 h-7 text-primary" />
              </motion.div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">PIN set</p>
                <p className="text-sm text-muted-foreground leading-5">
                  Roost will lock when you close or step away.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
