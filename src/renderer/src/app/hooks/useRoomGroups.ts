import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { translateError } from '@/lib/errors'
import { useHome } from './useHome'
import { useRealtime } from './useRealtime'
import { z } from 'zod'
import { roomGroupSchema, type RoomGroup, type CreateRoomGroup } from '@/lib/schemas/roomGroups'

const QUERY_KEY = 'room-groups'

export function useRoomGroups() {
  const { home } = useHome()
  const queryClient = useQueryClient()

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY, home?.id] }),
    [queryClient, home?.id]
  )

  const query = useQuery({
    queryKey: [QUERY_KEY, home?.id],
    enabled: !!home?.id,
    queryFn: async (): Promise<RoomGroup[]> => {
      const { data, error } = await supabase
        .from('home_room_groups')
        .select('*, room_group_members(room_id)')
        .eq('home_id', home!.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return z.array(roomGroupSchema).parse(data)
    },
  })

  useRealtime({ table: 'home_room_groups', homeId: home?.id, onUpdate: invalidate })
  useRealtime({ table: 'room_group_members', homeId: home?.id, onUpdate: invalidate })

  const addGroup = useMutation({
    mutationFn: async ({ group, roomIds }: { group: CreateRoomGroup; roomIds: string[] }) => {
      const { data, error } = await supabase
        .from('home_room_groups')
        .insert({ ...group, home_id: home!.id })
        .select()
        .single()
      if (error) throw error
      if (roomIds.length > 0) {
        const { error: memberError } = await supabase
          .from('room_group_members')
          .insert(roomIds.map((rid) => ({ group_id: data.id, room_id: rid })))
        if (memberError) throw memberError
      }
      return data
    },
    onSuccess: (data) => toast.success(`"${data.name}" group created`),
    onError: (err) => {
      const msg = (err as Error).message ?? ''
      if (msg.includes('unique')) toast.error('A group with that name already exists')
      else toast.error(translateError(err))
    },
    onSettled: invalidate,
  })

  const updateGroup = useMutation({
    mutationFn: async ({ id, name, icon }: { id: string; name: string; icon: string }) => {
      const { error } = await supabase
        .from('home_room_groups')
        .update({ name, icon })
        .eq('id', id)
      if (error) throw error
    },
    onError: (err) => {
      const msg = (err as Error).message ?? ''
      if (msg.includes('unique')) toast.error('A group with that name already exists')
      else toast.error(translateError(err))
    },
    onSettled: invalidate,
  })

  // Replace all members of a group atomically (delete + insert)
  const setGroupMembers = useMutation({
    mutationFn: async ({ groupId, roomIds }: { groupId: string; roomIds: string[] }) => {
      const { error: delError } = await supabase
        .from('room_group_members')
        .delete()
        .eq('group_id', groupId)
      if (delError) throw delError
      if (roomIds.length > 0) {
        const { error: insError } = await supabase
          .from('room_group_members')
          .insert(roomIds.map((rid) => ({ group_id: groupId, room_id: rid })))
        if (insError) throw insError
      }
    },
    onError: (err) => toast.error(translateError(err)),
    onSettled: invalidate,
  })

  const deleteGroup = useMutation({
    mutationFn: async ({ id }: { id: string; name: string }) => {
      const { error } = await supabase.from('home_room_groups').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, { name }) => toast.success(`"${name}" group removed`),
    onError: (err) => toast.error(translateError(err)),
    onSettled: invalidate,
  })

  return {
    groups: query.data ?? [],
    isLoading: query.isLoading,
    addGroup,
    updateGroup,
    setGroupMembers,
    deleteGroup,
  }
}
