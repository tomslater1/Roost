import { z } from 'zod'

export const pinboardLinkTypeSchema = z.enum([
  'room',
  'category',
  'chore',
  'expense',
  'shopping',
  'budget',
  'calendar',
])

export const pinboardTargetScopeSchema = z.enum(['self', 'partner', 'everyone'])

export const pinboardAcknowledgementSchema = z.object({
  note_id: z.string().uuid(),
  user_id: z.string().uuid(),
  seen_at: z.string().datetime({ offset: true }),
})

export const pinboardNoteSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  author_id: z.string().uuid().nullable().optional(),
  content: z.string().min(1).max(1000),
  link_type: pinboardLinkTypeSchema.nullable().optional(),
  link_label: z.string().nullable().optional(),
  linked_entity_id: z.string().uuid().nullable().optional(),
  target_scope: pinboardTargetScopeSchema.default('everyone'),
  target_user_id: z.string().uuid().nullable().optional(),
  notify_on_create: z.boolean().default(true),
  expires_at: z.string().datetime({ offset: true }).nullable().optional(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
  pinboard_note_acknowledgements: z.array(pinboardAcknowledgementSchema).default([]),
})

export const createPinboardNoteSchema = z.object({
  content: z.string().trim().min(1, 'Write a note first').max(1000, 'Keep notes under 1000 characters'),
  link_type: pinboardLinkTypeSchema.optional(),
  link_label: z.string().trim().max(120).optional(),
  linked_entity_id: z.string().uuid().optional(),
  target_scope: pinboardTargetScopeSchema.default('everyone'),
  target_user_id: z.string().uuid().optional(),
  notify_on_create: z.boolean().default(true),
  expires_at: z.string().datetime({ offset: true }).nullable().optional(),
})

export type PinboardLinkType = z.infer<typeof pinboardLinkTypeSchema>
export type PinboardTargetScope = z.infer<typeof pinboardTargetScopeSchema>
export type PinboardAcknowledgement = z.infer<typeof pinboardAcknowledgementSchema>
export type PinboardNote = z.infer<typeof pinboardNoteSchema>
export type CreatePinboardNote = z.infer<typeof createPinboardNoteSchema>
