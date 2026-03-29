import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useHome } from './useHome'
import {
  promoRedeemResponseSchema,
  type PromoRedeemError,
} from '@/lib/schemas/subscription'

export function useRedeemPromo() {
  const { home } = useHome()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<PromoRedeemError | null>(null)
  const [success, setSuccess] = useState(false)

  const redeem = async (code: string) => {
    if (!home?.id) return

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setError('server_error')
        setIsLoading(false)
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redeem-promo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            access_token: session.access_token,
            code: code.trim().toUpperCase(),
            home_id: home.id,
          }),
        }
      )

      const result = promoRedeemResponseSchema.parse(await response.json())

      if (result.success) {
        setSuccess(true)
        queryClient.invalidateQueries({ queryKey: ['home'] })
      } else {
        setError(result.error)
      }
    } catch {
      setError('server_error')
    } finally {
      setIsLoading(false)
    }
  }

  return { redeem, isLoading, error, success }
}