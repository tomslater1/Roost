import { z } from 'zod'

export const choreSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  frequency: z.enum(['once', 'daily', 'weekly', 'fortnightly', 'monthly']).optional().nullable(),
  last_completed_at: z.string().datetime({ offset: true }).optional().nullable(),
  completed_by: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(), // YYYY-MM-DD
  room: z.string().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
})

export const createChoreSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).optional().nullable(),
  due_date: z.string().optional(),
  room: z.string().optional().nullable(),
})

export type Chore = z.infer<typeof choreSchema>
export type CreateChore = z.infer<typeof createChoreSchema>
