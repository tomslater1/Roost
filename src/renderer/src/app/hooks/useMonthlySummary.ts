import { useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { startOfMonth, formatISO } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useHome } from './useHome'
import { useRealtime } from './useRealtime'
import { monthlySummarySchema, type MonthlySummary } from '@/lib/schemas/money'

const QUERY_KEY = 'monthly-summary'

export function useMonthlySummary(initialMonth?: Date) {
  const { home } = useHome()
  const queryClient = useQueryClient()
  const [selectedMonth, setSelectedMonth] = useState<Date>(initialMonth ?? new Date())

  const monthParam = formatISO(startOfMonth(selectedMonth), { representation: 'date' })

  const invalidateSummary = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, home?.id] }),
    [queryClient, home?.id]
  )

  const query = useQuery({
    queryKey: [QUERY_KEY, home?.id, monthParam],
    enabled: !!home?.id,
    retry: false,
    queryFn: async (): Promise<MonthlySummary | undefined> => {
      const { data, error } = await supabase.rpc('get_monthly_summary', {
        p_home_id: home!.id,
        p_month: monthParam,
      })

      if (error) {
        // Any RPC error means the function isn't deployed or has a different signature.
        // Migrations 0032 + 0033 need to run in Supabase. Fall back to client-side computation.
        console.warn(
          '[Roost] get_monthly_summary RPC unavailable — run migrations 0032 and 0033 in the Supabase SQL editor. Falling back to client-side computation.',
          error.code,
          error.message
        )
        return undefined
      }
      return monthlySummarySchema.parse(data)
    },
  })

  // Invalidate the summary whenever related tables change.
  // budgets replaces recurring_bills as the source of fixed costs (migration 0033).
  useRealtime({ table: 'expenses', homeId: home?.id, onUpdate: invalidateSummary })
  useRealtime({ table: 'household_income', homeId: home?.id, onUpdate: invalidateSummary })
  useRealtime({ table: 'budgets', homeId: home?.id, onUpdate: invalidateSummary })

  return {
    summary: query.data,
    isLoading: query.isLoading,
    error: query.error,
    selectedMonth,
    setSelectedMonth,
  }
}
