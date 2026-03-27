import { useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { addMonths, addWeeks, addYears, differenceInCalendarDays, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { subscribe } from '@/lib/realtimeManager'
import { useAuthContext } from '@/context/AuthContext'
import { notificationSchema, type AppNotification, type NotificationPrefs } from '@/lib/schemas/notifications'
import { useNotificationPreferences } from './useNotificationPreferences'
import { useExpenses } from './useExpenses'

const QUERY_KEY = 'notifications'
const REMINDER_WINDOW_DAYS = 3
const BILL_CATEGORIES = new Set(['rent', 'mortgage', 'bills'])

// Map DB notification type → the preference key that controls it
const TYPE_PREF_KEY: Record<string, keyof NotificationPrefs> = {
  chore:         'chores_enabled',
  expense:       'expenses_enabled',
  shopping_item: 'shopping_enabled',
  settlement:    'settlements_enabled',
  pinboard:      'pinboard_enabled',
  bill_reminder: 'bill_reminders_enabled',
}

function getNextDueDate(date: string, recurrence: 'weekly' | 'monthly' | 'yearly' | null | undefined): Date | null {
  if (!recurrence) return null
  let next = parseISO(date)
  const today = new Date()
  while (next < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    next = recurrence === 'weekly'
      ? addWeeks(next, 1)
      : recurrence === 'monthly'
      ? addMonths(next, 1)
      : addYears(next, 1)
  }
  return next
}

function reminderTitle(name: string, daysUntil: number): string {
  if (daysUntil <= 0) return `${name} is due today`
  if (daysUntil === 1) return `${name} is due tomorrow`
  return `${name} is due in ${daysUntil} days`
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
  const { expenses } = useExpenses()

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
      if (user?.id) {
        const syntheticIds = billReminderNotifications.map((n) => n.id)
        window.localStorage.setItem(
          `roost-bill-reminders-read:${user.id}`,
          JSON.stringify(syntheticIds)
        )
      }
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

  const readReminderIds = (() => {
    if (!user?.id) return new Set<string>()
    try {
      return new Set<string>(JSON.parse(window.localStorage.getItem(`roost-bill-reminders-read:${user.id}`) ?? '[]'))
    } catch {
      return new Set<string>()
    }
  })()

  const billReminderNotifications: AppNotification[] = prefs.bill_reminders_enabled
    ? expenses
        .filter((expense) => expense.is_recurring && BILL_CATEGORIES.has((expense.category ?? '').toLowerCase()))
        .map((expense) => {
          const nextDue = getNextDueDate(expense.date, expense.recurrence_interval)
          if (!nextDue) return null
          const daysUntil = differenceInCalendarDays(nextDue, new Date())
          if (daysUntil < 0 || daysUntil > REMINDER_WINDOW_DAYS) return null
          const name = expense.category === 'Bills' ? expense.title : (expense.category ?? expense.title)
          const id = `bill-reminder:${expense.id}:${nextDue.toISOString().slice(0, 10)}`
          return {
            id,
            home_id: expense.home_id,
            user_id: user?.id ?? '',
            actor_id: null,
            type: 'bill_reminder',
            title: reminderTitle(name, daysUntil),
            entity_id: expense.id,
            read: readReminderIds.has(id),
            created_at: nextDue.toISOString(),
          } satisfies AppNotification
        })
        .filter((value): value is AppNotification => Boolean(value))
    : []

  useEffect(() => {
    if (!user?.id || !prefs.bill_reminders_enabled || !prefs.macos_enabled) return
    if (prefs.quiet_hours_enabled && isQuietHours(prefs.quiet_hours_start, prefs.quiet_hours_end)) return

    const storageKey = `roost-bill-reminders-sent:${user.id}`
    let sentMap: Record<string, string> = {}
    try {
      sentMap = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}')
    } catch {
      sentMap = {}
    }

    const todayKey = new Date().toISOString().slice(0, 10)
    let changed = false
    for (const notification of billReminderNotifications) {
      if (sentMap[notification.id] === todayKey) continue
      window.api.notify(notification.title)
      sentMap[notification.id] = todayKey
      changed = true
    }
    if (changed) {
      window.localStorage.setItem(storageKey, JSON.stringify(sentMap))
    }
  }, [billReminderNotifications, prefs, user?.id])

  // Apply in-app filter: hide types the user has disabled
  const allNotifications = query.data ?? []
  const notifications = prefs.in_app_enabled
    ? [...billReminderNotifications, ...allNotifications.filter((n) => typeEnabled(n.type, prefs))]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : []

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    unreadCount,
    markAllRead,
    isLoading: query.isLoading,
  }
}
