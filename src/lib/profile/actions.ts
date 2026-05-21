'use server'

import { createClient } from '@/lib/db/server'
import { revalidatePath } from 'next/cache'
import { sanitizeDatabaseError } from '@/lib/utils/security'

interface OnboardingData {
  full_name?: string
  profession?: string
  primary_problem?: string
  discovery_source?: string
}

export async function updateUserOnboardingAction(data: OnboardingData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const updates: Record<string, any> = {
      onboarding_completed: true,
    }

    if (data.full_name !== undefined) {
      const trimmed = data.full_name.trim()
      if (trimmed.length > 0) updates.full_name = trimmed
    }
    if (data.profession !== undefined) {
      updates.profession = data.profession.trim() || null
    }
    if (data.primary_problem !== undefined) {
      updates.primary_problem = data.primary_problem.trim() || null
    }
    if (data.discovery_source !== undefined) {
      updates.discovery_source = data.discovery_source.trim() || null
    }

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
