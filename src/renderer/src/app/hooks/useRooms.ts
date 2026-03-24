import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { translateError } from '@/lib/errors'
import { useHome } from './useHome'
import { useRealtime } from './useRealtime'
import { z } from 'zod'
import { roomSchema, type Room, type CreateRoom } from '@/lib/schemas/rooms'

const QUERY_KEY = 'rooms'

export function useRooms() {
  const { home } = useHome()
  const queryClient = useQueryClient()

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, home?.id] }),
    [queryClient, home?.id]
  )

  const query = useQuery({
    queryKey: [QUERY_KEY, home?.id],
    enabled: !!home?.id,
    queryFn: async (): Promise<Room[]> => {
      const { data, error } = await supabase
        .from('home_rooms')
        .select('*')
        .eq('home_id', home!.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return z.array(roomSchema).parse(data)
    },
  })

  useRealtime({ table: 'home_rooms', homeId: home?.id, onUpdate: invalidate })

  const addRoom = useMutation({
    mutationFn: async (room: CreateRoom) => {
      const { data, error } = await supabase
        .from('home_rooms')
        .insert({ ...room, home_id: home!.id })
        .select()
        .single()
      if (error) throw error
      return roomSchema.parse(data)
    },
    onSuccess: (data) => {
      toast.success(`"${data.name}" added`)
    },
    onError: (err) => {
      const msg = (err as Error).message ?? ''
      if (msg.includes('unique')) toast.error('That room already exists')
      else toast.error(translateError(err))
    },
    onSettled: invalidate,
  })

  const updateRoom = useMutation({
    mutationFn: async ({ id, name, icon }: { id: string; name: string; icon: string }) => {
      const { error } = await supabase
        .from('home_rooms')
        .update({ name, icon })
        .eq('id', id)
      if (error) throw error
    },
    onError: (err) => {
      const msg = (err as Error).message ?? ''
      if (msg.includes('unique')) toast.error('A room with that name already exists')
      else toast.error(translateError(err))
    },
    onSettled: invalidate,
  })

  const deleteRoom = useMutation({
    mutationFn: async ({ id }: { id: string; name: string }) => {
      const { error } = await supabase.from('home_rooms').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { name }) => {
      toast.success(`"${name}" removed`)
    },
    onError: (err) => toast.error(translateError(err)),
    onSettled: invalidate,
  })

  return {
    rooms: query.data ?? [],
    isLoading: query.isLoading,
    addRoom,
    updateRoom,
    deleteRoom,
  }
}
