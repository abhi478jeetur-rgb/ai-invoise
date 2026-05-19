'use server'

import { createClient } from '@/lib/db/server'
import { revalidatePath } from 'next/cache'

export async function createClientAction(formData: FormData) {
  const clientName = formData.get('clientName') as string
  if (!clientName || clientName.trim().length === 0) {
    return { error: 'Client name is required.' }
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
      contact_name: (formData.get('contactName') as string) || null,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      company_name: (formData.get('companyName') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/clients')
  return { success: true, data }
}

export async function getClientsAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be authenticated.' }
  }

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('client_name', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  return { success: true, data }
}

export async function updateClientAction(clientId: string, formData: FormData) {
  const clientName = formData.get('clientName') as string
  if (!clientName || clientName.trim().length === 0) {
    return { error: 'Client name is required.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be authenticated.' }
  }

  const { data, error } = await supabase
    .from('clients')
    .update({
      client_name: clientName.trim(),
      contact_name: (formData.get('contactName') as string) || null,
      email: (formData.get('email') as string) || null,
      phone: (formData.get('phone') as string) || null,
      company_name: (formData.get('companyName') as string) || null,
      notes: (formData.get('notes') as string) || null,
    })
    .eq('id', clientId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/clients')
  revalidatePath(`/clients/${clientId}`)
  return { success: true, data }
}

export async function deleteClientAction(clientId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be authenticated.' }
  }

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/clients')
  return { success: true }
}
