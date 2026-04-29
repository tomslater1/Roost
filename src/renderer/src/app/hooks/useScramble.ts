/**
 * useScramble — replaces all currency amounts with "•••" when scramble mode is active.
 *
 * Reads scramble_mode from AppContext (which sources it from useMoneySettings).
 * Use fmt() anywhere you'd normally call useCurrencyFormat() in Money screens.
 *
 * fmt() accepts an optional custom formatter — if not provided it uses the
 * household's currency format via Intl.NumberFormat GBP fallback.
 */

import { useCallback } from 'react'
import { useApp } from '@/context/AppContext'
import { useCurrencyFormat } from '@/hooks/useHome'

export function useScramble() {
  const { scrambleMode } = useApp()
  const currencyFmt = useCurrencyFormat()

  /**
   * Format a currency amount respecting scramble mode.
   * When scrambled, always returns "•••".
   * When not scrambled, delegates to the household's Intl.NumberFormat formatter.
   */
  const fmt = useCallback(
    (amount: number | null | undefined): string => {
      if (scrambleMode) return '•••'
      if (amount == null) return '—'
      return currencyFmt(amount)
    },
    [scrambleMode, currencyFmt]
  )

  return { fmt, scrambled: scrambleMode }
}
