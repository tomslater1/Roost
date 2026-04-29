import { useCallback, useMemo } from 'react'
import type { Category } from '@/lib/categories'
import { deriveCategoryColour } from '@/lib/categories'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { translateError } from '@/lib/errors'
import { useHome } from './useHome'
import { useRealtime } from './useRealtime'

// ── Schema & types ─────────────────────────────────────────────────────────────

const budgetTemplateLineSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  name: z.string(),
  amount: z.coerce.number(),
  budget_type: z.enum(['fixed', 'envelope']),
  section_group: z.string(),
  day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  note: z.string().nullable().optional(),
  is_active: z.boolean(),
  sort_order: z.number().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  member1_percentage: z.coerce.number().min(0).max(100).default(50),
  // Feature 3 — annual costs
  is_annual: z.boolean().default(false).optional(),
  annual_amount: z.coerce.number().nullable().optional(),
  // Feature 4 — rollover
  rollover_enabled: z.boolean().default(false).optional(),
  // Feature 5 — ownership
  ownership: z.enum(['shared', 'member1', 'member2']).default('shared').optional(),
  // Session 36 — last amount tracking for month-on-month comparison
  last_amount: z.coerce.number().nullable().optional(),
  amount_changed_at: z.string().nullable().optional(),
})

export type BudgetTemplateLine = z.infer<typeof budgetTemplateLineSchema>

export interface AddTemplateLineData {
  name: string
  amount: number
  budget_type: 'fixed' | 'envelope'
  section_group: string
  day_of_month?: number | null
  note?: string | null
  sort_order?: number
  is_annual?: boolean
  annual_amount?: number | null
  rollover_enabled?: boolean
  ownership?: 'shared' | 'member1' | 'member2'
}

export interface UpdateTemplateLineData {
  name?: string
  amount?: number
  day_of_month?: number | null
  note?: string | null
  sort_order?: number
  section_group?: string
  member1_percentage?: number
  is_annual?: boolean
  annual_amount?: number | null
  rollover_enabled?: boolean
  ownership?: 'shared' | 'member1' | 'member2'
}

// ── Section group → budget_type mapping ───────────────────────────────────────

const FIXED_SECTIONS = new Set(['housing-bills', 'subscriptions-leisure', 'transport'])

/** Best-effort heuristic: map an existing budget category name to a section_group */
function guessSectionGroup(name: string, budgetType: string): string {
  const n = name.toLowerCase()

  if (budgetType === 'fixed') {
    if (/rent|mortgage|council|tax|gas|electr|water|broadband|internet|insurance|tv licen|phone/.test(n)) {
      return 'housing-bills'
    }
    if (/netflix|spotify|disney|amazon|gym|fitness|subscription|game pass|icloud/.test(n)) {
      return 'subscriptions-leisure'
    }
    if (/transport|fuel|car|parking|taxi|uber|train|bus|tube|petrol/.test(n)) {
      return 'transport'
    }
    return 'housing-bills'
  }

  // envelope
  if (/grocer|food|eating|takeaway|coffee|café|cafe|lunch|restaurant/.test(n)) {
    return 'food-drink'
  }
  if (/household|clean|toilet|home item/.test(n)) {
    return 'household'
  }
  if (/personal|clothing|clothes|haircut|hair|gift|health|wellbeing/.test(n)) {
    return 'personal'
  }
  if (/saving|emergency|holiday|isa|fund/.test(n)) {
    return 'savings'
  }
  return 'food-drink'
}

// ── Hook ───────────────────────────────────────────────────────────────────────

const QUERY_KEY = 'budget-template-lines'

export function useBudgetTemplate() {
  const { home } = useHome()
  const queryClient = useQueryClient()

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, home?.id] }),
    [queryClient, home?.id]
  )

  // ── Query ──────────────────────────────────────────────────────────────────

  const query = useQuery({
    queryKey: [QUERY_KEY, home?.id],
    enabled: !!home?.id,
    queryFn: async (): Promise<BudgetTemplateLine[]> => {
      const { data, error } = await supabase
        .from('budget_template_lines')
        .select('*')
        .eq('home_id', home!.id)
        .eq('is_active', true)
        .order('section_group')
        .order('sort_order')
        .order('created_at')

      if (error) throw error
      return z.array(budgetTemplateLineSchema).parse(data)
    },
  })

  useRealtime({ table: 'budget_template_lines', homeId: home?.id, onUpdate: invalidate })

  // ── Migration from existing budgets table ──────────────────────────────────
  //
  // If templateLines is empty but the home has existing budgets rows, migrate
  // them into budget_template_lines silently on first load. Runs once,
  // idempotent (guard: templateLines.length === 0).

  const migrate = useMutation({
    mutationFn: async () => {
      if (!home?.id) return
      if ((query.data?.length ?? 0) > 0) return // already have template lines

      // Check for existing budgets
      const { data: existingBudgets, error: budgetsErr } = await supabase
        .from('budgets')
        .select('*')
        .eq('home_id', home.id)

      if (budgetsErr) throw budgetsErr
      if (!existingBudgets || existingBudgets.length === 0) return

      // Deduplicate by category (take highest amount per category)
      const seenCategories = new Map<string, typeof existingBudgets[number]>()
      for (const b of existingBudgets) {
        const key = b.category.toLowerCase()
        const existing = seenCategories.get(key)
        if (!existing || Number(b.amount) > Number(existing.amount)) {
          seenCategories.set(key, b)
        }
      }

      const inserts = Array.from(seenCategories.values()).map((b, i) => ({
        home_id: home.id,
        name: b.category,
        amount: Number(b.amount),
        budget_type: (b.budget_type ?? 'envelope') as 'fixed' | 'envelope',
        section_group: guessSectionGroup(b.category, b.budget_type ?? 'envelope'),
        day_of_month: b.day_of_month ?? null,
        note: null,
        is_active: true,
        sort_order: i,
      }))

      const { error: insertErr } = await supabase
        .from('budget_template_lines')
        .insert(inserts)

      if (insertErr) throw insertErr

      console.log(`[useBudgetTemplate] Migrated ${inserts.length} existing budget rows into template lines`)
    },
    onSettled: invalidate,
  })

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addLine = useMutation({
    mutationFn: async (data: AddTemplateLineData) => {
      // Feature 3: auto-calculate monthly amount from annual
      const amount = data.is_annual && data.annual_amount != null
        ? Math.round((data.annual_amount / 12) * 100) / 100
        : data.amount
      const { error } = await supabase.from('budget_template_lines').insert({
        home_id: home!.id,
        name: data.name,
        amount,
        budget_type: data.budget_type,
        section_group: data.section_group,
        day_of_month: data.day_of_month ?? null,
        note: data.note ?? null,
        sort_order: data.sort_order ?? 0,
        is_active: true,
        is_annual: data.is_annual ?? false,
        annual_amount: data.annual_amount ?? null,
        rollover_enabled: data.rollover_enabled ?? false,
        ownership: data.ownership ?? 'shared',
      })
      if (error) throw error
    },
    onError: (err) => toast.error(translateError(err)),
    onSettled: invalidate,
  })

  const updateLine = useMutation({
    onMutate: async ({ id, data }: { id: string; data: UpdateTemplateLineData }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, home?.id] })
      const previous = queryClient.getQueryData<BudgetTemplateLine[]>([QUERY_KEY, home?.id])
      queryClient.setQueryData<BudgetTemplateLine[]>([QUERY_KEY, home?.id], (old) =>
        old?.map((line) => (line.id === id ? { ...line, ...data } : line)) ?? []
      )
      return { previous }
    },
    mutationFn: async ({ id, data }: { id: string; data: UpdateTemplateLineData }) => {
      // Session 36: capture last_amount before saving a new amount
      const extraAmountTracking: { last_amount?: number; amount_changed_at?: string } = {}
      if (data.amount != null) {
        const cached = queryClient.getQueryData<BudgetTemplateLine[]>([QUERY_KEY, home?.id])
        const current = cached?.find((l) => l.id === id)
        if (current && data.amount !== current.amount) {
          extraAmountTracking.last_amount = current.amount
          extraAmountTracking.amount_changed_at = new Date().toISOString()
        }
      }

      // Feature 3: recalculate monthly amount when is_annual changes
      const payload: UpdateTemplateLineData & { updated_at: string; last_amount?: number; amount_changed_at?: string } = {
        ...data,
        ...extraAmountTracking,
        updated_at: new Date().toISOString(),
      }
      if (data.is_annual && data.annual_amount != null) {
        payload.amount = Math.round((data.annual_amount / 12) * 100) / 100
      }
      // Feature 5: auto-set member1_percentage when ownership changes
      if (data.ownership === 'member1') {
        payload.member1_percentage = 100
      } else if (data.ownership === 'member2') {
        payload.member1_percentage = 0
      } else if (data.ownership === 'shared' && data.member1_percentage == null) {
        payload.member1_percentage = 50
      }
      const { error } = await supabase
        .from('budget_template_lines')
        .update(payload)
        .eq('id', id)
        .eq('home_id', home!.id)
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

  const removeLine = useMutation({
    onMutate: async ({ id }: { id: string }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, home?.id] })
      const previous = queryClient.getQueryData<BudgetTemplateLine[]>([QUERY_KEY, home?.id])
      queryClient.setQueryData<BudgetTemplateLine[]>([QUERY_KEY, home?.id], (old) =>
        old?.filter((line) => line.id !== id) ?? []
      )
      return { previous }
    },
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('budget_template_lines')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('home_id', home!.id)
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

  // ── Derived data ───────────────────────────────────────────────────────────

  const templateLines = query.data ?? []

  const fixedLines = useMemo(
    () => templateLines.filter((l) => l.budget_type === 'fixed'),
    [templateLines]
  )

  const envelopeLines = useMemo(
    () => templateLines.filter((l) => l.budget_type === 'envelope'),
    [templateLines]
  )

  const linesBySection = useMemo((): Record<string, BudgetTemplateLine[]> => {
    const groups: Record<string, BudgetTemplateLine[]> = {}
    for (const line of templateLines) {
      if (!groups[line.section_group]) groups[line.section_group] = []
      groups[line.section_group].push(line)
    }
    return groups
  }, [templateLines])

  const totalFixed = useMemo(
    () => fixedLines.reduce((sum, l) => sum + l.amount, 0),
    [fixedLines]
  )

  const totalEnvelopes = useMemo(
    () => envelopeLines.reduce((sum, l) => sum + l.amount, 0),
    [envelopeLines]
  )

  const totalBudgeted = totalFixed + totalEnvelopes

  /** Sum of all annual costs (annualized). For lines with is_annual=true, uses annual_amount. */
  const annualTotal = useMemo(
    () => templateLines.reduce((sum, l) => {
      if (l.is_annual && l.annual_amount != null) return sum + Number(l.annual_amount)
      return sum + l.amount * 12
    }, 0),
    [templateLines]
  )

  /**
   * The authoritative category list for this home.
   * Categories ARE the active Lifestyle (envelope) budget template lines.
   * Fixed lines (rent, broadband, etc.) are never categories.
   */
  const categories = useMemo(
    (): Category[] =>
      envelopeLines.map((line) => ({
        id: line.id,
        name: line.name,
        colour: deriveCategoryColour(line.name),
        section_group: line.section_group,
      })),
    [envelopeLines]
  )

  /** Case-insensitive lookup by name. */
  const getCategoryByName = useCallback(
    (name: string): Category | undefined =>
      categories.find((c) => c.name.toLowerCase() === name.toLowerCase()),
    [categories]
  )

  /** True when at least one Lifestyle budget line exists. */
  const hasCategories = categories.length > 0

  return {
    templateLines,
    fixedLines,
    envelopeLines,
    linesBySection,
    addLine,
    updateLine,
    removeLine,
    migrate,
    totalFixed,
    totalEnvelopes,
    totalBudgeted,
    annualTotal,
    isLoading: query.isLoading,
    isError: query.isError,
    FIXED_SECTIONS,
    // ── Category system ────────────────────────────────────────────────────────
    categories,
    getCategoryByName,
    hasCategories,
  }
}
