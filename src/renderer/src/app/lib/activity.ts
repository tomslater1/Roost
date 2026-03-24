import { supabase } from './supabase'

// Writes a single entry to the activity feed.
// Fire-and-forget — activity logging is non-critical. A failure here should
// never block the actual mutation that caused it.
export async function logActivity({
  homeId,
  userId,
  action,
  entityType,
  entityId,
}: {
  homeId: string
  userId: string
  action: string
  entityType: string
  entityId?: string
}): Promise<void> {
  await supabase.from('activity_feed').insert({
    home_id: homeId,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
  })
}
