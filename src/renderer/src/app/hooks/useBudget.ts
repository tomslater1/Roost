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
  differenceInCalendarMonths,
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
  type Budget,
  type BudgetType,
  type UpsertBudget,
} from '@/lib/schemas/budgets'
import {
  getCategoryMeta,
  type Category,
} from '@/lib/categories'
import type { ExpenseWithSplits } from '@/lib/schemas/expenses'
import { useSubscription } from './useSubscription'

const BUDGETS_KEY = 'budgets'

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
  const { canAccess } = useSubscription()
  const queryClient = useQueryClient()
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const hasBudgetHistory = canAccess('budget_insights')

  const monthKey = format(startOfMonth(selectedMonth), 'yyyy-MM-dd')
  const isCurrentMonth = isSameMonth(selectedMonth, new Date())
  const monthsAhead = differenceInCalendarMonths(startOfMonth(selectedMonth), startOfMonth(new Date()))
  const canGoForward = hasBudgetHistory && monthsAhead < 12

  const prevMonth = useCallback(() => {
    if (!hasBudgetHistory) return
    setSelectedMonth((m) => subMonths(m, 1))
  }, [hasBudgetHistory])
  const nextMonth = useCallback(
    () => setSelectedMonth((m) => {
      if (!hasBudgetHistory) return m
      const next = addMonths(m, 1)
      return differenceInCalendarMonths(startOfMonth(next), startOfMonth(new Date())) <= 12 ? next : m
    }),
    [hasBudgetHistory]
  )

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

  const invalidateBudgets = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [BUDGETS_KEY, home?.id] }),
    [queryClient, home?.id]
  )

  useRealtime({ table: 'budgets', homeId: home?.id, onUpdate: invalidateBudgets })

  // ── Derived data ──────────────────────────────────────────────────────────

  // allCategories is kept as an empty stub — the category system now lives in
  // budget_template_lines (via useBudgetTemplate). Budget.tsx which consumed this
  // is effectively dead code (route redirects to /money).
  const allCategories: Category[] = []

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

    // Budget limits for this month (envelope type only — these are the category
    // spending allowances shown in the budget breakdown UI)
    const budgetsForMonth = budgetsQuery.data.filter(
      (b) => b.month === monthKey && b.budget_type === 'envelope'
    )
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

  // ── Typed accessors by budget_type ────────────────────────────────────────

  /** All fixed-type budgets for the given month, ordered by day_of_month then category. */
  const getFixedBudgets = useCallback(
    (month: Date): Budget[] => {
      if (!budgetsQuery.data) return []
      const key = format(startOfMonth(month), 'yyyy-MM-dd')
      return budgetsQuery.data
        .filter((b) => b.budget_type === 'fixed' && b.month === key)
        .sort((a, b) => {
          const dayA = a.day_of_month ?? 32
          const dayB = b.day_of_month ?? 32
          if (dayA !== dayB) return dayA - dayB
          return a.category.localeCompare(b.category)
        })
    },
    [budgetsQuery.data]
  )

  /** All envelope-type budgets for the given month, ordered by category name. */
  const getEnvelopes = useCallback(
    (month: Date): Budget[] => {
      if (!budgetsQuery.data) return []
      const key = format(startOfMonth(month), 'yyyy-MM-dd')
      return budgetsQuery.data
        .filter((b) => b.budget_type === 'envelope' && b.month === key)
        .sort((a, b) => a.category.localeCompare(b.category))
    },
    [budgetsQuery.data]
  )

  /** Sum of all fixed budget amounts for the given month. */
  const getTotalFixed = useCallback(
    (month: Date): number =>
      getFixedBudgets(month).reduce((sum, b) => sum + Number(b.amount), 0),
    [getFixedBudgets]
  )

  /** Sum of all envelope budget amounts for the given month. */
  const getTotalEnvelopes = useCallback(
    (month: Date): number =>
      getEnvelopes(month).reduce((sum, b) => sum + Number(b.amount), 0),
    [getEnvelopes]
  )

  /**
   * Envelope budget amount minus expenses in that category for the given month.
   * Returns the full envelope amount if no expenses exist yet.
   */
  const getRemainingInEnvelope = useCallback(
    (category: string, month: Date): number => {
      if (!budgetsQuery.data) return 0
      const key = format(startOfMonth(month), 'yyyy-MM-dd')
      const budget = budgetsQuery.data.find(
        (b) => b.budget_type === 'envelope' && b.category === category && b.month === key
      )
      if (!budget) return 0

      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)
      const categorySpend = expenses
        .filter((e) => {
          try {
            const d = parseISO(e.date)
            return isWithinInterval(d, { start: monthStart, end: monthEnd }) && e.category === category
          } catch {
            return false
          }
        })
        .reduce((sum, e) => sum + Number(e.amount), 0)

      return Number(budget.amount) - categorySpend
    },
    [budgetsQuery.data, expenses]
  )

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

  /**
   * Quiet batch upsert — no toast per row, no activity log.
   * Used for carry-forward, preset template setup, and one-off migrations.
   */
  const batchUpsertBudgets = useMutation({
    mutationFn: async (rows: UpsertBudget[]) => {
      if (!home?.id || rows.length === 0) return
      const inserts = rows.map((r) => ({ ...r, home_id: home!.id }))
      const { error } = await supabase
        .from('budgets')
        .upsert(inserts, { onConflict: 'home_id,category,month' })
      if (error) throw error
    },
    onError: (err) => toast.error(translateError(err)),
    onSettled: invalidateBudgets,
  })

  /**
   * One-time migration: copies active recurring_bills rows into the budgets
   * table as budget_type = 'fixed' for the current month.
   *
   * Guards:
   *  - Only runs if there are recurring_bills rows for this home.
   *  - Skips if fixed budget rows already exist for the current month.
   *
   * Intended to be called once on app boot (fire-and-forget, no toast on
   * success). The caller should not await; errors are swallowed silently.
   */
  const migrateRecurringBillsToBudgets = useMutation({
    mutationFn: async () => {
      if (!home?.id) return

      const currentMonthKey = format(startOfMonth(new Date()), 'yyyy-MM-dd')

      // Guard: check for existing fixed budgets this month
      const { data: existingFixed, error: fixedErr } = await supabase
        .from('budgets')
        .select('id')
        .eq('home_id', home.id)
        .eq('budget_type', 'fixed')
        .eq('month', currentMonthKey)
        .limit(1)

      if (fixedErr) throw fixedErr
      if (existingFixed && existingFixed.length > 0) return // already migrated

      // Read active recurring bills
      const { data: bills, error: billsErr } = await supabase
        .from('recurring_bills')
        .select('name, amount, day_of_month, category')
        .eq('home_id', home.id)
        .eq('is_active', true)

      if (billsErr) throw billsErr
      if (!bills || bills.length === 0) return // nothing to migrate

      // Insert fixed budget rows, one per bill
      const inserts = bills.map((bill) => ({
        home_id: home.id,
        category: bill.name,
        month: currentMonthKey,
        amount: bill.amount,
        budget_type: 'fixed' as BudgetType,
        day_of_month: bill.day_of_month ?? null,
      }))

      const { error: insertErr } = await supabase
        .from('budgets')
        .upsert(inserts, { onConflict: 'home_id,category,month' })

      if (insertErr) throw insertErr
    },
    onSettled: invalidateBudgets,
    // Silent — no toast on success or error; this is a background migration.
  })

  return {
    summary,
    allCategories,
    rawBudgets: budgetsQuery.data ?? [],
    isLoading: budgetsQuery.isLoading,
    isError: budgetsQuery.isError,
    selectedMonth,
    prevMonth,
    nextMonth,
    isCurrentMonth,
    hasBudgetHistory,
    canGoForward,
    monthsAhead,
    // Typed accessors
    getFixedBudgets,
    getEnvelopes,
    getTotalFixed,
    getTotalEnvelopes,
    getRemainingInEnvelope,
    // Mutations
    upsertBudget,
    batchUpsertBudgets,
    deleteBudget,
    migrateRecurringBillsToBudgets,
  }
}
