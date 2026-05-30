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

    const taxRate = parseFloat(formData.get('taxRate') as string) || 0
    const taxLabel = (formData.get('taxLabel') as string) || 'Tax'
    const discountAmount = parseFloat(formData.get('discountAmount') as string) || 0
    const discountType = (formData.get('discountType') as string) || 'flat'
    const status = (formData.get('status') as string) || 'sent'

    // Server-side Gap Enforcement: calculate expected next sequential number
    const nextSeqRes = await getNextInvoiceNumberAction()
    const finalInvoiceNumber = (nextSeqRes.success && nextSeqRes.data) ? nextSeqRes.data : (invoiceNumber?.trim() || 'INV-001')

    if (!clientId) return { error: 'Client is required.' }
    if (!finalInvoiceNumber || finalInvoiceNumber.trim().length === 0) return { error: 'Invoice number is required.' }
    if (finalInvoiceNumber.trim().length > 50) return { error: 'Invoice number must be 50 characters or less.' }
    if (title && title.trim().length > 150) return { error: 'Title must be 150 characters or less.' }
    if (description && description.trim().length > 1000) return { error: 'Description must be 1000 characters or less.' }
    if (isNaN(amount) || amount < 0) return { error: 'Amount must be 0 or greater.' }
    if (currency.trim().length > 10) return { error: 'Currency must be 10 characters or less.' }
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) return { error: 'Tax rate must be between 0 and 100.' }
    if (isNaN(discountAmount) || discountAmount < 0) return { error: 'Discount must be 0 or greater.' }
    if (discountType !== 'flat' && discountType !== 'percentage') return { error: 'Invalid discount type.' }
    if (status !== 'draft' && status !== 'sent') return { error: 'Invalid invoice status.' }
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
        invoice_number: finalInvoiceNumber.trim(),
        title: title?.trim() || null,
        description: description?.trim() || null,
        amount,
        currency,
        status: status as any,
        due_date: dueDate,
        notes: notes?.trim() || null,
        payment_link: paymentLink?.trim() || null,
        po_number: poNumber?.trim() || null,
        line_items: lineItems,
        tax_rate: taxRate,
        tax_label: taxLabel.trim() || 'Tax',
        discount_amount: discountAmount,
        discount_type: discountType,
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('global_rules')
      .eq('id', user.id)
      .single()

    const prefix = profile?.global_rules?.invoice_prefix?.trim() || 'INV-'
    const format = profile?.global_rules?.invoice_format || 'PREFIX-[SEQUENCE]'

    // Fetch highest invoice number created by this user (including soft deleted to prevent gaps!)
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const yearStr = new Date().getFullYear().toString()
    let nextSeq = 1

    if (lastInvoice?.invoice_number) {
      const numMatch = lastInvoice.invoice_number.match(/(\d+)$/)
      if (numMatch) {
        nextSeq = parseInt(numMatch[1], 10) + 1
      }
    }

    const seqPad = String(nextSeq).padStart(3, '0')

    let nextNumber = ''
    if (format === 'PREFIX-[YEAR]-[SEQUENCE]') {
      nextNumber = `${prefix}${yearStr}-${seqPad}`
    } else {
      nextNumber = `${prefix}${seqPad}`
    }

    return { success: true, data: nextNumber }
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

    const taxRate = parseFloat(formData.get('taxRate') as string) || 0
    const taxLabel = (formData.get('taxLabel') as string) || 'Tax'
    const discountAmount = parseFloat(formData.get('discountAmount') as string) || 0
    const discountType = (formData.get('discountType') as string) || 'flat'
    const status = formData.get('status') as string | null

    if (!clientId) return { error: 'Client is required.' }
    if (!invoiceNumber || invoiceNumber.trim().length === 0) return { error: 'Invoice number is required.' }
    if (invoiceNumber.trim().length > 50) return { error: 'Invoice number must be 50 characters or less.' }
    if (title && title.trim().length > 150) return { error: 'Title must be 150 characters or less.' }
    if (description && description.trim().length > 1000) return { error: 'Description must be 1000 characters or less.' }
    if (isNaN(amount) || amount < 0) return { error: 'Amount must be 0 or greater.' }
    if (currency.trim().length > 10) return { error: 'Currency must be 10 characters or less.' }
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) return { error: 'Tax rate must be between 0 and 100.' }
    if (isNaN(discountAmount) || discountAmount < 0) return { error: 'Discount must be 0 or greater.' }
    if (discountType !== 'flat' && discountType !== 'percentage') return { error: 'Invalid discount type.' }
    if (status && status !== 'draft' && status !== 'sent') return { error: 'Invalid invoice status.' }
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
        tax_rate: taxRate,
        tax_label: taxLabel.trim() || 'Tax',
        discount_amount: discountAmount,
        discount_type: discountType,
        ...(status ? { status: status as any } : {}),
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

    // H3: Verify the invoice is soft-deleted before allowing hard delete
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('deleted_at')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !invoice) {
      return { error: 'Invoice not found.' }
    }

    if (invoice.deleted_at === null) {
      return { error: 'Item must be moved to trash before permanently deleting.' }
    }

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

/** Valid invoice status values that can be set via updateInvoiceStatusAction */
const VALID_UPDATE_STATUSES = [
  'draft', 'sent', 'due_soon', 'overdue', 'paid', 'partial', 'promised', 'paused', 'archived'
] as const

export async function updateInvoiceStatusAction(invoiceId: string, status: string, amountPaid: number = 0) {
  try {
    // C2: Validate status against allowed values
    if (!VALID_UPDATE_STATUSES.includes(status as typeof VALID_UPDATE_STATUSES[number])) {
      return { error: `Invalid invoice status. Allowed values: ${VALID_UPDATE_STATUSES.join(', ')}` }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    // C3: When status is 'partial', validate amountPaid against the invoice's total amount
    const updateData: Record<string, unknown> = { status }
    if (status === 'partial') {
      // Validate amountPaid is a valid number
      if (typeof amountPaid !== 'number' || isNaN(amountPaid) || !isFinite(amountPaid)) {
        return { error: 'Amount paid must be a valid number.' }
      }
      if (amountPaid <= 0) {
        return { error: 'Amount paid must be greater than zero.' }
      }

      // Fetch the invoice to validate against its total amount
      const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('amount')
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .single()

      if (fetchError || !invoice) {
        return { error: 'Invoice not found.' }
      }

      if (amountPaid >= invoice.amount) {
        return { error: `Amount paid (${amountPaid}) must be less than the invoice total (${invoice.amount}). Use "Mark as Paid" for full payment.` }
      }

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
