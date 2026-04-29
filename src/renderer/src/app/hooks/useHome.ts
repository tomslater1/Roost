import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/context/AuthContext'
import { useRealtime } from './useRealtime'
import { z } from 'zod'
import { homeSchema, homeMemberSchema, type Home, type HomeMember } from '@/lib/schemas/home'

// ── Currency format hook ──────────────────────────────────────────────────────
// Returns a function that formats amounts using the household's currency setting.
// Falls back to GBP. Uses TanStack Query cache — no extra network requests.
export function useCurrencyFormat(): (amount: number) => string {
  const { home } = useHome()
  const currency = home?.currency_symbol ?? 'GBP'
  return useCallback(
    (amount: number) =>
      new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount),
    [currency]
  )
}

// Fetches the current user's home and all its members
export function useHome() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  const homeQuery = useQuery({
    queryKey: ['home', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Home | null> => {
      const { data: homeId, error: fnError } = await supabase.rpc('get_user_home_id')
      if (fnError) throw fnError

      // User is logged in but not yet linked to a home (e.g. signup incomplete)
      if (!homeId) return null

      const { data, error } = await supabase
        .from('homes')
        .select('*')
        .eq('id', homeId)
        .single()

      if (error) throw error
      return homeSchema.parse(data)
    },
  })

  const membersQuery = useQuery({
    queryKey: ['home-members', homeQuery.data?.id],
    enabled: !!homeQuery.data?.id,
    queryFn: async (): Promise<HomeMember[]> => {
      const { data, error } = await supabase
        .from('home_members')
        .select('*')
        .eq('home_id', homeQuery.data!.id)

      if (error) throw error
      return z.array(homeMemberSchema).parse(data)
    },
  })

  // When a partner joins the home, their home_members row is inserted.
  // Subscribe to live changes so the members list updates automatically
  // on both machines without a refresh.
  const invalidateMembers = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['home-members', homeQuery.data?.id] }),
    [queryClient, homeQuery.data?.id]
  )
  useRealtime({ table: 'home_members', homeId: homeQuery.data?.id, onUpdate: invalidateMembers })

  // Also subscribe to home row changes so next_shop_date syncs in real time
  const invalidateHome = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['home', user?.id] }),
    [queryClient, user?.id]
  )
  useRealtime({ table: 'homes', homeId: homeQuery.data?.id, onUpdate: invalidateHome })

  const updateNextShopDate = useCallback(async (date: string | null) => {
    if (!homeQuery.data?.id) return
    await supabase.from('homes').update({ next_shop_date: date }).eq('id', homeQuery.data.id)
    queryClient.invalidateQueries({ queryKey: ['home', user?.id] })
  }, [homeQuery.data?.id, user?.id, queryClient])

  const updateCurrencySymbol = useCallback(async (currencyCode: string) => {
    if (!homeQuery.data?.id) return
    await supabase.from('homes').update({ currency_symbol: currencyCode }).eq('id', homeQuery.data.id)
    queryClient.invalidateQueries({ queryKey: ['home', user?.id] })
  }, [homeQuery.data?.id, user?.id, queryClient])

  return {
    home: homeQuery.data,
    members: membersQuery.data ?? [],
    homeLoading: homeQuery.isLoading,
    membersLoading: membersQuery.isLoading,
    homeError: homeQuery.error,
    updateNextShopDate,
    updateCurrencySymbol,
  }
}
