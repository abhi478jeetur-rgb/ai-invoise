'use server'

import { createClient } from '@/lib/db/server'
import { revalidatePath } from 'next/cache'
import { sanitizeDatabaseError } from '@/lib/utils/security'
import { z } from 'zod'

const unbilledTaskSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500, 'Description is too long'),
})

export async function getUnbilledTasksAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data, error } = await supabase
      .from('unbilled_tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) return { error: sanitizeDatabaseError(error) }
    return { success: true, data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function addUnbilledTaskAction(description: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const parsed = unbilledTaskSchema.safeParse({ description })
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const { error } = await supabase
      .from('unbilled_tasks')
      .insert({
        user_id: user.id,
        description: parsed.data.description,
        status: 'pending'
      })

    if (error) return { error: sanitizeDatabaseError(error) }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function markUnbilledTaskAsInvoicedAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
      .from('unbilled_tasks')
      .update({ status: 'invoiced' })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: sanitizeDatabaseError(error) }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteUnbilledTaskAction(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
      .from('unbilled_tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: sanitizeDatabaseError(error) }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
