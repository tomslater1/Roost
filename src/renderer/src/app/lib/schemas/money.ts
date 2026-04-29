import { z } from 'zod'

// ── Household Income ──────────────────────────────────────────────────────────

export const householdIncomeSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  month: z.string(), // YYYY-MM-DD (first of month)
  combined_amount: z.number(),
  tom_amount: z.number().optional().nullable(),
  partner_amount: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
})

export const createHouseholdIncomeSchema = z.object({
  month: z.string(), // YYYY-MM-DD
  combined_amount: z.number().min(0, 'Amount must be 0 or more'),
  tom_amount: z.number().optional().nullable(),
  partner_amount: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type HouseholdIncome = z.infer<typeof householdIncomeSchema>
export type CreateHouseholdIncome = z.infer<typeof createHouseholdIncomeSchema>

// ── Savings Goals ─────────────────────────────────────────────────────────────

export const savingsGoalSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  name: z.string(),
  target_amount: z.number(),
  current_amount: z.number(),
  target_date: z.string().optional().nullable(),
  colour: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  is_complete: z.boolean().optional().nullable(),
  completed_at: z.string().optional().nullable(),
  sort_order: z.number().int().optional().nullable(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
  // Feature 1 — goal budget line linkage
  monthly_contribution: z.coerce.number().nullable().optional(),
  contribution_day: z.number().int().min(1).max(31).nullable().optional(),
  budget_line_id: z.string().uuid().nullable().optional(),
})

export const createSavingsGoalSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  target_amount: z.number().min(0.01, 'Target must be at least £0.01'),
  current_amount: z.number().min(0).optional(),
  target_date: z.string().optional().nullable(),
  colour: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  sort_order: z.number().int().optional().nullable(),
  // Feature 1 — monthly contribution
  monthly_contribution: z.number().min(0).nullable().optional(),
  contribution_day: z.number().int().min(1).max(31).nullable().optional(),
})

export const updateSavingsGoalSchema = createSavingsGoalSchema.partial().extend({
  is_complete: z.boolean().optional(),
  completed_at: z.string().optional().nullable(),
  budget_line_id: z.string().uuid().nullable().optional(),
})

export type SavingsGoal = z.infer<typeof savingsGoalSchema>
export type CreateSavingsGoal = z.infer<typeof createSavingsGoalSchema>
export type UpdateSavingsGoal = z.infer<typeof updateSavingsGoalSchema>

// ── Recurring Bills ───────────────────────────────────────────────────────────

export const recurringBillSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  name: z.string(),
  amount: z.number(),
  day_of_month: z.number().int().min(1).max(31),
  category: z.string().optional().nullable(),
  is_active: z.boolean().optional().nullable(),
  colour: z.string().optional().nullable(),
  sort_order: z.number().int().optional().nullable(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
})

export const createRecurringBillSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().min(0.01, 'Amount must be at least £0.01'),
  day_of_month: z.number().int().min(1, 'Day must be 1–31').max(31, 'Day must be 1–31'),
  category: z.string().optional().nullable(),
  colour: z.string().optional().nullable(),
  sort_order: z.number().int().optional().nullable(),
})

export const updateRecurringBillSchema = createRecurringBillSchema.partial()

export type RecurringBill = z.infer<typeof recurringBillSchema>
export type CreateRecurringBill = z.infer<typeof createRecurringBillSchema>
export type UpdateRecurringBill = z.infer<typeof updateRecurringBillSchema>

// ── Monthly Summary ───────────────────────────────────────────────────────────
// The RPC get_monthly_summary (migration 0033) returns the new field names.
// A transform provides backward-compat aliases so existing UI code compiles
// without changes:
//   actual_spend   → total_spent
//   envelopes_total → discretionary

export const monthlySummarySchema = z
  .object({
    income: z.number(),
    fixed_costs: z.number().optional().default(0),
    // New fields from migration 0033
    envelopes_total: z.number().optional().default(0),
    total_budgeted: z.number().optional().default(0),
    actual_spend: z.number().optional(),
    pct_of_income_budgeted: z.number().optional().default(0),
    // Legacy fields — present in the old RPC, absent in the new one
    discretionary: z.number().optional(),
    total_spent: z.number().optional(),
    // Shared fields
    surplus: z.number(),
    projected_total: z.number(),
    pct_spent: z.number(),
  })
  .transform((data) => ({
    ...data,
    // Ensure consumers always get a number regardless of which RPC version
    // is deployed. New RPC → actual_spend fills total_spent.
    // Old RPC → total_spent passes through unchanged.
    total_spent: data.total_spent ?? data.actual_spend ?? 0,
    // New RPC → envelopes_total fills discretionary.
    // Old RPC → discretionary passes through unchanged.
    discretionary: data.discretionary ?? data.envelopes_total ?? 0,
  }))

export type MonthlySummary = z.infer<typeof monthlySummarySchema>

// ── Pro upgrade error ─────────────────────────────────────────────────────────

export interface ProRequiredError {
  code: 'PRO_REQUIRED'
  feature: 'savings_goals' | 'recurring_bills'
}
