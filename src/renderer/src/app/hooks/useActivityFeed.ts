import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useHome } from './useHome'
import { useRealtime } from './useRealtime'
import { z } from 'zod'
import { activityFeedItemSchema, type ActivityFeedItem } from '@/lib/schemas/user'
import { perfMark } from '@/lib/perf'

const QUERY_KEY = 'activity-feed'

export function useActivityFeed() {
  const { home, members } = useHome()
  const queryClient = useQueryClient()

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, home?.id] }),
    [queryClient, home?.id]
  )

  const query = useQuery({
    queryKey: [QUERY_KEY, home?.id],
    enabled: !!home?.id,
    queryFn: async (): Promise<ActivityFeedItem[]> => {
      const { data, error } = await supabase
        .from('activity_feed')
        .select('*')
        .eq('home_id', home!.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      const result = z.array(activityFeedItemSchema).parse(data)
      perfMark('page-data-ready')
      return result
    },
  })

  // Live updates — when any mutation writes a new activity row, the feed
  // updates automatically without a manual refresh
  useRealtime({
    table: 'activity_feed',
    homeId: home?.id,
    onUpdate: invalidate,
  })

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    members,
  }
}
