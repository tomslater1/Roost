import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/context/AuthContext'
import {
  notificationPrefsSchema,
  defaultPrefs,
  type NotificationPrefs,
} from '@/lib/schemas/notifications'

export const PREFS_QUERY_KEY = 'notification-prefs'

export function useNotificationPreferences() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [PREFS_QUERY_KEY, user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60_000, // prefs change rarely — keep cache fresh for 5 min
    queryFn: async (): Promise<NotificationPrefs> => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle()
      if (error) throw error
      if (!data) return defaultPrefs(user!.id)
      return notificationPrefsSchema.parse(data)
    },
  })

  const updatePrefs = useCallback(async (updates: Partial<NotificationPrefs>) => {
    if (!user?.id) return
    const current = query.data ?? defaultPrefs(user.id)
    const merged: NotificationPrefs = { ...current, ...updates }

    // Optimistic update — UI responds immediately
    queryClient.setQueryData([PREFS_QUERY_KEY, user.id], merged)

    const { error } = await supabase
      .from('notification_preferences')
      .upsert(
        { ...merged, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

    if (error) {
      // Roll back optimistic update
      queryClient.invalidateQueries({ queryKey: [PREFS_QUERY_KEY, user.id] })
      toast.error('Failed to save — please try again')
    }
  }, [user?.id, query.data, queryClient])

  return {
    prefs: query.data ?? defaultPrefs(user?.id ?? ''),
    isLoading: query.isLoading,
    updatePrefs,
  }
}
