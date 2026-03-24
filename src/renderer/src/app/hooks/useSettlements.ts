import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useHome } from './useHome'
import { useRealtime } from './useRealtime'
import { z } from 'zod'
import { settlementSchema, type Settlement } from '@/lib/schemas/expenses'

const QUERY_KEY = 'settlements'

export function useSettlements() {
  const { home } = useHome()
  const queryClient = useQueryClient()

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, home?.id] }),
    [queryClient, home?.id]
  )

  const query = useQuery({
    queryKey: [QUERY_KEY, home?.id],
    enabled: !!home?.id,
    queryFn: async (): Promise<Settlement[]> => {
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('home_id', home!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return z.array(settlementSchema).parse(data)
    },
  })

  useRealtime({
    table: 'settlements',
    homeId: home?.id,
    onUpdate: invalidate,
    filter: `home_id=eq.${home?.id}`,
  })

  return {
    settlements: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
