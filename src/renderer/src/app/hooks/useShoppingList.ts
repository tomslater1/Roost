import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { logActivity } from '@/lib/activity'
import { translateError } from '@/lib/errors'
import { useAuthContext } from '@/context/AuthContext'
import { useHome } from './useHome'
import { useRealtime } from './useRealtime'
import { z } from 'zod'
import { shoppingItemSchema, type ShoppingItem, type CreateShoppingItem } from '@/lib/schemas/shopping'
import { normalizeInput } from '@/lib/normalizeInput'

const QUERY_KEY = 'shopping-items'

export function useShoppingList() {
  const { user } = useAuthContext()
  const { home } = useHome()
  const queryClient = useQueryClient()

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, home?.id] }),
    [queryClient, home?.id]
  )

  const query = useQuery({
    queryKey: [QUERY_KEY, home?.id],
    enabled: !!home?.id,
    queryFn: async (): Promise<ShoppingItem[]> => {
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('home_id', home!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return z.array(shoppingItemSchema).parse(data)
    },
  })

  useRealtime({ table: 'shopping_items', homeId: home?.id, onUpdate: invalidate })

  const addItem = useMutation({
    mutationFn: async (item: CreateShoppingItem) => {
      const { text: name, category: suggestedCategory } = await normalizeInput(item.name, 'shopping').catch(() => ({ text: item.name, category: undefined }))
      // If the caller passed an explicit category (not "Other"), respect it. Otherwise let Hazel decide.
      const knownCategory = item.category && item.category !== 'Other' ? item.category : undefined
      const category = knownCategory || suggestedCategory || null
      const { data, error } = await supabase
        .from('shopping_items')
        .insert({ ...item, name, category, home_id: home!.id, added_by: user!.id })
        .select()
        .single()

      if (error) throw error
      return shoppingItemSchema.parse(data)
    },
    onSuccess: async (data) => {
      toast.success(`"${data.name}" added to the list`)
      await logActivity({
        homeId: home!.id,
        userId: user!.id,
        action: `added ${data.name} to the shopping list`,
        entityType: 'shopping_item',
        entityId: data.id,
      })
    },
    onError: (_err) => {
      toast.error(translateError(_err))
    },
    onSettled: invalidate,
  })

  const toggleItem = useMutation({
    onMutate: async ({ id, checked }: { id: string; checked: boolean; name: string }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, home?.id] })
      const previous = queryClient.getQueryData<ShoppingItem[]>([QUERY_KEY, home?.id])
      queryClient.setQueryData<ShoppingItem[]>([QUERY_KEY, home?.id], (old) =>
        old?.map((item) => (item.id === id ? { ...item, checked } : item)) ?? []
      )
      return { previous }
    },
    mutationFn: async ({ id, checked }: { id: string; checked: boolean; name: string }) => {
      const { error } = await supabase
        .from('shopping_items')
        .update({ checked, checked_by: checked ? user!.id : null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: async (_data, { checked, name, id }) => {
      if (checked) {
        await logActivity({
          homeId: home!.id,
          userId: user!.id,
          action: `checked off ${name}`,
          entityType: 'shopping_item',
          entityId: id,
        })
      }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, home?.id], context.previous)
      }
      toast.error(translateError(_err))
    },
    onSettled: invalidate,
  })

  const deleteItem = useMutation({
    onMutate: async ({ id }: { id: string; name: string }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, home?.id] })
      const previous = queryClient.getQueryData<ShoppingItem[]>([QUERY_KEY, home?.id])
      // Remove immediately — restored if the server rejects
      queryClient.setQueryData<ShoppingItem[]>([QUERY_KEY, home?.id], (old) =>
        old?.filter((item) => item.id !== id) ?? []
      )
      return { previous }
    },
    mutationFn: async ({ id }: { id: string; name: string }) => {
      const { error } = await supabase.from('shopping_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async (_data, { name }) => {
      await logActivity({
        homeId: home!.id,
        userId: user!.id,
        action: `removed ${name} from the shopping list`,
        entityType: 'shopping_item',
      })
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, home?.id], context.previous)
      }
      toast.error(translateError(_err))
    },
    onSettled: invalidate,
  })

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    isAdding: addItem.isPending,
    refetch: query.refetch,
    addItem,
    toggleItem,
    deleteItem,
  }
}
