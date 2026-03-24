import { z } from 'zod'

export const shoppingItemSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  name: z.string().min(1, 'Item name is required').max(100),
  quantity: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  checked: z.boolean().default(false),
  added_by: z.string().uuid().optional().nullable(),
  checked_by: z.string().uuid().optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})

// Used in the "add item" form — omit server-generated fields
export const createShoppingItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100),
  quantity: z.string().optional(),
  category: z.string().optional(),
})

export type ShoppingItem = z.infer<typeof shoppingItemSchema>
export type CreateShoppingItem = z.infer<typeof createShoppingItemSchema>
