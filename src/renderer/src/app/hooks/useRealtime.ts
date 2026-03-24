import { useEffect } from 'react'
import { subscribe } from '@/lib/realtimeManager'

interface UseRealtimeOptions {
  table: string
  homeId: string | undefined
  onUpdate: () => void
  /**
   * Optional postgres filter string, e.g. "home_id=eq.<uuid>".
   * When omitted, all changes on the table are received and RLS scopes
   * visibility. Required for tables without a home_id column.
   */
  filter?: string
}

/**
 * Subscribes to realtime changes on a Supabase table.
 *
 * Backed by the centralised realtimeManager — subscriptions are ref-counted
 * so multiple components using the same hook share one channel and the channel
 * is only removed when the last subscriber unmounts.
 *
 * Broken channels (CHANNEL_ERROR / TIMED_OUT) are automatically recovered
 * when the network comes back online.
 */
export function useRealtime({ table, homeId, onUpdate, filter }: UseRealtimeOptions): void {
  useEffect(() => {
    // Don't subscribe until we have a homeId — hooks that call useRealtime
    // before the home is loaded will re-run this effect once homeId arrives.
    if (!homeId) return

    const unsubscribe = subscribe(
      { table, event: '*', filter },
      // The manager passes the full payload, but generic hooks only need
      // invalidation — they ignore the payload content and re-fetch via
      // TanStack Query, which then validates the response through Zod.
      () => onUpdate()
    )

    return unsubscribe
  }, [table, homeId, onUpdate, filter])
}
