'use server'

import { createClient } from '@/lib/db/server'
import { revalidatePath } from 'next/cache'

export async function createInvoiceAction(formData: FormData) {
  try {
    const clientId = formData.get('clientId') as string
    const invoiceNumber = formData.get('invoiceNumber') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const amount = parseFloat(formData.get('amount') as string)
    const currency = (formData.get('currency') as string) || 'USD'
    const dueDate = formData.get('dueDate') as string
    const notes = formData.get('notes') as string
    const paymentLink = formData.get('paymentLink') as string

    if (!clientId) return { error: 'Client is required.' }
    if (!invoiceNumber || invoiceNumber.trim().length === 0) return { error: 'Invoice number is required.' }
    if (isNaN(amount) || amount < 0) return { error: 'Amount must be 0 or greater.' }
    if (!dueDate) return { error: 'Due date is required.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        client_id: clientId,
        invoice_number: invoiceNumber.trim(),
        title: title?.trim() || null,
        description: description?.trim() || null,
        amount,
        currency,
        status: 'sent',
        due_date: dueDate,
        notes: notes?.trim() || null,
        payment_link: paymentLink?.trim() || null,
      })
      .select()
      .single()

    if (error) return { error: error.message }

    revalidatePath('/invoices')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function getInvoicesAction(filters?: { status?: string; clientId?: string }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    let query = supabase
      .from('invoices')
      .select('*, clients (client_name, email, company_name)')
      .eq('user_id', user.id)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId)
    }

    query = query.order('due_date', { ascending: true })

    const { data, error } = await query

    if (error) return { error: error.message }

    return { success: true, data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function getInvoiceDetailAction(invoiceId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const { data, error } = await supabase
      .from('invoices')
      .select('*, clients (*)')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (error) return { error: error.message }

    return { success: true, data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function updateInvoiceAction(invoiceId: string, formData: FormData) {
  try {
    const clientId = formData.get('clientId') as string
    const invoiceNumber = formData.get('invoiceNumber') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const amount = parseFloat(formData.get('amount') as string)
    const currency = (formData.get('currency') as string) || 'USD'
    const dueDate = formData.get('dueDate') as string
    const notes = formData.get('notes') as string
    const paymentLink = formData.get('paymentLink') as string

    if (!clientId) return { error: 'Client is required.' }
    if (!invoiceNumber || invoiceNumber.trim().length === 0) return { error: 'Invoice number is required.' }
    if (isNaN(amount) || amount < 0) return { error: 'Amount must be 0 or greater.' }
    if (!dueDate) return { error: 'Due date is required.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const { data, error } = await supabase
      .from('invoices')
      .update({
        client_id: clientId,
        invoice_number: invoiceNumber.trim(),
        title: title?.trim() || null,
        description: description?.trim() || null,
        amount,
        currency,
        due_date: dueDate,
        notes: notes?.trim() || null,
        payment_link: paymentLink?.trim() || null,
      })
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return { error: error.message }

    revalidatePath('/invoices')
    revalidatePath(`/invoices/${invoiceId}`)
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function deleteInvoiceAction(invoiceId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/invoices')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function markInvoicePaidAction(invoiceId: string, paidDate?: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const paid = paidDate || new Date().toISOString().split('T')[0]

    const { data: invoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_date: paid,
      })
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) return { error: updateError.message }

    // Log status change event
    const { error: eventError } = await supabase
      .from('reminder_events')
      .insert({
        user_id: user.id,
        invoice_id: invoiceId,
        event_type: 'status_changed',
        description: 'Invoice marked as paid',
      })

    if (eventError) {
      // Non-fatal: invoice was already updated, just log the event failure
      console.error('Failed to log status_changed event:', eventError.message)
    }

    revalidatePath('/invoices')
    revalidatePath(`/invoices/${invoiceId}`)
    revalidatePath('/dashboard')
    return { success: true, data: invoice }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}
