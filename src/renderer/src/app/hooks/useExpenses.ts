import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { logActivity } from '@/lib/activity'
import { translateError } from '@/lib/errors'
import { formatCurrency } from '@/lib/utils'
import { useAuthContext } from '@/context/AuthContext'
import { useHome } from './useHome'
import { useRealtime } from './useRealtime'
import { z } from 'zod'
import { expenseSchema, expenseWithSplitsSchema, type ExpenseWithSplits, type CreateExpense } from '@/lib/schemas/expenses'
import { customCategorySchema } from '@/lib/schemas/budgets'
import { normalizeInput } from '@/lib/normalizeInput'
import { mergeCategories } from '@/lib/categories'

const QUERY_KEY = 'expenses'

export function useExpenses() {
  const { user } = useAuthContext()
  const { home, members } = useHome()
  const queryClient = useQueryClient()

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, home?.id] }),
    [queryClient, home?.id]
  )

  // Household categories — shared cache with useBudget (same query key).
  // Used to give Hazel the exact category list for this home when normalizing expenses.
  const customCatsQuery = useQuery({
    queryKey: ['custom-categories', home?.id],
    enabled: !!home?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_custom_categories')
        .select('*')
        .eq('home_id', home!.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return z.array(customCategorySchema).parse(data)
    },
  })

  const allCategoryNames = mergeCategories(customCatsQuery.data ?? []).map((c) => c.name)

  // Fetch expenses with their splits in one round trip.
  // The balance and settle-up flow both require split data.
  const query = useQuery({
    queryKey: [QUERY_KEY, home?.id],
    enabled: !!home?.id,
    queryFn: async (): Promise<ExpenseWithSplits[]> => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, expense_splits(*)')
        .eq('home_id', home!.id)
        .order('date', { ascending: false })

      if (error) throw error
      return z.array(expenseWithSplitsSchema).parse(data)
    },
  })

  // Subscribe to expenses changes (standard home_id filter)
  useRealtime({
    table: 'expenses',
    homeId: home?.id,
    onUpdate: invalidate,
    filter: `home_id=eq.${home?.id}`,
  })

  // Subscribe to expense_splits changes without a filter (no home_id column).
  // RLS scopes what the user receives. When a split is settled on one device
  // the other sees the balance update in real time.
  useRealtime({
    table: 'expense_splits',
    homeId: home?.id,
    onUpdate: invalidate,
  })

  // ── Balance calculation ────────────────────────────────────────────────────
  // Derived from unsettled splits, not raw expense amounts.
  // Positive = I am owed money. Negative = I owe money.
  const partner = members.find((m) => m.user_id !== user?.id)

  const balance = (() => {
    if (!user || !query.data || !partner) return 0
    return query.data.reduce((total, expense) => {
      const splits = expense.expense_splits ?? []

      // Solo expenses (personal expenses) have no splits and don't affect the balance
      if (expense.split_type === 'solo') return total

      if (splits.length === 0) {
        // Fallback for expenses without splits (legacy or failed insert)
        const half = Number(expense.amount) / 2
        return expense.paid_by === user.id ? total + half : total - half
      }

      for (const split of splits) {
        if (split.settled) continue
        // Partner's unsettled split on an expense I paid → they owe me
        if (split.user_id === partner.user_id && expense.paid_by === user.id) {
          total += Number(split.amount)
        }
        // My unsettled split on an expense partner paid → I owe them
        if (split.user_id === user.id && expense.paid_by !== user.id) {
          total -= Number(split.amount)
        }
      }
      return total
    }, 0)
  })()

  // Totals for the summary card (all-time, regardless of settlement status)
  const totals = (() => {
    if (!user || !query.data) return { myPaid: 0, theirPaid: 0, total: 0 }
    return query.data.reduce(
      (acc, expense) => {
        const amt = Number(expense.amount)
        if (expense.paid_by === user.id) acc.myPaid += amt
        else acc.theirPaid += amt
        acc.total += amt
        return acc
      },
      { myPaid: 0, theirPaid: 0, total: 0 }
    )
  })()

  // ── Mutations ─────────────────────────────────────────────────────────────

  const addExpense = useMutation({
    mutationFn: async (expense: CreateExpense) => {
      // Pass the household's category names so Hazel assigns from what the user actually has.
      const { text: title, category: rawSuggested } = await normalizeInput(expense.title, 'expense', allCategoryNames).catch(() => ({ text: expense.title, category: undefined }))
      // Hard-clamp Hazel's output to the household's known categories.
      // If she returns something not in the list (e.g. an old preset the user hasn't added),
      // fall back to 'Other' which is always present as a built-in.
      const validCategorySet = new Set(allCategoryNames)
      const suggestedCategory = rawSuggested && validCategorySet.has(rawSuggested) ? rawSuggested : rawSuggested ? 'Other' : undefined
      // Use Hazel's suggestion only if the user didn't manually pick a category.
      // Use || not ?? so that empty string "" also falls through to suggestedCategory.
      const category = expense.category || suggestedCategory
      const { recurrence_interval, ...rest } = { ...expense, title, category }
      const payload = {
        ...rest,
        home_id: home!.id,
        // Only include recurrence_interval when recurring with a valid value.
        // Omitting the key entirely avoids the check constraint for non-recurring rows.
        ...(expense.is_recurring && recurrence_interval
          ? { recurrence_interval }
          : {}),
      }
      const { data, error } = await supabase
        .from('expenses')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      if (expense.split_type === 'equal' && members.length > 0) {
        const splitAmount = Number(expense.amount) / members.length
        const splits = members.map((member) => ({
          expense_id: data.id,
          user_id: member.user_id,
          amount: splitAmount,
          // The person who paid has already settled their own share
          settled: member.user_id === expense.paid_by,
        }))
        const { error: splitError } = await supabase.from('expense_splits').insert(splits)
        if (splitError) throw splitError
      }

      // Parse the inserted expense row — splits are fetched on onSettled invalidation
      return { ...expenseSchema.parse(data), expense_splits: [] }
    },
    onSuccess: async (data) => {
      await logActivity({
        homeId: home!.id,
        userId: user!.id,
        action: `logged ${formatCurrency(data.amount)} for ${data.title}`,
        entityType: 'expense',
        entityId: data.id,
      })
      toast.success(`"${data.title}" logged`)
    },
    onError: (_err) => {
      toast.error(translateError(_err))
    },
    onSettled: invalidate,
  })

  const deleteExpense = useMutation({
    onMutate: async ({ id }: { id: string; title: string }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, home?.id] })
      const previous = queryClient.getQueryData<ExpenseWithSplits[]>([QUERY_KEY, home?.id])
      queryClient.setQueryData<ExpenseWithSplits[]>([QUERY_KEY, home?.id], (old) =>
        old?.filter((expense) => expense.id !== id) ?? []
      )
      return { previous }
    },
    mutationFn: async ({ id }: { id: string; title: string }) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async (_data, { title }) => {
      toast.success(`"${title}" removed`)
      await logActivity({
        homeId: home!.id,
        userId: user!.id,
        action: `removed the expense "${title}"`,
        entityType: 'expense',
      })
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, home?.id], context.previous)
      }
      toast.error(translateError(_err))
    },
    onSettled: invalidate,
  })

  const settleUp = useMutation({
    mutationFn: async ({
      debtorId,
      creditorId,
      amount,
      note,
    }: {
      debtorId: string
      creditorId: string
      amount: number
      note?: string
    }) => {
      const { error } = await supabase.rpc('settle_up', {
        p_home_id: home!.id,
        p_debtor_id: debtorId,
        p_creditor_id: creditorId,
        p_amount: amount,
        p_note: note ?? null,
      })
      if (error) throw error
    },
    onSuccess: async (_data, { debtorId, amount }) => {
      const debtorName =
        debtorId === user?.id
          ? 'You'
          : (partner?.display_name ?? 'Your partner')
      await logActivity({
        homeId: home!.id,
        userId: user!.id,
        action: `${debtorName === 'You' ? 'settled up' : `${debtorName} settled up`} (${formatCurrency(amount)})`,
        entityType: 'expense',
      })
      toast.success('All settled up!')
      // Invalidate both expenses (splits changed) and settlements (new record)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, home?.id] })
      queryClient.invalidateQueries({ queryKey: ['settlements', home?.id] })
    },
    onError: (error) => {
      toast.error(translateError(error))
    },
  })

  return {
    expenses: query.data ?? [],
    isLoading: query.isLoading,
    isAdding: addExpense.isPending,
    isError: query.isError,
    refetch: query.refetch,
    balance,
    totals,
    partner,
    members,
    addExpense,
    deleteExpense,
    settleUp,
  }
}
