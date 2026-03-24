import { z } from 'zod'

export const roomSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  name: z.string().min(1),
  icon: z.string(),
  created_at: z.string().datetime({ offset: true }),
})

export const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string(),
})

export type Room = z.infer<typeof roomSchema>
export type CreateRoom = z.infer<typeof createRoomSchema>
