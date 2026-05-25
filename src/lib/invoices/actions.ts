'use server'

import { createClient } from '@/lib/db/server'
import { revalidatePath } from 'next/cache'
import { sanitizeDatabaseError } from '@/lib/utils/security'

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
    const poNumber = formData.get('poNumber') as string
    const lineItemsRaw = formData.get('lineItems') as string
    let lineItems = []
    if (lineItemsRaw) {
      try { lineItems = JSON.parse(lineItemsRaw) } catch (e) {}
    }

    if (!clientId) return { error: 'Client is required.' }
    if (!invoiceNumber || invoiceNumber.trim().length === 0) return { error: 'Invoice number is required.' }
    if (invoiceNumber.trim().length > 50) return { error: 'Invoice number must be 50 characters or less.' }
    if (title && title.trim().length > 150) return { error: 'Title must be 150 characters or less.' }
    if (description && description.trim().length > 1000) return { error: 'Description must be 1000 characters or less.' }
    if (isNaN(amount) || amount < 0) return { error: 'Amount must be 0 or greater.' }
    if (currency.trim().length > 10) return { error: 'Currency must be 10 characters or less.' }
    if (!dueDate) return { error: 'Due date is required.' }

    const dueTime = new Date(dueDate).getTime()
    if (isNaN(dueTime)) return { error: 'Invalid due date format.' }
    
    const now = new Date()
    const oneYearPast = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime()
    const oneYearFuture = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).getTime()
    
    if (dueTime < oneYearPast) return { error: 'Due date cannot be more than 1 year in the past.' }
    if (dueTime > oneYearFuture) return { error: 'Due date cannot be more than 1 year in the future.' }

    if (notes && notes.trim().length > 1000) return { error: 'Notes must be 1000 characters or less.' }
    if (paymentLink && paymentLink.trim().length > 500) return { error: 'Payment link must be 500 characters or less.' }
    if (paymentLink && !/^https?:\/\//i.test(paymentLink.trim())) return { error: 'Payment link must be a valid HTTP or HTTPS URL.' }
    if (poNumber && poNumber.trim().length > 100) return { error: 'PO Number must be 100 characters or less.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    // Verify that the client belongs to the authenticated user (IDOR prevention)
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      return { error: 'Invalid client reference.' }
    }

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
        po_number: poNumber?.trim() || null,
        line_items: lineItems,
      })
      .select()
      .single()

    if (error) return { error: sanitizeDatabaseError(error) }

    revalidatePath('/invoices')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function getNextInvoiceNumberAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return { success: true, data: 'INV-001' }

    const match = data.invoice_number.match(/^([A-Za-z]+-)(\d+)$/)
    if (!match) return { success: true, data: 'INV-001' }

    const prefix = match[1]
    const num = parseInt(match[2], 10) + 1
    const next = prefix + String(num).padStart(match[2].length, '0')

    return { success: true, data: next }
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
      .is('deleted_at', null)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.clientId) {
      query = query.eq('client_id', filters.clientId)
    }

    query = query.order('due_date', { ascending: true })

    const { data, error } = await query

    if (error) return { error: sanitizeDatabaseError(error) }

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

    if (error) return { error: sanitizeDatabaseError(error) }

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
    const lineItemsRaw = formData.get('lineItems') as string
    let lineItems = []
    if (lineItemsRaw) {
      try { lineItems = JSON.parse(lineItemsRaw) } catch (e) {}
    }

    if (!clientId) return { error: 'Client is required.' }
    if (!invoiceNumber || invoiceNumber.trim().length === 0) return { error: 'Invoice number is required.' }
    if (invoiceNumber.trim().length > 50) return { error: 'Invoice number must be 50 characters or less.' }
    if (title && title.trim().length > 150) return { error: 'Title must be 150 characters or less.' }
    if (description && description.trim().length > 1000) return { error: 'Description must be 1000 characters or less.' }
    if (isNaN(amount) || amount < 0) return { error: 'Amount must be 0 or greater.' }
    if (currency.trim().length > 10) return { error: 'Currency must be 10 characters or less.' }
    if (!dueDate) return { error: 'Due date is required.' }

    const dueTime = new Date(dueDate).getTime()
    if (isNaN(dueTime)) return { error: 'Invalid due date format.' }
    
    const now = new Date()
    const oneYearPast = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).getTime()
    const oneYearFuture = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).getTime()
    
    if (dueTime < oneYearPast) return { error: 'Due date cannot be more than 1 year in the past.' }
    if (dueTime > oneYearFuture) return { error: 'Due date cannot be more than 1 year in the future.' }

    if (notes && notes.trim().length > 1000) return { error: 'Notes must be 1000 characters or less.' }
    if (paymentLink && paymentLink.trim().length > 500) return { error: 'Payment link must be 500 characters or less.' }
    if (paymentLink && !/^https?:\/\//i.test(paymentLink.trim())) return { error: 'Payment link must be a valid HTTP or HTTPS URL.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    // Verify that the client belongs to the authenticated user (IDOR prevention)
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single()

    if (clientError || !client) {
      return { error: 'Invalid client reference.' }
    }

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
        line_items: lineItems,
      })
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return { error: sanitizeDatabaseError(error) }

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
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', invoiceId)
      .eq('user_id', user.id)

    if (error) return { error: sanitizeDatabaseError(error) }

    revalidatePath('/invoices')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function getDeletedInvoicesAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const { data, error } = await supabase
      .from('invoices')
      .select('*, clients (client_name, email, company_name)')
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })

    if (error) return { error: sanitizeDatabaseError(error) }

    return { success: true, data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function restoreInvoiceAction(invoiceId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const { error } = await supabase
      .from('invoices')
      .update({ deleted_at: null })
      .eq('id', invoiceId)
      .eq('user_id', user.id)

    if (error) return { error: sanitizeDatabaseError(error) }

    revalidatePath('/invoices')
    revalidatePath('/dashboard')
    revalidatePath('/trash')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function hardDeleteInvoiceAction(invoiceId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('user_id', user.id)

    if (error) return { error: sanitizeDatabaseError(error) }

    revalidatePath('/trash')
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

    if (updateError) return { error: sanitizeDatabaseError(updateError) }

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

export async function updateInvoiceStatusAction(invoiceId: string, status: string, amountPaid: number = 0) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const updateData: any = { status }
    if (status === 'partial') {
      updateData.amount_paid = amountPaid
    } else if (status === 'paid') {
      updateData.paid_date = new Date().toISOString().split('T')[0]
    }

    const { data: invoice, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) return { error: sanitizeDatabaseError(updateError) }

    // Log status change event
    const { error: eventError } = await supabase
      .from('reminder_events')
      .insert({
        user_id: user.id,
        invoice_id: invoiceId,
        event_type: 'status_changed',
        description: `Invoice status changed to ${status}`,
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
