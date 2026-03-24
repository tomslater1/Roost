import { z } from 'zod'

export const expenseSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  amount: z.number().positive('Amount must be positive'),
  paid_by: z.string().uuid(),
  split_type: z.enum(['equal', 'custom', 'solo']).default('equal'),
  category: z.string().optional().nullable(),
  is_recurring: z.boolean().default(false),
  recurrence_interval: z.enum(['weekly', 'monthly', 'yearly']).optional().nullable(),
  notes: z.string().optional().nullable(),
  date: z.string(), // YYYY-MM-DD
  created_at: z.string().datetime({ offset: true }),
})

export const expenseSplitSchema = z.object({
  id: z.string().uuid(),
  expense_id: z.string().uuid(),
  user_id: z.string().uuid(),
  amount: z.number().positive(),
  settled: z.boolean().default(false),
  settled_at: z.string().datetime({ offset: true }).optional().nullable(),
})

// Expense with its splits embedded (used when fetching with ?select=*,expense_splits(*))
export const expenseWithSplitsSchema = expenseSchema.extend({
  expense_splits: z.array(expenseSplitSchema).default([]),
})

export const createExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  amount: z.number().positive('Amount must be positive'),
  paid_by: z.string().uuid(),
  split_type: z.enum(['equal', 'custom', 'solo']).default('equal'),
  category: z.string().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_interval: z.enum(['weekly', 'monthly', 'yearly']).optional(),
  notes: z.string().optional(),
  date: z.string(),
}).superRefine((data, ctx) => {
  if (data.is_recurring && !data.recurrence_interval) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select how often this recurs',
      path: ['recurrence_interval'],
    })
  }
})

export const settlementSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  paid_by: z.string().uuid(),
  paid_to: z.string().uuid(),
  amount: z.number(),
  note: z.string().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
})

export type Expense = z.infer<typeof expenseSchema>
export type ExpenseSplit = z.infer<typeof expenseSplitSchema>
export type ExpenseWithSplits = z.infer<typeof expenseWithSplitsSchema>
export type CreateExpense = z.infer<typeof createExpenseSchema>
export type Settlement = z.infer<typeof settlementSchema>
