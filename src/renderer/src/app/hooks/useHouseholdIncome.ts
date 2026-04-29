import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format, startOfMonth } from 'date-fns'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { translateError } from '@/lib/errors'
import { useHome } from './useHome'
import { useRealtime } from './useRealtime'
import {
  householdIncomeSchema,
  createHouseholdIncomeSchema,
  type HouseholdIncome,
  type CreateHouseholdIncome,
} from '@/lib/schemas/money'

const QUERY_KEY = 'household-income'

export function useHouseholdIncome() {
  const { home } = useHome()
  const queryClient = useQueryClient()

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, home?.id] }),
    [queryClient, home?.id]
  )

  const query = useQuery({
    queryKey: [QUERY_KEY, home?.id],
    enabled: !!home?.id,
    queryFn: async (): Promise<HouseholdIncome[]> => {
      const { data, error } = await supabase
        .from('household_income')
        .select('*')
        .eq('home_id', home!.id)
        .order('month', { ascending: false })

      if (error) throw error
      return z.array(householdIncomeSchema).parse(data)
    },
  })

  useRealtime({ table: 'household_income', homeId: home?.id, onUpdate: invalidate })

  // Derived helper — find the cached income row for a given month
  const getIncomeForMonth = useCallback(
    (month: Date): HouseholdIncome | undefined => {
      const monthKey = format(startOfMonth(month), 'yyyy-MM-dd')
      return query.data?.find((row) => row.month.startsWith(monthKey.slice(0, 7)))
    },
    [query.data]
  )

  const setIncome = useMutation({
    onMutate: async (input: CreateHouseholdIncome) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, home?.id] })
      const previous = queryClient.getQueryData<HouseholdIncome[]>([QUERY_KEY, home?.id])

      // Optimistically upsert in the cache
      queryClient.setQueryData<HouseholdIncome[]>([QUERY_KEY, home?.id], (old) => {
        const rows = old ?? []
        const existingIdx = rows.findIndex((r) => r.month.startsWith(input.month.slice(0, 7)))
        const optimistic: HouseholdIncome = {
          id: rows[existingIdx]?.id ?? 'optimistic',
          home_id: home!.id,
          ...input,
        }
        if (existingIdx >= 0) {
          return rows.map((r, i) => (i === existingIdx ? { ...r, ...optimistic } : r))
        }
        return [optimistic, ...rows]
      })

      return { previous }
    },
    mutationFn: async (input: CreateHouseholdIncome) => {
      const validated = createHouseholdIncomeSchema.parse(input)
      const { error } = await supabase
        .from('household_income')
        .upsert({ ...validated, home_id: home!.id }, { onConflict: 'home_id,month' })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Income saved')
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, home?.id], context.previous)
      }
      toast.error(translateError(_err))
    },
    onSettled: invalidate,
  })

  return {
    incomeRows: query.data ?? [],
    getIncomeForMonth,
    setIncome,
    isLoading: query.isLoading,
    error: query.error,
  }
}
