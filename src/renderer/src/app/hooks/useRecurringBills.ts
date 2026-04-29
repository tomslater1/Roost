import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { startOfMonth, addMonths, getDaysInMonth, differenceInCalendarDays } from 'date-fns'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { translateError } from '@/lib/errors'
import { useHome } from './useHome'
import { useRealtime } from './useRealtime'
import {
  recurringBillSchema,
  createRecurringBillSchema,
  updateRecurringBillSchema,
  type RecurringBill,
  type CreateRecurringBill,
  type UpdateRecurringBill,
  type ProRequiredError,
} from '@/lib/schemas/money'

const QUERY_KEY = 'recurring-bills'

function isProRequired(err: unknown): boolean {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message).includes('upgrade_required')
  }
  return false
}

export interface BillOccurrence {
  bill: RecurringBill
  next_date: Date
  days_until: number
}

export function useRecurringBills() {
  const { home } = useHome()
  const queryClient = useQueryClient()

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, home?.id] }),
    [queryClient, home?.id]
  )

  const query = useQuery({
    queryKey: [QUERY_KEY, home?.id],
    enabled: !!home?.id,
    queryFn: async (): Promise<RecurringBill[]> => {
      const { data, error } = await supabase
        .from('recurring_bills')
        .select('*')
        .eq('home_id', home!.id)
        .eq('is_active', true)
        .order('day_of_month', { ascending: true })

      if (error) throw error
      return z.array(recurringBillSchema).parse(data)
    },
  })

  useRealtime({ table: 'recurring_bills', homeId: home?.id, onUpdate: invalidate })

  const bills = query.data ?? []

  // Pure function — works on cached data, no async
  const getBillsForDateRange = useCallback(
    (start: Date, end: Date): BillOccurrence[] => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const results: BillOccurrence[] = []

      for (const bill of bills) {
        // Walk through each month that overlaps with [start, end]
        let monthCursor = startOfMonth(start)
        const endMonth = startOfMonth(end)

        while (monthCursor <= endMonth) {
          const daysInMonth = getDaysInMonth(monthCursor)
          const day = Math.min(bill.day_of_month, daysInMonth)
          const billDate = new Date(
            monthCursor.getFullYear(),
            monthCursor.getMonth(),
            day
          )

          if (billDate >= start && billDate <= end) {
            const days_until = differenceInCalendarDays(billDate, today)
            results.push({ bill, next_date: billDate, days_until })
          }

          monthCursor = addMonths(monthCursor, 1)
        }
      }

      return results.sort((a, b) => a.next_date.getTime() - b.next_date.getTime())
    },
    [bills]
  )

  const addBill = useMutation({
    onMutate: async (input: CreateRecurringBill) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, home?.id] })
      const previous = queryClient.getQueryData<RecurringBill[]>([QUERY_KEY, home?.id])
      const optimistic: RecurringBill = {
        id: 'optimistic-' + Date.now(),
        home_id: home!.id,
        is_active: true,
        sort_order: null,
        category: null,
        colour: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...input,
      }
      queryClient.setQueryData<RecurringBill[]>([QUERY_KEY, home?.id], (old) =>
        [...(old ?? []), optimistic].sort((a, b) => a.day_of_month - b.day_of_month)
      )
      return { previous }
    },
    mutationFn: async (input: CreateRecurringBill) => {
      const validated = createRecurringBillSchema.parse(input)
      const { data, error } = await supabase
        .from('recurring_bills')
        .insert({ ...validated, home_id: home!.id, is_active: true })
        .select()
        .single()

      if (error) {
        if (isProRequired(error)) {
          const proError: ProRequiredError = { code: 'PRO_REQUIRED', feature: 'recurring_bills' }
          throw proError
        }
        throw error
      }
      return recurringBillSchema.parse(data)
    },
    onSuccess: (_data, vars) => {
      toast.success(`"${vars.name}" bill added`)
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, home?.id], context.previous)
      }
      if (_err && typeof _err === 'object' && 'code' in _err && (_err as ProRequiredError).code === 'PRO_REQUIRED') {
        return
      }
      toast.error(translateError(_err))
    },
    onSettled: invalidate,
  })

  const updateBill = useMutation({
    onMutate: async ({ id, data }: { id: string; data: UpdateRecurringBill }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, home?.id] })
      const previous = queryClient.getQueryData<RecurringBill[]>([QUERY_KEY, home?.id])
      queryClient.setQueryData<RecurringBill[]>([QUERY_KEY, home?.id], (old) =>
        old?.map((b) => (b.id === id ? { ...b, ...data } : b)) ?? []
      )
      return { previous }
    },
    mutationFn: async ({ id, data }: { id: string; data: UpdateRecurringBill }) => {
      const validated = updateRecurringBillSchema.parse(data)
      const { error } = await supabase
        .from('recurring_bills')
        .update(validated)
        .eq('id', id)
      if (error) throw error
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, home?.id], context.previous)
      }
      toast.error(translateError(_err))
    },
    onSettled: invalidate,
  })

  const deactivateBill = useMutation({
    onMutate: async ({ id }: { id: string }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, home?.id] })
      const previous = queryClient.getQueryData<RecurringBill[]>([QUERY_KEY, home?.id])
      // Optimistically remove from the active list
      queryClient.setQueryData<RecurringBill[]>([QUERY_KEY, home?.id], (old) =>
        old?.filter((b) => b.id !== id) ?? []
      )
      return { previous }
    },
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('recurring_bills')
        .update({ is_active: false })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => toast.success('Bill deactivated'),
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, home?.id], context.previous)
      }
      toast.error(translateError(_err))
    },
    onSettled: invalidate,
  })

  return {
    bills,
    addBill,
    updateBill,
    deactivateBill,
    getBillsForDateRange,
    isLoading: query.isLoading,
    error: query.error,
  }
}
