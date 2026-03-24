/**
 * Centralised Supabase Realtime subscription manager.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Supabase's JS client deduplicated channels by name internally. Without a
 * manager, two React components mounting the same hook would both call
 * supabase.channel('same-name') and then the first to unmount would call
 * removeChannel() — silently killing the subscription for the second.
 * Each hook also had no visibility into subscription health, and broken
 * channels (CHANNEL_ERROR / TIMED_OUT) were never recovered.
 *
 * HOW IT WORKS
 * ────────────
 * Every subscription goes through subscribe(). The manager:
 *   1. Derives a stable key from the channel config (table + event + filter).
 *   2. If a channel for that key already exists, it reuses it and adds the
 *      new callback to the subscriber Set.
 *   3. If not, it creates one Supabase channel and fans incoming events out
 *      to all registered callbacks.
 *   4. subscribe() returns an unsubscribe() function. When the last subscriber
 *      unsubscribes, the channel is removed from Supabase and the entry is
 *      deleted from the map.
 *   5. On network reconnect (window 'online' event), any channel in a broken
 *      state (CHANNEL_ERROR / TIMED_OUT) is torn down and rebuilt.
 *
 * ADDING A NEW SUBSCRIPTION
 * ──────────────────────────
 * Call subscribe() with a ChannelConfig and a callback. Return the cleanup
 * function from your useEffect. You do not call supabase.channel() directly.
 */

import { supabase } from '@/lib/supabase'
import { logRealtimeLatency } from '@/lib/perf'
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ChannelEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

export interface ChannelConfig {
  /** The postgres table name to subscribe to. */
  table: string
  /** Which DML events to listen for. Defaults to '*' (all). */
  event: ChannelEvent
  /**
   * Optional postgres filter string, e.g. "home_id=eq.<uuid>".
   * When omitted, all rows are received and RLS scopes visibility.
   */
  filter?: string
}

/** The payload shape received by every subscriber callback. */
export type ChangePayload = RealtimePostgresChangesPayload<Record<string, unknown>>

/** A callback invoked for each matching realtime event. */
export type ChangeCallback = (payload: ChangePayload) => void

type SubscriptionStatus =
  | 'CONNECTING'
  | 'SUBSCRIBED'
  | 'CHANNEL_ERROR'
  | 'TIMED_OUT'
  | 'CLOSED'

interface ChannelEntry {
  channel: RealtimeChannel
  config: ChannelConfig
  callbacks: Set<ChangeCallback>
  status: SubscriptionStatus
}

// ── Internal state ────────────────────────────────────────────────────────────

/** All active channels, keyed by a string derived from their config. */
const channels = new Map<string, ChannelEntry>()

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeKey(config: ChannelConfig): string {
  // Stable key: table + event + filter (empty string when omitted).
  // Two subscriptions with the same table/event/filter share one channel.
  return `${config.table}:${config.event}:${config.filter ?? ''}`
}

function createChannel(key: string, entry: ChannelEntry): RealtimeChannel {
  const { config } = entry

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channel = (supabase.channel(`roost:${key}`) as any).on(
    'postgres_changes',
    {
      event: config.event,
      schema: 'public',
      table: config.table,
      ...(config.filter ? { filter: config.filter } : {}),
    },
    (payload: ChangePayload) => {
        // Measure realtime latency for INSERT events that have a created_at field.
        // Compares Date.now() (client receipt) to the row's created_at (DB write time).
        // Only logged for fresh rows (within 60s) to avoid skewing from reconnect replays.
        if (payload.eventType === 'INSERT') {
          const row = payload.new as Record<string, unknown>
          const createdAt = row['created_at']
          if (typeof createdAt === 'string') {
            const rowTime = new Date(createdAt).getTime()
            const latencyMs = Date.now() - rowTime
            if (latencyMs >= 0 && latencyMs < 60_000) {
              logRealtimeLatency(config.table, latencyMs)
            }
          }
        }

        // Fan out to every registered callback for this channel
        entry.callbacks.forEach((cb) =>
          cb(payload as ChangePayload)
        )
      }
    )
    .subscribe((status: string) => {
      entry.status = status as SubscriptionStatus
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(`[Roost Realtime] Channel "${key}" entered status: ${status}`)
      }
    })

  return channel
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Register a callback for realtime events matching the given config.
 *
 * Returns an unsubscribe function — call it from your useEffect cleanup.
 * The underlying Supabase channel is only removed when every subscriber
 * for that config has unsubscribed (ref-counted).
 */
export function subscribe(
  config: ChannelConfig,
  callback: ChangeCallback
): () => void {
  const key = makeKey(config)
  let entry = channels.get(key)

  if (!entry) {
    // First subscriber for this channel — create the entry and the channel
    const newEntry: ChannelEntry = {
      channel: null!, // assigned immediately below
      config,
      callbacks: new Set([callback]),
      status: 'CONNECTING',
    }
    channels.set(key, newEntry)
    newEntry.channel = createChannel(key, newEntry)
    entry = newEntry
  } else {
    // Channel already exists — add this callback and ride the existing channel.
    // The Supabase channel remains open; the new subscriber simply gets future events.
    entry.callbacks.add(callback)
  }

  // Return an unsubscribe function that removes just this callback.
  // The channel is only torn down when the last subscriber leaves.
  return () => {
    const current = channels.get(key)
    if (!current) return

    current.callbacks.delete(callback)

    if (current.callbacks.size === 0) {
      // No more listeners — clean up the Supabase channel entirely
      supabase.removeChannel(current.channel)
      channels.delete(key)
    }
  }
}

/**
 * Re-subscribe any channels that are in a broken state.
 * Called automatically when the network comes back online.
 *
 * Channels in SUBSCRIBED state are left alone — Supabase's WebSocket
 * client handles reconnection for healthy channels automatically.
 */
export function resubscribeAll(): void {
  channels.forEach((entry, key) => {
    if (entry.status === 'CHANNEL_ERROR' || entry.status === 'TIMED_OUT') {
      console.log(`[Roost Realtime] Re-subscribing broken channel: "${key}"`)
      // Tear down the broken channel
      supabase.removeChannel(entry.channel)
      // Rebuild it — all existing callbacks are still in entry.callbacks
      entry.channel = createChannel(key, entry)
      entry.status = 'CONNECTING'
    }
  })
}

/**
 * Returns a snapshot of all active channels and their current status.
 * Useful for debugging.
 */
export function getChannelStatus(): Record<string, SubscriptionStatus> {
  const result: Record<string, SubscriptionStatus> = {}
  channels.forEach((entry, key) => {
    result[key] = entry.status
  })
  return result
}

// ── Network reconnection ──────────────────────────────────────────────────────
// Module-level side effect: wire up the online event once when this module
// is first imported. Re-subscribe broken channels when connectivity returns.

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Roost Realtime] Network back online — checking channel health')
    resubscribeAll()
  })
}
