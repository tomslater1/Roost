import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/context/AuthContext'
import {
  userPreferencesSchema,
  defaultUserPrefs,
  type UserPreferences,
} from '@/lib/schemas/userPreferences'

export const USER_PREFS_QUERY_KEY = 'user-preferences'

export function useUserPreferences() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [USER_PREFS_QUERY_KEY, user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<UserPreferences> => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle()
      if (error) throw error
      if (!data) return defaultUserPrefs(user!.id)
      return userPreferencesSchema.parse(data)
    },
  })

  const updatePrefs = useCallback(async (updates: Partial<UserPreferences>) => {
    if (!user?.id) return
    const current = query.data ?? defaultUserPrefs(user.id)
    const merged: UserPreferences = { ...current, ...updates }

    queryClient.setQueryData([USER_PREFS_QUERY_KEY, user.id], merged)

    const { error } = await supabase
      .from('user_preferences')
      .upsert(
        { ...merged, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

    if (error) {
      queryClient.invalidateQueries({ queryKey: [USER_PREFS_QUERY_KEY, user.id] })
      toast.error('Failed to save preference')
    }
  }, [user?.id, query.data, queryClient])

  return {
    prefs: query.data ?? defaultUserPrefs(user?.id ?? ''),
    isLoading: query.isLoading,
    updatePrefs,
  }
}
