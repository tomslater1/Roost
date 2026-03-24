import { useMemo } from 'react'
import { addWeeks, addMonths, addYears, format, isBefore, startOfDay, isPast, isToday, parseISO } from 'date-fns'
import { useChores } from './useChores'
import { useExpenses } from './useExpenses'
import { useHome } from './useHome'
import { useShoppingList } from './useShoppingList'
import { useAuthContext } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'
import type { Chore } from '@/lib/schemas/chores'

export interface CalendarEvent {
  id: string
  title: string
  date: string        // YYYY-MM-DD
  type: 'chore' | 'expense' | 'shopping'
  isRecurring: boolean
  isOverdue?: boolean
  meta?: string       // e.g. "£45.00" for expenses
}

// Expand recurring expense occurrences for the next 6 months
function expandRecurring(
  id: string,
  title: string,
  startDateStr: string,
  interval: 'weekly' | 'monthly' | 'yearly',
  meta: string,
): CalendarEvent[] {
  const events: CalendarEvent[] = []
  const today = startOfDay(new Date())
  const expansionEnd = addMonths(today, 6)

  let current = startOfDay(new Date(startDateStr))

  // Advance past occurrences to the next upcoming one
  while (isBefore(current, today)) {
    if (interval === 'weekly') current = addWeeks(current, 1)
    else if (interval === 'monthly') current = addMonths(current, 1)
    else current = addYears(current, 1)
  }

  while (!isBefore(expansionEnd, current)) {
    events.push({
      id: `${id}-${format(current, 'yyyyMMdd')}`,
      title,
      date: format(current, 'yyyy-MM-dd'),
      type: 'expense',
      isRecurring: true,
      meta,
    })
    if (interval === 'weekly') current = addWeeks(current, 1)
    else if (interval === 'monthly') current = addMonths(current, 1)
    else current = addYears(current, 1)
  }

  return events
}

// Expand recurring chore occurrences for the next 3 months
function expandRecurringChore(chore: Chore): CalendarEvent[] {
  const events: CalendarEvent[] = []
  const today = startOfDay(new Date())
  const expansionEnd = addMonths(today, 3)

  let current = startOfDay(new Date(chore.due_date!))

  while (!isBefore(expansionEnd, current)) {
    events.push({
      id: `chore-${chore.id}-${format(current, 'yyyyMMdd')}`,
      title: chore.title,
      date: format(current, 'yyyy-MM-dd'),
      type: 'chore',
      isRecurring: true,
      isOverdue: false,
    })
    current = chore.frequency === 'weekly' ? addWeeks(current, 1) : addMonths(current, 1)
  }

  return events
}

export function useCalendarEvents() {
  const { user } = useAuthContext()
  const { chores, isLoading: choreLoading, isError: choreError } = useChores()
  const { expenses, isLoading: expenseLoading, isError: expenseError } = useExpenses()
  const { home, homeLoading } = useHome()
  const { items } = useShoppingList()

  const isLoading = choreLoading || expenseLoading || homeLoading
  const isError = choreError || expenseError

  const events = useMemo((): CalendarEvent[] => {
    const result: CalendarEvent[] = []

    // ── My chores only — incomplete, assigned to current user ─────────────────
    for (const chore of chores) {
      if (!chore.due_date) continue
      if (chore.assigned_to !== user?.id) continue
      if (chore.last_completed_at) continue // skip completed

      if (chore.frequency === 'weekly' || chore.frequency === 'monthly') {
        result.push(...expandRecurringChore(chore))
      } else {
        result.push({
          id: `chore-${chore.id}`,
          title: chore.title,
          date: chore.due_date,
          type: 'chore',
          isRecurring: chore.frequency !== null && chore.frequency !== 'one-time',
          isOverdue: isPast(parseISO(chore.due_date)) && !isToday(parseISO(chore.due_date)),
        })
      }
    }

    // ── Rent and Bills only ───────────────────────────────────────────────────
    for (const expense of expenses) {
      if (expense.category !== 'Rent' && expense.category !== 'Bills') continue

      const meta = formatCurrency(Number(expense.amount))

      if (expense.is_recurring && expense.recurrence_interval) {
        result.push(...expandRecurring(
          expense.id,
          expense.title,
          expense.date,
          expense.recurrence_interval as 'weekly' | 'monthly' | 'yearly',
          meta,
        ))
      } else {
        result.push({
          id: `expense-${expense.id}`,
          title: expense.title,
          date: expense.date,
          type: 'expense',
          isRecurring: false,
          meta,
        })
      }
    }

    // ── Next shop ─────────────────────────────────────────────────────────────
    if (home?.next_shop_date) {
      const uncheckedCount = items.filter((i) => !i.checked).length
      result.push({
        id: 'shopping-next',
        title: 'Weekly shop',
        date: home.next_shop_date,
        type: 'shopping',
        isRecurring: false,
        meta: uncheckedCount > 0 ? `${uncheckedCount} item${uncheckedCount === 1 ? '' : 's'} on list` : undefined,
      })
    }

    return result.sort((a, b) => a.date.localeCompare(b.date))
  }, [chores, expenses, home?.next_shop_date, items, user?.id])

  // Index by date string for fast dot lookups in the month grid
  const eventsByDate = useMemo((): Record<string, CalendarEvent[]> => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const event of events) {
      if (!map[event.date]) map[event.date] = []
      map[event.date].push(event)
    }
    return map
  }, [events])

  return { events, eventsByDate, isLoading, isError, home }
}
