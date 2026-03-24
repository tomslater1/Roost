import { z } from 'zod'

export const activityFeedItemSchema = z.object({
  id: z.string().uuid(),
  home_id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  action: z.string(),
  entity_type: z.string(),
  entity_id: z.string().uuid().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  created_at: z.string().datetime({ offset: true }),
})

// Schema for a signup form
export const signupFormSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  display_name: z.string().min(1, 'Display name is required').max(50),
})

// Schema for a login form
export const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

// Schema for the join-via-invite flow
export const joinFormSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  display_name: z.string().min(1, 'Display name is required').max(50),
  invite_code: z.string().length(8, 'Invite codes are 8 characters'),
})

// Schema for the Google OAuth post-signup setup page
export const setupFormSchema = z.object({
  display_name: z.string().min(1, 'Your name is required').max(50, 'Name is too long'),
  invite_code: z.string().length(8, 'Invite codes are exactly 8 characters').optional(),
})

export type ActivityFeedItem = z.infer<typeof activityFeedItemSchema>
export type SignupForm = z.infer<typeof signupFormSchema>
export type LoginForm = z.infer<typeof loginFormSchema>
export type JoinForm = z.infer<typeof joinFormSchema>
export type SetupForm = z.infer<typeof setupFormSchema>
