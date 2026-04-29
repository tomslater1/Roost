import { z } from 'zod'

export type BudgetType = 'fixed' | 'envelope'

export const budgetSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  category: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}-01$/, 'month must be YYYY-MM-01'),
  amount: z.number().positive(),
  budget_type: z.enum(['fixed', 'envelope']).default('envelope'),
  day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})

export const upsertBudgetSchema = z.object({
  category: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}-01$/, 'month must be YYYY-MM-01'),
  amount: z.number().positive('Budget must be greater than 0'),
  budget_type: z.enum(['fixed', 'envelope']).default('envelope'),
  day_of_month: z.number().int().min(1).max(31).optional(),
})

export const customCategorySchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  name: z.string().min(1).max(40),
  color: z.string(),
  emoji: z.string(),
  created_at: z.string().datetime({ offset: true }),
})

export const createCustomCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(40, 'Name is too long'),
  color: z.string().min(1, 'Pick a colour'),
  emoji: z.string().min(1, 'Pick an emoji'),
})

export type Budget = z.infer<typeof budgetSchema>
export type UpsertBudget = z.infer<typeof upsertBudgetSchema>
export type CustomCategory = z.infer<typeof customCategorySchema>
export type CreateCustomCategory = z.infer<typeof createCustomCategorySchema>
