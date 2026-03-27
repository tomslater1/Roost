import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { logActivity } from '@/lib/activity'
import { translateError } from '@/lib/errors'
import { useAuthContext } from '@/context/AuthContext'
import { useHome } from './useHome'
import { useRealtime } from './useRealtime'
import { createPinboardNoteSchema, pinboardNoteSchema, type CreatePinboardNote } from '@/lib/schemas/pinboard'

const QUERY_KEY = 'pinboard-notes'

export function usePinboard() {
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pinboard_notes')
        .select('*, pinboard_note_acknowledgements(*)')
        .eq('home_id', home!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return z.array(pinboardNoteSchema).parse(data)
    },
  })

  useRealtime({
    table: 'pinboard_notes',
    homeId: home?.id,
    onUpdate: invalidate,
    filter: `home_id=eq.${home?.id}`,
  })

  const addNote = useMutation({
    mutationFn: async (input: CreatePinboardNote) => {
      const note = createPinboardNoteSchema.parse(input)
      const { data, error } = await supabase
        .from('pinboard_notes')
        .insert({
          home_id: home!.id,
          author_id: user!.id,
          content: note.content,
          link_type: note.link_type ?? null,
          link_label: note.link_label?.trim() || null,
          linked_entity_id: note.linked_entity_id ?? null,
          target_scope: note.target_scope,
          target_user_id: note.target_user_id ?? null,
          notify_on_create: note.notify_on_create,
          expires_at: note.expires_at ?? null,
        })
        .select()
        .single()

      if (error) throw error
      return pinboardNoteSchema.parse(data)
    },
    onSuccess: async (data) => {
      await logActivity({
        homeId: home!.id,
        userId: user!.id,
        action: `pinned a note${data.link_label ? ` about ${data.link_label}` : ''}`,
        entityType: 'pinboard_note',
        entityId: data.id,
      })
      toast.success('Note pinned')
    },
    onError: (err) => toast.error(translateError(err)),
    onSettled: invalidate,
  })

  const deleteNote = useMutation({
    mutationFn: async ({ id }: { id: string; content: string }) => {
      const { error } = await supabase.from('pinboard_notes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: async (_data, vars) => {
      await logActivity({
        homeId: home!.id,
        userId: user!.id,
        action: `took down a pinboard note`,
        entityType: 'pinboard_note',
        entityId: vars.id,
      })
      toast.success('Note removed')
    },
    onError: (err) => toast.error(translateError(err)),
    onSettled: invalidate,
  })

  const acknowledgeNote = useMutation({
    mutationFn: async ({ noteId }: { noteId: string }) => {
      const { error } = await supabase
        .from('pinboard_note_acknowledgements')
        .upsert({ note_id: noteId, user_id: user!.id, seen_at: new Date().toISOString() }, { onConflict: 'note_id,user_id' })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Noted')
    },
    onError: (err) => toast.error(translateError(err)),
    onSettled: invalidate,
  })

  return {
    notes: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    addNote,
    deleteNote,
    acknowledgeNote,
    isAdding: addNote.isPending,
  }
}
