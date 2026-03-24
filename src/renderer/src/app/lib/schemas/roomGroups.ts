import { z } from 'zod'

export const roomGroupMemberSchema = z.object({
  group_id: z.string().uuid(),
  room_id: z.string().uuid(),
})

export const roomGroupSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  name: z.string().min(1),
  icon: z.string(),
  created_at: z.string().datetime({ offset: true }),
  room_group_members: z.array(z.object({ room_id: z.string().uuid() })).default([]),
})

export const createRoomGroupSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string(),
})

export type RoomGroup = z.infer<typeof roomGroupSchema>
export type CreateRoomGroup = z.infer<typeof createRoomGroupSchema>
