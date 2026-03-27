import { useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { subscribe } from '@/lib/realtimeManager'
import { useAuthContext } from '@/context/AuthContext'
import { notificationSchema, type AppNotification, type NotificationPrefs } from '@/lib/schemas/notifications'
import { useNotificationPreferences } from './useNotificationPreferences'

const QUERY_KEY = 'notifications'

// Map DB notification type → the preference key that controls it
const TYPE_PREF_KEY: Record<string, keyof NotificationPrefs> = {
  chore:         'chores_enabled',
  expense:       'expenses_enabled',
  shopping_item: 'shopping_enabled',
  settlement:    'settlements_enabled',
  pinboard:      'pinboard_enabled',
}

// Returns true if the current time falls within [start, end) quiet hours.
// Handles overnight ranges (e.g. 22:00–08:00) correctly.
function isQuietHours(start: string, end: string): boolean {
  const now = new Date()
  const nowMins = now.getHours() * 60 + now.getMinutes()
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startMins = sh * 60 + sm
  const endMins   = eh * 60 + em
  // Overnight range (e.g. 22:00–08:00)
  if (startMins > endMins) return nowMins >= startMins || nowMins < endMins
  return nowMins >= startMins && nowMins < endMins
}

function typeEnabled(type: string, prefs: NotificationPrefs): boolean {
  const key = TYPE_PREF_KEY[type]
  return key ? (prefs[key] as boolean) : true
}

export function useNotifications() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()
  const { prefs } = useNotificationPreferences()

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, user?.id] }),
    [queryClient, user?.id]
  )

  // ── Fetch notifications ────────────────────────────────────────────────────
  const query = useQuery({
    queryKey: [QUERY_KEY, user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return z.array(notificationSchema).parse(data)
    },
  })

  // ── Realtime — listen for new notifications ────────────────────────────────
  useEffect(() => {
    if (!user?.id) return

    const unsubscribe = subscribe(
      {
        table: 'notifications',
        event: 'INSERT',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        const result = notificationSchema.safeParse(payload.new)
        if (!result.success) {
          console.error('[Roost] Invalid notification payload:', result.error)
          invalidate()
          return
        }

        const notification = result.data
        const ageMs = Date.now() - new Date(notification.created_at).getTime()
        const isFresh = ageMs < 30_000

        // Gate macOS notification on prefs + quiet hours
        if (
          isFresh &&
          prefs.macos_enabled &&
          typeEnabled(notification.type, prefs) &&
          !(prefs.quiet_hours_enabled && isQuietHours(prefs.quiet_hours_start, prefs.quiet_hours_end))
        ) {
          window.api.notify(notification.title)
        }

        invalidate()
      }
    )

    return unsubscribe
  }, [user?.id, invalidate, prefs])

  // ── Mutations ─────────────────────────────────────────────────────────────

  const markAllRead = useMutation({
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, user?.id] })
      const previous = queryClient.getQueryData<AppNotification[]>([QUERY_KEY, user?.id])
      queryClient.setQueryData<AppNotification[]>([QUERY_KEY, user?.id], (old) =>
        old?.map((n) => ({ ...n, read: true })) ?? []
      )
      return { previous }
    },
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user!.id)
        .eq('read', false)
      if (error) throw error
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, user?.id], context.previous)
      }
    },
    onSettled: invalidate,
  })

  // Apply in-app filter: hide types the user has disabled
  const allNotifications = query.data ?? []
  const notifications = prefs.in_app_enabled
    ? allNotifications.filter((n) => typeEnabled(n.type, prefs))
    : []

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    unreadCount,
    markAllRead,
    isLoading: query.isLoading,
  }
}
