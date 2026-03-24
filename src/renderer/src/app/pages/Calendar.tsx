import { useState, useMemo, useEffect, useCallback } from "react"
import { format, parseISO, isToday, startOfMonth, endOfMonth, isWithinInterval, isSameMonth, subMonths, addMonths } from "date-fns"
import {
  ChevronLeft, ChevronRight, CalendarDays, CalendarCheck, ShoppingCart, Receipt,
  CheckCircle2, RefreshCw, Clock, AlertCircle, ArrowUpRight,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { Card, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { AnimatedPage } from "../components/AnimatedPage"
import { EmptyState } from "../components/EmptyState"
import { useCalendarEvents, type CalendarEvent } from "../hooks/useCalendarEvents"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

const ease = [0.43, 0.13, 0.23, 0.96] as const
const spring = { type: "spring" as const, stiffness: 400, damping: 17 }

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const TYPE_CONFIG = {
  chore: {
    dot: "bg-primary",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    Icon: CheckCircle2,
    label: "Chore",
  },
  expense: {
    dot: "bg-[#e6a563]",
    iconBg: "bg-[#e6a563]/10",
    iconColor: "text-[#e6a563]",
    Icon: Receipt,
    label: "Bill",
  },
  shopping: {
    dot: "bg-secondary",
    iconBg: "bg-secondary/20",
    iconColor: "text-secondary-foreground",
    Icon: ShoppingCart,
    label: "Shopping",
  },
}

function generateDays(month: Date): (Date | null)[] {
  const year = month.getFullYear()
  const m = month.getMonth()
  const firstDay = new Date(year, m, 1)
  const lastDay = new Date(year, m + 1, 0)
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const days: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) days.push(null)
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, m, i))
  return days
}

export function Calendar() {
  const { events, eventsByDate, isLoading, isError, home } = useCalendarEvents()

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const queryClient = useQueryClient()

  // Transient loading states only — actual sync truth comes from the server
  type UiStatus = 'idle' | 'subscribing' | 'pending' | 'refreshing'
  const [uiStatus, setUiStatus] = useState<UiStatus>('idle')

  // True only when the Edge Function has confirmed a fetch within the last 3 hours.
  // This is the only honest measure of an active subscription.
  const isSubscribed = useMemo(() => {
    if (!home?.calendar_last_fetched_at) return false
    return new Date(home.calendar_last_fetched_at) > new Date(Date.now() - 3 * 60 * 60 * 1000)
  }, [home?.calendar_last_fetched_at])

  // Resolve display state: transient loading states take priority, then server truth
  const calStatus =
    uiStatus === 'subscribing' ? 'subscribing'
    : uiStatus === 'refreshing' ? 'refreshing'
    : isSubscribed ? 'synced'
    : uiStatus === 'pending' ? 'pending'
    : 'idle'

  // Once the server confirms the feed was fetched, clear the pending state
  useEffect(() => {
    if (isSubscribed && uiStatus === 'pending') setUiStatus('idle')
  }, [isSubscribed, uiStatus])

  // If pending for >60s without server confirmation, give up gracefully
  useEffect(() => {
    if (uiStatus !== 'pending') return
    const t = setTimeout(() => {
      setUiStatus('idle')
      toast.error("Couldn't confirm subscription — make sure you clicked Subscribe in Apple Calendar")
    }, 60_000)
    return () => clearTimeout(t)
  }, [uiStatus])

  const lastFetched = home?.calendar_last_fetched_at
    ? new Date(home.calendar_last_fetched_at)
    : null

  const isCurrentMonth = isSameMonth(currentMonth, new Date())
  const calendarDays = generateDays(currentMonth)
  const todayStr = format(new Date(), "yyyy-MM-dd")

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  // Derived counts for stats
  const myChoresUpcoming = events.filter(
    (e) => e.type === "chore" && e.date >= todayStr && !e.isOverdue
  ).length
  const myChoresOverdue = events.filter((e) => e.type === "chore" && e.isOverdue).length
  const billsThisMonth = events.filter((e) => {
    if (e.type !== "expense") return false
    try {
      return isWithinInterval(parseISO(e.date), { start: monthStart, end: monthEnd })
    } catch { return false }
  }).length

  const nextShopDate = home?.next_shop_date
    ? (() => {
        try {
          const d = parseISO(home.next_shop_date)
          return isToday(d) ? "Today" : format(d, "EEE d MMM")
        } catch { return null }
      })()
    : null

  // Events panel: selected date events OR current + next month, deduplicated
  const displayEvents: CalendarEvent[] = useMemo(() => {
    if (selectedDate) return eventsByDate[selectedDate] ?? []

    const endStr = format(endOfMonth(addMonths(new Date(), 1)), "yyyy-MM-dd")
    const filtered = events.filter((e) => e.date >= todayStr && e.date <= endStr)

    // For recurring events (ID ends in -YYYYMMDD), keep only the earliest occurrence
    const seen = new Set<string>()
    const deduped: CalendarEvent[] = []
    for (const e of filtered) {
      const baseId = e.id.replace(/-\d{8}$/, "")
      if (seen.has(baseId)) continue
      seen.add(baseId)
      deduped.push(e)
    }
    return deduped
  }, [selectedDate, eventsByDate, events, todayStr])

  const getCalFeedUrls = useCallback(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
    const token = home?.calendar_token ?? ''
    return {
      webcal: `webcal://${supabaseUrl.replace(/^https?:\/\//, '')}/functions/v1/calendar-feed?token=${token}`,
      https: `${supabaseUrl}/functions/v1/calendar-feed?token=${token}`,
    }
  }, [home?.calendar_token])

  const handleSubscribe = async () => {
    if (!home?.calendar_token) {
      toast.error("Calendar not available — try restarting Roost")
      return
    }
    if (typeof window.api?.openExternal !== 'function') {
      toast.error("Please fully restart Roost to enable calendar sync")
      return
    }
    setUiStatus('subscribing')
    try {
      const result = await window.api.openExternal(getCalFeedUrls().webcal)
      if (result?.error) {
        toast.error(`Couldn't open Apple Calendar: ${result.error}`)
        setUiStatus('idle')
      } else {
        // Webcal URL opened — now wait for Apple Calendar to actually fetch the feed.
        // The Edge Function will stamp calendar_last_fetched_at, realtime will push
        // the update, and isSubscribed will flip to true, resolving the pending state.
        setUiStatus('pending')
        toast.success("Finish subscribing in Apple Calendar — we'll confirm it here automatically")
      }
    } catch (err) {
      toast.error(`Failed: ${err instanceof Error ? err.message : String(err)}`)
      setUiStatus('idle')
    }
  }

  const handleManualRefresh = async () => {
    if (!home?.calendar_token) return
    setUiStatus('refreshing')
    try {
      const res = await fetch(getCalFeedUrls().https)
      if (!res.ok) throw new Error(`Feed returned ${res.status}`)
      const ics = await res.text()
      const count = (ics.match(/BEGIN:VEVENT/g) ?? []).length
      // Invalidate the home query so the updated calendar_last_fetched_at is picked up
      queryClient.invalidateQueries({ queryKey: ['home'] })
      setUiStatus('idle')
      toast.success(`Calendar refreshed · ${count} event${count === 1 ? '' : 's'}`)
    } catch (err) {
      toast.error(`Refresh failed: ${err instanceof Error ? err.message : String(err)}`)
      setUiStatus('idle')
    }
  }

  return (
    <AnimatedPage className="max-w-5xl mx-auto p-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-1.5">Calendar</h1>
          <p className="text-muted-foreground">Your chores, bills, and next shop</p>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {(calStatus === 'idle' || calStatus === 'subscribing') && (
              <motion.div
                key="subscribe"
                initial={{ opacity: 0, scale: 0.94, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 4 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                whileHover={calStatus === 'idle' ? { scale: 1.02 } : {}}
                whileTap={calStatus === 'idle' ? { scale: 0.98 } : {}}
              >
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleSubscribe}
                  disabled={calStatus === 'subscribing'}
                >
                  {calStatus === 'subscribing' ? (
                    <motion.span
                      style={{ display: 'flex' }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </motion.span>
                  ) : (
                    <CalendarDays className="w-4 h-4" />
                  )}
                  {calStatus === 'subscribing' ? 'Opening…' : 'Sync with Apple Calendar'}
                  {calStatus === 'idle' && <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />}
                </Button>
              </motion.div>
            )}

            {calStatus === 'pending' && (
              <motion.div
                key="pending"
                className="flex items-center gap-2 px-3 h-9 rounded-xl border border-[#e6a563]/35 bg-[#e6a563]/8"
                initial={{ opacity: 0, scale: 0.94, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 4 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-[#e6a563]"
                  animate={{ opacity: [1, 0.25, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span className="text-sm text-[#e6a563]">Waiting for Apple Calendar…</span>
              </motion.div>
            )}

            {(calStatus === 'synced' || calStatus === 'refreshing') && (
              <motion.div
                key="synced"
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.94, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 4 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Synced indicator pill */}
                <motion.div
                  className="flex items-center gap-1.5 px-3 h-9 rounded-xl border bg-[#7fa087]/10 border-[#7fa087]/25"
                  title={lastFetched ? `Last synced ${format(lastFetched, 'h:mm a')}` : undefined}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <CalendarCheck className="w-4 h-4 text-[#7fa087]" />
                  <span className="text-sm font-medium text-[#7fa087]">Synced</span>
                </motion.div>

                {/* Manual refresh button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ originX: 0.5, originY: 0.5 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-9 px-3"
                    onClick={handleManualRefresh}
                    disabled={calStatus === 'refreshing'}
                  >
                    <motion.span
                      style={{ display: 'flex' }}
                      animate={calStatus === 'refreshing' ? { rotate: 360 } : { rotate: 0 }}
                      transition={
                        calStatus === 'refreshing'
                          ? { duration: 0.8, repeat: Infinity, ease: 'linear' }
                          : { duration: 0.3 }
                      }
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </motion.span>
                    {calStatus === 'refreshing' ? 'Refreshing…' : 'Refresh now'}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "My chores",
              value: String(myChoresUpcoming + myChoresOverdue),
              sub: myChoresOverdue > 0
                ? `${myChoresOverdue} overdue`
                : myChoresUpcoming === 0 ? "Nothing due" : "upcoming",
              Icon: CheckCircle2,
              iconBg: myChoresOverdue > 0 ? "bg-destructive/10" : "bg-primary/10",
              iconColor: myChoresOverdue > 0 ? "text-destructive" : "text-primary",
              valueColor: myChoresOverdue > 0 ? "text-destructive" : undefined,
              cardCls: myChoresOverdue > 0 ? "bg-destructive/5 border-destructive/20" : "",
              delay: 0.02,
            },
            {
              label: "Next shop",
              value: nextShopDate ?? "—",
              sub: nextShopDate ? "Planned" : "Not scheduled",
              Icon: ShoppingCart,
              iconBg: "bg-secondary/20",
              iconColor: "text-secondary-foreground",
              delay: 0.08,
            },
            {
              label: "Bills this month",
              value: String(billsThisMonth),
              sub: format(currentMonth, "MMMM yyyy"),
              Icon: Receipt,
              iconBg: "bg-[#e6a563]/10",
              iconColor: "text-[#e6a563]",
              delay: 0.14,
            },
          ].map(({ label, value, sub, Icon, iconBg, iconColor, valueColor, cardCls, delay }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay, ease }}
            >
              <Card className={cardCls ?? ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBg}`}>
                      <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                    </div>
                  </div>
                  <p className={`text-2xl font-semibold mb-0.5 ${valueColor ?? ""}`}>{value}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Calendar grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.18, ease }}
      >
        <Card>
          <CardContent className="p-5">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-base font-medium">{format(currentMonth, "MMMM yyyy")}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((date, i) => {
                if (!date) return <div key={i} className="h-16" />

                const key = format(date, "yyyy-MM-dd")
                const dayEvents = eventsByDate[key] ?? []
                const isSelected = selectedDate === key
                const isCurrentDay = isToday(date)
                const hasOverdue = dayEvents.some((e) => e.isOverdue)
                const isPastDay = date < new Date(todayStr) && !isCurrentDay

                return (
                  <motion.button
                    key={i}
                    whileHover={dayEvents.length > 0 ? { scale: 1.04 } : {}}
                    whileTap={dayEvents.length > 0 ? { scale: 0.96 } : {}}
                    transition={spring}
                    onClick={() => setSelectedDate(isSelected ? null : key)}
                    className={[
                      "h-16 rounded-xl border flex flex-col items-center justify-between p-2 transition-colors",
                      dayEvents.length > 0 ? "cursor-pointer" : "cursor-default",
                      isSelected
                        ? "bg-primary/10 border-primary ring-1 ring-primary/30"
                        : isCurrentDay
                        ? "border-primary/40 bg-primary/5"
                        : hasOverdue
                        ? "border-destructive/25 bg-destructive/5"
                        : dayEvents.length > 0
                        ? "border-border/60 bg-card hover:bg-muted/40"
                        : isPastDay
                        ? "border-border/40 bg-transparent opacity-40"
                        : "border-border/60 bg-card",
                    ].join(" ")}
                  >
                    <span className={[
                      "text-sm",
                      isCurrentDay ? "font-semibold text-primary" : "",
                      isSelected ? "font-medium" : "",
                      isPastDay && !dayEvents.length ? "text-muted-foreground" : "",
                    ].join(" ")}>
                      {date.getDate()}
                    </span>

                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 items-center">
                        {dayEvents.slice(0, 3).map((ev, idx) => (
                          <div
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full ${TYPE_CONFIG[ev.type].dot}`}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[9px] text-muted-foreground ml-0.5">+{dayEvents.length - 3}</span>
                        )}
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-4 pt-4 border-t border-border/60">
              {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className="text-xs text-muted-foreground">{cfg.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Events panel */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.24, ease }}
      >
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">
                {selectedDate
                  ? format(parseISO(selectedDate), "d MMMM yyyy")
                  : "Coming up"}
              </h3>
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-muted-foreground"
                  onClick={() => setSelectedDate(null)}
                >
                  Show all
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : isError ? (
              <div className="py-8 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive/40" />
                <p className="text-sm text-muted-foreground">Couldn't load events</p>
              </div>
            ) : displayEvents.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title={selectedDate ? "Nothing on this day" : "Nothing coming up"}
                description={
                  selectedDate
                    ? "No chores, bills, or shopping planned here."
                    : "Your upcoming chores, bills, and shop date will appear here."
                }
              />
            ) : (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {displayEvents.map((event, i) => {
                    const cfg = TYPE_CONFIG[event.type]
                    const Icon = cfg.Icon
                    const overdue = event.isOverdue
                    const today = event.date === todayStr

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2, delay: i * 0.03, ease }}
                        className={[
                          "flex items-center gap-3 p-3.5 rounded-xl border transition-colors",
                          overdue
                            ? "border-destructive/25 bg-destructive/5"
                            : "bg-muted/30 border-transparent",
                        ].join(" ")}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          overdue ? "bg-destructive/10" : cfg.iconBg
                        }`}>
                          <Icon className={`w-4 h-4 ${overdue ? "text-destructive" : cfg.iconColor}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge
                              variant={overdue ? "destructive" : today ? "default" : "secondary"}
                              className="text-[10px] h-4 px-1.5"
                            >
                              {overdue
                                ? `Overdue · ${format(parseISO(event.date), "d MMM")}`
                                : today
                                ? "Today"
                                : format(parseISO(event.date), "EEE d MMM")}
                            </Badge>
                            {event.meta && (
                              <span className="text-xs text-muted-foreground">{event.meta}</span>
                            )}
                            {event.isRecurring && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <RefreshCw className="w-3 h-3" />
                                Recurring
                              </span>
                            )}
                          </div>
                        </div>

                        {overdue && (
                          <Clock className="w-4 h-4 text-destructive flex-shrink-0" />
                        )}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

    </AnimatedPage>
  )
}
