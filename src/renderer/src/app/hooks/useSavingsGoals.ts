import { useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { translateError } from '@/lib/errors'
import { useHome } from './useHome'
import { useRealtime } from './useRealtime'
import {
  savingsGoalSchema,
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  type SavingsGoal,
  type CreateSavingsGoal,
  type UpdateSavingsGoal,
  type ProRequiredError,
} from '@/lib/schemas/money'

const QUERY_KEY = 'savings-goals'
const TEMPLATE_QUERY_KEY = 'budget-template-lines'

function isProRequired(err: unknown): boolean {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: string }).message).includes('upgrade_required')
  }
  return false
}

export function useSavingsGoals() {
  const { home } = useHome()
  const queryClient = useQueryClient()

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, home?.id] }),
    [queryClient, home?.id]
  )

  const invalidateTemplate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [TEMPLATE_QUERY_KEY, home?.id] }),
    [queryClient, home?.id]
  )

  const query = useQuery({
    queryKey: [QUERY_KEY, home?.id],
    enabled: !!home?.id,
    queryFn: async (): Promise<SavingsGoal[]> => {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('home_id', home!.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error
      return z.array(savingsGoalSchema).parse(data)
    },
  })

  useRealtime({ table: 'savings_goals', homeId: home?.id, onUpdate: invalidate })

  const goals = query.data ?? []

  const activeGoals = useMemo(() => goals.filter((g) => !g.is_complete), [goals])
  const completedGoals = useMemo(() => goals.filter((g) => !!g.is_complete), [goals])

  // ── Helper: create or update the linked budget line for a goal ─────────────

  async function upsertGoalBudgetLine(opts: {
    homeId: string
    goalName: string
    amount: number
    day: number
    existingLineId?: string | null
  }): Promise<string> {
    if (opts.existingLineId) {
      // Update existing line
      const { error } = await supabase
        .from('budget_template_lines')
        .update({
          name: opts.goalName,
          amount: opts.amount,
          day_of_month: opts.day,
          updated_at: new Date().toISOString(),
        })
        .eq('id', opts.existingLineId)
      if (error) throw error
      return opts.existingLineId
    } else {
      // Create new line
      const { data, error } = await supabase
        .from('budget_template_lines')
        .insert({
          home_id: opts.homeId,
          name: opts.goalName,
          amount: opts.amount,
          budget_type: 'fixed',
          section_group: 'goals',
          day_of_month: opts.day,
          is_active: true,
          sort_order: 0,
        })
        .select('id')
        .single()
      if (error) throw error
      return data.id
    }
  }

  async function deactivateGoalBudgetLine(lineId: string) {
    const { error } = await supabase
      .from('budget_template_lines')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', lineId)
    if (error) throw error
  }

  // ── addGoal ────────────────────────────────────────────────────────────────

  const addGoal = useMutation({
    onMutate: async (input: CreateSavingsGoal) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, home?.id] })
      const previous = queryClient.getQueryData<SavingsGoal[]>([QUERY_KEY, home?.id])
      const optimistic: SavingsGoal = {
        id: 'optimistic-' + Date.now(),
        home_id: home!.id,
        current_amount: 0,
        is_complete: false,
        completed_at: null,
        sort_order: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...input,
      }
      queryClient.setQueryData<SavingsGoal[]>([QUERY_KEY, home?.id], (old) =>
        [...(old ?? []), optimistic]
      )
      return { previous }
    },
    mutationFn: async (input: CreateSavingsGoal) => {
      const validated = createSavingsGoalSchema.parse(input)
      const { data, error } = await supabase
        .from('savings_goals')
        .insert({ ...validated, home_id: home!.id })
        .select()
        .single()

      if (error) {
        if (isProRequired(error)) {
          const proError: ProRequiredError = { code: 'PRO_REQUIRED', feature: 'savings_goals' }
          throw proError
        }
        throw error
      }

      const goal = savingsGoalSchema.parse(data)

      // Feature 1: create a budget line if monthly_contribution is set
      if (input.monthly_contribution && input.monthly_contribution > 0) {
        const day = input.contribution_day ?? 1
        const lineId = await upsertGoalBudgetLine({
          homeId: home!.id,
          goalName: goal.name,
          amount: input.monthly_contribution,
          day,
        })
        // Link the budget line back to the goal
        await supabase
          .from('savings_goals')
          .update({ budget_line_id: lineId })
          .eq('id', goal.id)
        invalidateTemplate()
      }

      return goal
    },
    onSuccess: (_data, vars) => {
      toast.success(`"${vars.name}" goal added`)
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

  // ── updateGoal ─────────────────────────────────────────────────────────────

  const updateGoal = useMutation({
    onMutate: async ({ id, data }: { id: string; data: UpdateSavingsGoal }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, home?.id] })
      const previous = queryClient.getQueryData<SavingsGoal[]>([QUERY_KEY, home?.id])
      queryClient.setQueryData<SavingsGoal[]>([QUERY_KEY, home?.id], (old) =>
        old?.map((g) => (g.id === id ? { ...g, ...data } : g)) ?? []
      )
      return { previous }
    },
    mutationFn: async ({ id, data }: { id: string; data: UpdateSavingsGoal }) => {
      const validated = updateSavingsGoalSchema.parse(data)
      const { error } = await supabase
        .from('savings_goals')
        .update(validated)
        .eq('id', id)
      if (error) throw error

      // Feature 1: sync budget line if name, contribution, or day changes
      const goal = goals.find((g) => g.id === id)
      if (goal?.budget_line_id) {
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (data.name && data.name !== goal.name) updates.name = data.name
        if (data.monthly_contribution != null) updates.amount = data.monthly_contribution
        if (data.contribution_day != null) updates.day_of_month = data.contribution_day
        if (Object.keys(updates).length > 1) {
          await supabase
            .from('budget_template_lines')
            .update(updates)
            .eq('id', goal.budget_line_id)
          invalidateTemplate()
        }
      }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, home?.id], context.previous)
      }
      toast.error(translateError(_err))
    },
    onSettled: invalidate,
  })

  // ── deleteGoal ─────────────────────────────────────────────────────────────

  const deleteGoal = useMutation({
    onMutate: async ({ id }: { id: string }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, home?.id] })
      const previous = queryClient.getQueryData<SavingsGoal[]>([QUERY_KEY, home?.id])
      queryClient.setQueryData<SavingsGoal[]>([QUERY_KEY, home?.id], (old) =>
        old?.filter((g) => g.id !== id) ?? []
      )
      return { previous }
    },
    mutationFn: async ({ id }: { id: string }) => {
      // Feature 1: deactivate budget line before deleting goal
      const goal = goals.find((g) => g.id === id)
      if (goal?.budget_line_id) {
        await deactivateGoalBudgetLine(goal.budget_line_id)
        invalidateTemplate()
      }
      const { error } = await supabase.from('savings_goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => toast.success('Goal removed'),
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, home?.id], context.previous)
      }
      toast.error(translateError(_err))
    },
    onSettled: invalidate,
  })

  // ── completeGoal ───────────────────────────────────────────────────────────

  const completeGoal = useMutation({
    onMutate: async ({ id }: { id: string }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, home?.id] })
      const previous = queryClient.getQueryData<SavingsGoal[]>([QUERY_KEY, home?.id])
      const now = new Date().toISOString()
      queryClient.setQueryData<SavingsGoal[]>([QUERY_KEY, home?.id], (old) =>
        old?.map((g) =>
          g.id === id ? { ...g, is_complete: true, completed_at: now } : g
        ) ?? []
      )
      return { previous }
    },
    mutationFn: async ({ id }: { id: string }) => {
      // Feature 1: deactivate budget line when goal is completed
      const goal = goals.find((g) => g.id === id)
      if (goal?.budget_line_id) {
        await deactivateGoalBudgetLine(goal.budget_line_id)
        invalidateTemplate()
      }
      const { error } = await supabase
        .from('savings_goals')
        .update({ is_complete: true, completed_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => toast.success('Goal completed!'),
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, home?.id], context.previous)
      }
      toast.error(translateError(_err))
    },
    onSettled: invalidate,
  })

  // ── addToGoal ──────────────────────────────────────────────────────────────

  const addToGoal = useMutation({
    onMutate: async ({ id, amount }: { id: string; amount: number }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, home?.id] })
      const previous = queryClient.getQueryData<SavingsGoal[]>([QUERY_KEY, home?.id])
      queryClient.setQueryData<SavingsGoal[]>([QUERY_KEY, home?.id], (old) =>
        old?.map((g) =>
          g.id === id ? { ...g, current_amount: g.current_amount + amount } : g
        ) ?? []
      )
      return { previous }
    },
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const { data: current, error: fetchErr } = await supabase
        .from('savings_goals')
        .select('current_amount')
        .eq('id', id)
        .single()
      if (fetchErr) throw fetchErr

      const { error } = await supabase
        .from('savings_goals')
        .update({ current_amount: Number(current.current_amount) + amount })
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

  // ── setGoalContribution ────────────────────────────────────────────────────

  const setGoalContribution = useMutation({
    mutationFn: async ({ id, amount, day }: { id: string; amount: number; day: number }) => {
      const goal = goals.find((g) => g.id === id)
      if (!goal || !home?.id) throw new Error('Goal not found')

      const lineId = await upsertGoalBudgetLine({
        homeId: home.id,
        goalName: goal.name,
        amount,
        day,
        existingLineId: goal.budget_line_id,
      })

      // Re-activate line if it was previously deactivated
      if (goal.budget_line_id) {
        await supabase
          .from('budget_template_lines')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('id', lineId)
      }

      const { error } = await supabase
        .from('savings_goals')
        .update({ monthly_contribution: amount, contribution_day: day, budget_line_id: lineId })
        .eq('id', id)
      if (error) throw error
      invalidateTemplate()
    },
    onError: (err) => toast.error(translateError(err)),
    onSettled: invalidate,
  })

  // ── removeGoalContribution ─────────────────────────────────────────────────

  const removeGoalContribution = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const goal = goals.find((g) => g.id === id)
      if (!goal) throw new Error('Goal not found')

      if (goal.budget_line_id) {
        await deactivateGoalBudgetLine(goal.budget_line_id)
        invalidateTemplate()
      }

      const { error } = await supabase
        .from('savings_goals')
        .update({ monthly_contribution: null, budget_line_id: null })
        .eq('id', id)
      if (error) throw error
    },
    onError: (err) => toast.error(translateError(err)),
    onSettled: invalidate,
  })

  return {
    goals,
    activeGoals,
    completedGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
    addToGoal,
    setGoalContribution,
    removeGoalContribution,
    isLoading: query.isLoading,
    error: query.error,
  }
}
