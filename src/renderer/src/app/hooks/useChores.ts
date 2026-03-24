import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { addWeeks, addMonths, format } from 'date-fns'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { logActivity } from '@/lib/activity'
import { translateError } from '@/lib/errors'
import { useAuthContext } from '@/context/AuthContext'
import { useHome } from './useHome'
import { useRealtime } from './useRealtime'
import { z } from 'zod'
import { choreSchema, type Chore, type CreateChore } from '@/lib/schemas/chores'
import { normalizeInput } from '@/lib/normalizeInput'
import { activityFeedItemSchema, type ActivityFeedItem } from '@/lib/schemas/user'

function nextDueDate(currentDue: string | null | undefined, frequency: 'weekly' | 'monthly'): string {
  const base = currentDue ? new Date(currentDue) : new Date()
  const next = frequency === 'weekly' ? addWeeks(base, 1) : addMonths(base, 1)
  return format(next, 'yyyy-MM-dd')
}

const QUERY_KEY = 'chores'
const HISTORY_KEY = 'chore-history'

export function useChores() {
  const { user } = useAuthContext()
  const { home } = useHome()
  const queryClient = useQueryClient()

  const invalidate = useCallback(
    () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, home?.id] })
      queryClient.invalidateQueries({ queryKey: [HISTORY_KEY, home?.id] })
    },
    [queryClient, home?.id]
  )

  const query = useQuery({
    queryKey: [QUERY_KEY, home?.id],
    enabled: !!home?.id,
    queryFn: async (): Promise<Chore[]> => {
      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .eq('home_id', home!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return z.array(choreSchema).parse(data)
    },
  })

  useRealtime({ table: 'chores', homeId: home?.id, onUpdate: invalidate })

  const historyQuery = useQuery({
    queryKey: [HISTORY_KEY, home?.id],
    enabled: !!home?.id,
    queryFn: async (): Promise<ActivityFeedItem[]> => {
      const { data, error } = await supabase
        .from('activity_feed')
        .select('*')
        .eq('home_id', home!.id)
        .eq('entity_type', 'chore')
        .ilike('action', 'completed%')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return z.array(activityFeedItemSchema).parse(data)
    },
  })

  const addChore = useMutation({
    onMutate: async (chore: CreateChore) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, home?.id] })
      const previous = queryClient.getQueryData<Chore[]>([QUERY_KEY, home?.id])

      const tempChore: Chore = {
        id: crypto.randomUUID(),
        home_id: home!.id,
        title: chore.title,
        description: chore.description ?? null,
        assigned_to: chore.assigned_to ?? null,
        frequency: chore.frequency ?? null,
        last_completed_at: null,
        completed_by: null,
        due_date: chore.due_date ?? null,
        room: chore.room ?? null,
        created_at: new Date().toISOString(),
      }
      queryClient.setQueryData<Chore[]>([QUERY_KEY, home?.id], (old) => [
        tempChore,
        ...(old ?? []),
      ])
      return { previous }
    },
    mutationFn: async (chore: CreateChore) => {
      const { text: title } = await normalizeInput(chore.title, 'chore').catch(() => ({ text: chore.title }))
      const { data, error } = await supabase
        .from('chores')
        .insert({ ...chore, title, home_id: home!.id })
        .select()
        .single()

      if (error) throw error
      return choreSchema.parse(data)
    },
    onSuccess: async (data) => {
      await logActivity({
        homeId: home!.id,
        userId: user!.id,
        action: `added "${data.title}" to the chore list`,
        entityType: 'chore',
        entityId: data.id,
      })
      toast.success(`"${data.title}" added`)
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, home?.id], context.previous)
      }
      toast.error(translateError(_err))
    },
    onSettled: invalidate,
  })

  const completeChore = useMutation({
    onMutate: async ({ id, frequency, due_date }: { id: string; title: string; frequency?: string | null; due_date?: string | null }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, home?.id] })
      const previous = queryClient.getQueryData<Chore[]>([QUERY_KEY, home?.id])
      const now = new Date().toISOString()
      const nextDue = frequency === 'weekly' || frequency === 'monthly'
        ? nextDueDate(due_date, frequency)
        : undefined
      queryClient.setQueryData<Chore[]>([QUERY_KEY, home?.id], (old) =>
        old?.map((c) =>
          c.id === id
            ? { ...c, last_completed_at: now, completed_by: user!.id, ...(nextDue ? { due_date: nextDue } : {}) }
            : c
        ) ?? []
      )
      return { previous }
    },
    mutationFn: async ({ id, frequency, due_date }: { id: string; title: string; frequency?: string | null; due_date?: string | null }) => {
      const update: Record<string, string> = {
        last_completed_at: new Date().toISOString(),
        completed_by: user!.id,
      }
      if (frequency === 'weekly' || frequency === 'monthly') {
        update.due_date = nextDueDate(due_date, frequency)
      }
      const { error } = await supabase.from('chores').update(update).eq('id', id)
      if (error) throw error
    },
    onSuccess: async (_data, { title, id }) => {
      await logActivity({
        homeId: home!.id,
        userId: user!.id,
        action: `completed "${title}"`,
        entityType: 'chore',
        entityId: id,
      })
      toast.success(`"${title}" marked as done`)
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, home?.id], context.previous)
      }
      toast.error(translateError(_err))
    },
    onSettled: invalidate,
  })

  const uncompleteChore = useMutation({
    onMutate: async ({ id }: { id: string }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, home?.id] })
      const previous = queryClient.getQueryData<Chore[]>([QUERY_KEY, home?.id])
      queryClient.setQueryData<Chore[]>([QUERY_KEY, home?.id], (old) =>
        old?.map((c) =>
          c.id === id ? { ...c, last_completed_at: null, completed_by: null } : c
        ) ?? []
      )
      return { previous }
    },
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from('chores')
        .update({ last_completed_at: null, completed_by: null })
        .eq('id', id)
      if (error) throw error
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUERY_KEY, home?.id], context.previous)
      }
      toast.error(translateError(_err))
    },
    onSettled: invalidate,
  })

  const deleteChore = useMutation({
    onMutate: async ({ id }: { id: string; title: string }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, home?.id] })
      const previous = queryClient.getQueryData<Chore[]>([QUERY_KEY, home?.id])
      queryClient.setQueryData<Chore[]>([QUERY_KEY, home?.id], (old) =>
        old?.filter((c) => c.id !== id) ?? []
      )
      return { previous }
    },
    mutationFn: async ({ id }: { id: string; title: string }) => {
      const { error } = await supabase.from('chores').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async (_data, { title }) => {
      toast.success(`"${title}" removed`)
      await logActivity({
        homeId: home!.id,
        userId: user!.id,
        action: `removed the chore "${title}"`,
        entityType: 'chore',
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
    chores: query.data ?? [],
    choreHistory: historyQuery.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    isAdding: addChore.isPending,
    addChore,
    completeChore,
    uncompleteChore,
    deleteChore,
  }
}
