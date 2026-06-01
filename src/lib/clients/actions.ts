'use server'

import { createClient } from '@/lib/db/server'
import { revalidatePath } from 'next/cache'
import { sanitizeDatabaseError } from '@/lib/utils/security'

// M18: UUID validation helper
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}

export async function createClientAction(formData: FormData) {
  try {
    const clientName = formData.get('clientName') as string
    const contactName = formData.get('contactName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const companyName = formData.get('companyName') as string
    const notes = formData.get('notes') as string

    if (!clientName || clientName.trim().length === 0) {
      return { error: 'Client name is required.' }
    }
    if (clientName.trim().length > 100) {
      return { error: 'Client name must be 100 characters or less.' }
    }
    if (contactName && contactName.trim().length > 100) {
      return { error: 'Contact name must be 100 characters or less.' }
    }
    if (email && email.trim().length > 150) {
      return { error: 'Email must be 150 characters or less.' }
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return { error: 'Invalid email address format.' }
    }
    if (phone && phone.trim().length > 30) {
      return { error: 'Phone must be 30 characters or less.' }
    }
    if (companyName && companyName.trim().length > 100) {
      return { error: 'Company name must be 100 characters or less.' }
    }
    if (notes && notes.trim().length > 1000) {
      return { error: 'Notes must be 1000 characters or less.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'You must be authenticated.' }
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        client_name: clientName.trim(),
        contact_name: contactName?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        company_name: companyName?.trim() || null,
        notes: notes?.trim() || null,
      })
      .select()
      .single()

    if (error) {
      return { error: sanitizeDatabaseError(error) }
    }

    revalidatePath('/clients')
    return { success: true, data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function getClientsAction(page: number = 1, limit: number = 15) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const start = (page - 1) * limit
    const end = start + limit - 1

    const { data, error } = await supabase
      .from('clients')
      .select('id, client_name, email, phone, company_name, created_at, updated_at, deleted_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('client_name', { ascending: true })
      .range(start, end)

    if (error) {
      return { error: sanitizeDatabaseError(error) }
    }

    const hasMore = data ? data.length === limit : false

    return { success: true, data, hasMore }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function updateClientAction(clientId: string, formData: FormData) {
  try {
    if (!isValidUUID(clientId)) return { error: 'Invalid client ID format.' }

    const clientName = formData.get('clientName') as string
    const contactName = formData.get('contactName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const companyName = formData.get('companyName') as string
    const notes = formData.get('notes') as string

    if (!clientName || clientName.trim().length === 0) {
      return { error: 'Client name is required.' }
    }
    if (clientName.trim().length > 100) {
      return { error: 'Client name must be 100 characters or less.' }
    }
    if (contactName && contactName.trim().length > 100) {
      return { error: 'Contact name must be 100 characters or less.' }
    }
    if (email && email.trim().length > 150) {
      return { error: 'Email must be 150 characters or less.' }
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return { error: 'Invalid email address format.' }
    }
    if (phone && phone.trim().length > 30) {
      return { error: 'Phone must be 30 characters or less.' }
    }
    if (companyName && companyName.trim().length > 100) {
      return { error: 'Company name must be 100 characters or less.' }
    }
    if (notes && notes.trim().length > 1000) {
      return { error: 'Notes must be 1000 characters or less.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'You must be authenticated.' }
    }

    // M18: Verify client is not soft-deleted before allowing update
    const { data: existingClient, error: fetchError } = await supabase
      .from('clients')
      .select('deleted_at')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingClient) {
      return { error: 'Client not found.' }
    }

    if (existingClient.deleted_at !== null) {
      return { error: 'Cannot edit a deleted client. Restore it first.' }
    }

    const { data, error } = await supabase
      .from('clients')
      .update({
        client_name: clientName.trim(),
        contact_name: contactName?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        company_name: companyName?.trim() || null,
        notes: notes?.trim() || null,
      })
      .eq('id', clientId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return { error: sanitizeDatabaseError(error) }
    }

    revalidatePath('/clients')
    revalidatePath(`/clients/${clientId}`)
    return { success: true, data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function deleteClientAction(clientId: string) {
  try {
    if (!isValidUUID(clientId)) return { error: 'Invalid client ID format.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'You must be authenticated.' }
    }

    const deletedAt = new Date().toISOString()

    // M16: Only update if not already soft-deleted to prevent timestamp corruption
    const { error } = await supabase
      .from('clients')
      .update({ deleted_at: deletedAt })
      .eq('id', clientId)
      .eq('user_id', user.id)
      .is('deleted_at', null)

    if (!error) {
      // Cascade soft delete to invoices (M31: only touch active invoices)
      const { error: cascadeError } = await supabase
        .from('invoices')
        .update({ deleted_at: deletedAt })
        .eq('client_id', clientId)
        .eq('user_id', user.id)
        .is('deleted_at', null)

      if (cascadeError) {
        console.error('Cascade soft-delete warning:', cascadeError)
      }
    }

    if (error) {
      return { error: sanitizeDatabaseError(error) }
    }

    revalidatePath('/clients')
    revalidatePath('/invoices')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function getDeletedClientsAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'You must be authenticated.' }
    }

    const { data, error } = await supabase
      .from('clients')
      .select('id, client_name, email, phone, company_name, deleted_at')
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .limit(50)

    if (error) {
      return { error: sanitizeDatabaseError(error) }
    }

    return { success: true, data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function restoreClientAction(clientId: string) {
  try {
    if (!isValidUUID(clientId)) return { error: 'Invalid client ID format.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'You must be authenticated.' }
    }

    // H4: First fetch the client to get its deleted_at timestamp
    const { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('deleted_at')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !client) {
      return { error: 'Client not found.' }
    }

    const { error } = await supabase
      .from('clients')
      .update({ deleted_at: null })
      .eq('id', clientId)
      .eq('user_id', user.id)

    if (!error && client.deleted_at) {
      // H4: Only restore invoices that were cascade-deleted at the same time as the client.
      // This prevents restoring invoices that were individually soft-deleted before the client was deleted.
      await supabase
        .from('invoices')
        .update({ deleted_at: null })
        .eq('client_id', clientId)
        .eq('user_id', user.id)
        .eq('deleted_at', client.deleted_at)
    }

    if (error) {
      return { error: sanitizeDatabaseError(error) }
    }

    revalidatePath('/clients')
    revalidatePath('/invoices')
    revalidatePath('/dashboard')
    revalidatePath('/trash')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function hardDeleteClientAction(clientId: string) {
  try {
    if (!isValidUUID(clientId)) return { error: 'Invalid client ID format.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'You must be authenticated.' }
    }

    // H2: Verify the client is soft-deleted before allowing hard delete
    const { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('deleted_at')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !client) {
      return { error: 'Client not found.' }
    }

    if (client.deleted_at === null) {
      return { error: 'Item must be moved to trash before permanently deleting.' }
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('user_id', user.id)

    if (error) {
      return { error: sanitizeDatabaseError(error) }
    }

    revalidatePath('/trash')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}
