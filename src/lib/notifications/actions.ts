'use server'

import { createClient } from '@/lib/db/server'
import { revalidatePath } from 'next/cache'
import { sanitizeDatabaseError } from '@/lib/utils/security'
import { logError } from '@/lib/utils/error-handler'

export async function getNotifications() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return { success: false, error: sanitizeDatabaseError(error) }

    return { success: true, data }
  } catch (error: unknown) {
    logError('notifications/getNotifications', error)
    return { success: false, error: sanitizeDatabaseError(error) }
  }
}

export async function markAsRead(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { success: false, error: sanitizeDatabaseError(error) }
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error: unknown) {
    logError('notifications/markAsRead', error)
    return { success: false, error: sanitizeDatabaseError(error) }
  }
}

export async function clearAllNotifications() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) return { success: false, error: sanitizeDatabaseError(error) }
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error: unknown) {
    logError('notifications/clearAllNotifications', error)
    return { success: false, error: sanitizeDatabaseError(error) }
  }
}
