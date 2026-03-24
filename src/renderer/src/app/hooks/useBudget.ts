import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  format,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
  subMonths,
  addMonths,
  isSameMonth,
} from 'date-fns'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { logActivity } from '@/lib/activity'
import { translateError } from '@/lib/errors'
import { useAuthContext } from '@/context/AuthContext'
import { useHome } from './useHome'
import { useRealtime } from './useRealtime'
import {
  budgetSchema,
  customCategorySchema,
  type Budget,
  type CustomCategory,
  type UpsertBudget,
  type CreateCustomCategory,
} from '@/lib/schemas/budgets'
import {
  mergeCategories,
  getCategoryMeta,
  type Category,
} from '@/lib/categories'
import { normalizeInput } from '@/lib/normalizeInput'
import type { ExpenseWithSplits } from '@/lib/schemas/expenses'

const BUDGETS_KEY = 'budgets'
const CUSTOM_CATS_KEY = 'custom-categories'

export interface CategoryBudgetRow {
  category: Category
  spend: number
  limit: number | null
  pct: number
  isOver: boolean
  budgetId?: string
}

export interface BudgetSummary {
  budgeted: CategoryBudgetRow[]
  unbudgeted: CategoryBudgetRow[]
  totalBudget: number
  totalSpend: number
  totalPct: number
}

export function useBudget({ expenses }: { expenses: ExpenseWithSplits[] }) {
  const { user } = useAuthContext()
  const { home } = useHome()
  const queryClient = useQueryClient()
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())

  const monthKey = format(startOfMonth(selectedMonth), 'yyyy-MM-dd')
  const isCurrentMonth = isSameMonth(selectedMonth, new Date())

  const prevMonth = useCallback(() => setSelectedMonth((m) => subMonths(m, 1)), [])
  const nextMonth = useCallback(() => setSelectedMonth((m) => addMonths(m, 1)), [])

  // ── Queries ───────────────────────────────────────────────────────────────

  const budgetsQuery = useQuery({
    queryKey: [BUDGETS_KEY, home?.id],
    enabled: !!home?.id,
    queryFn: async (): Promise<Budget[]> => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('home_id', home!.id)
      if (error) throw error
      return z.array(budgetSchema).parse(data)
    },
  })

  const customCatsQuery = useQuery({
    queryKey: [CUSTOM_CATS_KEY, home?.id],
    enabled: !!home?.id,
    queryFn: async (): Promise<CustomCategory[]> => {
      const { data, error } = await supabase
        .from('home_custom_categories')
        .select('*')
        .eq('home_id', home!.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return z.array(customCategorySchema).parse(data)
    },
  })

  const invalidateBudgets = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [BUDGETS_KEY, home?.id] }),
    [queryClient, home?.id]
  )
  const invalidateCustomCats = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [CUSTOM_CATS_KEY, home?.id] }),
    [queryClient, home?.id]
  )

  useRealtime({ table: 'budgets', homeId: home?.id, onUpdate: invalidateBudgets })
  useRealtime({ table: 'home_custom_categories', homeId: home?.id, onUpdate: invalidateCustomCats })

  // ── Derived data ──────────────────────────────────────────────────────────

  const allCategories = useMemo(
    () => mergeCategories(customCatsQuery.data ?? []),
    [customCatsQuery.data]
  )

  const summary = useMemo((): BudgetSummary | null => {
    if (!budgetsQuery.data) return null

    const monthStart = startOfMonth(selectedMonth)
    const monthEnd = endOfMonth(selectedMonth)

    // Sum spend per category for this month
    const spendByCategory: Record<string, number> = {}
    for (const e of expenses) {
      try {
        const d = parseISO(e.date)
        if (!isWithinInterval(d, { start: monthStart, end: monthEnd })) continue
      } catch {
        continue
      }
      const key = e.category ?? '__uncategorised__'
      spendByCategory[key] = (spendByCategory[key] ?? 0) + Number(e.amount)
    }

    // Budget limits for this month
    const budgetsForMonth = budgetsQuery.data.filter((b) => b.month === monthKey)
    const limitByCategory: Record<string, { amount: number; id: string }> = {}
    for (const b of budgetsForMonth) {
      limitByCategory[b.category] = { amount: Number(b.amount), id: b.id }
    }

    const budgeted: CategoryBudgetRow[] = []
    const unbudgeted: CategoryBudgetRow[] = []

    // Go through all known categories
    const seenNames = new Set<string>()
    for (const cat of allCategories) {
      seenNames.add(cat.name)
      const spend = spendByCategory[cat.name] ?? 0
      const budgetEntry = limitByCategory[cat.name]
      const limit = budgetEntry?.amount ?? null

      if (limit === null && spend === 0) continue // nothing to show

      const pct = limit ? Math.min((spend / limit) * 100, 100) : 0
      const row: CategoryBudgetRow = {
        category: cat,
        spend,
        limit,
        pct,
        isOver: limit !== null && spend > limit,
        budgetId: budgetEntry?.id,
      }
      if (limit !== null) budgeted.push(row)
      else unbudgeted.push(row)
    }

    // Handle orphaned category strings (old expenses with category values not in allCategories)
    for (const [name, spend] of Object.entries(spendByCategory)) {
      if (seenNames.has(name) || name === '__uncategorised__') continue
      const cat = getCategoryMeta(name, allCategories)
      const budgetEntry = limitByCategory[name]
      const limit = budgetEntry?.amount ?? null
      const pct = limit ? Math.min((spend / limit) * 100, 100) : 0
      const row: CategoryBudgetRow = { category: cat, spend, limit, pct, isOver: limit !== null && spend > limit, budgetId: budgetEntry?.id }
      if (limit !== null) budgeted.push(row)
      else unbudgeted.push(row)
    }

    // Uncategorised bucket
    const uncatSpend = spendByCategory['__uncategorised__'] ?? 0
    if (uncatSpend > 0) {
      unbudgeted.push({
        category: { name: 'No category', emoji: '❓', color: 'slate' },
        spend: uncatSpend,
        limit: null,
        pct: 0,
        isOver: false,
      })
    }

    const totalBudget = budgeted.reduce((s, r) => s + (r.limit ?? 0), 0)
    const totalSpend = Object.values(spendByCategory).reduce((s, v) => s + v, 0)
    const totalPct = totalBudget > 0 ? Math.min((totalSpend / totalBudget) * 100, 100) : 0

    return { budgeted, unbudgeted, totalBudget, totalSpend, totalPct }
  }, [budgetsQuery.data, allCategories, expenses, selectedMonth, monthKey])

  // ── Mutations ─────────────────────────────────────────────────────────────

  const upsertBudget = useMutation({
    mutationFn: async (data: UpsertBudget) => {
      const { error } = await supabase
        .from('budgets')
        .upsert({ ...data, home_id: home!.id }, { onConflict: 'home_id,category,month' })
      if (error) throw error
    },
    onSuccess: async (_data, vars) => {
      toast.success(`Budget set for ${vars.category}`)
      await logActivity({
        homeId: home!.id,
        userId: user!.id,
        action: `set a £${vars.amount} budget for ${vars.category}`,
        entityType: 'budget',
      })
    },
    onError: (err) => toast.error(translateError(err)),
    onSettled: invalidateBudgets,
  })

  const deleteBudget = useMutation({
    onMutate: async ({ id }: { id: string }) => {
      await queryClient.cancelQueries({ queryKey: [BUDGETS_KEY, home?.id] })
      const previous = queryClient.getQueryData<Budget[]>([BUDGETS_KEY, home?.id])
      queryClient.setQueryData<Budget[]>([BUDGETS_KEY, home?.id], (old) =>
        old?.filter((b) => b.id !== id) ?? []
      )
      return { previous }
    },
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from('budgets').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => toast.success('Budget removed'),
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([BUDGETS_KEY, home?.id], context.previous)
      }
      toast.error(translateError(_err))
    },
    onSettled: invalidateBudgets,
  })

  const addCustomCategory = useMutation({
    mutationFn: async (data: CreateCustomCategory) => {
      const { text: name } = await normalizeInput(data.name, 'budget').catch(() => ({ text: data.name }))
      const { error } = await supabase
        .from('home_custom_categories')
        .insert({ ...data, name, home_id: home!.id })
      if (error) throw error
    },
    onSuccess: (_data, vars) => toast.success(`"${vars.name}" added as a category`),
    onError: (err) => toast.error(translateError(err)),
    onSettled: invalidateCustomCats,
  })

  const deleteCustomCategory = useMutation({
    onMutate: async ({ id }: { id: string }) => {
      await queryClient.cancelQueries({ queryKey: [CUSTOM_CATS_KEY, home?.id] })
      const previous = queryClient.getQueryData<CustomCategory[]>([CUSTOM_CATS_KEY, home?.id])
      queryClient.setQueryData<CustomCategory[]>([CUSTOM_CATS_KEY, home?.id], (old) =>
        old?.filter((c) => c.id !== id) ?? []
      )
      return { previous }
    },
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from('home_custom_categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => toast.success('Category removed'),
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([CUSTOM_CATS_KEY, home?.id], context.previous)
      }
      toast.error(translateError(_err))
    },
    onSettled: invalidateCustomCats,
  })

  return {
    summary,
    allCategories,
    customCategories: customCatsQuery.data ?? [],
    rawBudgets: budgetsQuery.data ?? [],
    isLoading: budgetsQuery.isLoading || customCatsQuery.isLoading,
    isError: budgetsQuery.isError || customCatsQuery.isError,
    selectedMonth,
    prevMonth,
    nextMonth,
    isCurrentMonth,
    upsertBudget,
    deleteBudget,
    addCustomCategory,
    deleteCustomCategory,
  }
}
