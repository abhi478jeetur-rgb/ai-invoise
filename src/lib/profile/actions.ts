'use server'

import { createClient } from '@/lib/db/server'
import { revalidatePath } from 'next/cache'
import { sanitizeDatabaseError } from '@/lib/utils/security'
import { onboardingSchema, type OnboardingFormData } from '@/lib/onboarding/schema'
import { z } from 'zod'

export async function saveOnboardingSurveyAction(data: OnboardingFormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const parsed = onboardingSchema.safeParse(data)
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message }
    }

    const { full_name, use_case, role, primary_problem, setup_preference } = parsed.data

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: full_name.trim(),
        use_case,
        role,
        primary_problem,
        setup_preference,
        onboarding_completed: true,
      })
      .eq('id', user.id)

    if (error) return { error: sanitizeDatabaseError(error) }

    // Also update auth metadata so the name is available everywhere
    await supabase.auth.updateUser({
      data: { full_name: full_name.trim() },
    })

    revalidatePath('/dashboard', 'layout')
    revalidatePath('/settings')
    revalidatePath('/', 'layout')
    return { success: true, setup_preference }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

// Legacy action kept for backward compatibility with TourManager
export async function updateUserOnboardingAction(data: Record<string, any>) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const updates: Record<string, any> = { onboarding_completed: true }
    if (data.full_name) updates.full_name = data.full_name.trim()

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) return { error: sanitizeDatabaseError(error) }
    revalidatePath('/dashboard')
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function getOnboardingStatusAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const { data, error } = await supabase
      .from('profiles')
      .select('onboarding_completed, setup_preference, full_name')
      .eq('id', user.id)
      .single()

    if (error) return { error: sanitizeDatabaseError(error) }
    return { success: true, data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function completeTourAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const { error } = await supabase
      .from('profiles')
      .update({ setup_preference: 'completed' })
      .eq('id', user.id)

    if (error) return { error: sanitizeDatabaseError(error) }
    
    revalidatePath('/dashboard', 'layout')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

const REMINDER_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const
const REMINDER_TIMES = ['Morning', 'Afternoon', 'Evening'] as const

const reminderSettingsSchema = z.object({
  reminder_enabled: z.boolean(),
  reminder_day: z.enum(REMINDER_DAYS).optional(),
  reminder_time: z.enum(REMINDER_TIMES).optional()
}).refine(
  (data) => {
    if (data.reminder_enabled) {
      return !!data.reminder_day && !!data.reminder_time
    }
    return true
  },
  { message: 'Reminder day and time are required when reminders are enabled.' }
)

export async function updateReminderSettingsAction(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const reminder_enabled = formData.get('reminder_enabled') === 'true'
    const reminder_day = formData.get('reminder_day') as string
    const reminder_time = formData.get('reminder_time') as string

    const parsed = reminderSettingsSchema.safeParse({
      reminder_enabled,
      reminder_day,
      reminder_time
    })
    
    if (!parsed.success) {
      return { error: 'Invalid settings data.' }
    }

    const updatePayload: Record<string, unknown> = {
      reminder_enabled: parsed.data.reminder_enabled,
    }
    if (parsed.data.reminder_enabled) {
      updatePayload.reminder_day = parsed.data.reminder_day
      updatePayload.reminder_time = parsed.data.reminder_time
    }

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id)

    if (error) return { error: sanitizeDatabaseError(error) }
    
    revalidatePath('/settings')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}
