'use server'

import { createClient } from '@/lib/db/server'
import { sanitizeDatabaseError } from '@/lib/utils/security'
import { z } from 'zod'
import { logError } from '@/lib/utils/error-handler'

// Zod schema for validation and basic XSS prevention (stripping HTML tags)
const SearchSchema = z.object({
  query: z
    .string()
    .max(100, 'Search query is too long')
    .transform((str) => str.replace(/<[^>]*>?/gm, '').trim()), // Strip HTML tags
})

export async function searchAllData(rawQuery: string) {
  // Validate and sanitize the input
  const validation = SearchSchema.safeParse({ query: rawQuery })
  
  if (!validation.success || !validation.data.query) {
    return { success: true, data: { clients: [], invoices: [] } }
  }

  const query = validation.data.query

  // Prevent wildcard injection by stripping % and _
  const safeQuery = query.replace(/[%_]/g, '')
  if (!safeQuery) {
    return { success: true, data: { clients: [], invoices: [] } }
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const searchTerm = `%${safeQuery}%`

    // C8: Search clients (exclude soft-deleted)
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, client_name, email')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .or(`client_name.ilike."${searchTerm}",email.ilike."${searchTerm}"`)
      .limit(10)

    if (clientsError) throw clientsError

    const clientIds = clients?.map((c) => c.id) || []

    // C8: Search invoices (exclude soft-deleted)
    let invoiceQuery = supabase
      .from('invoices')
      .select('id, invoice_number, status, amount, client_id, clients(client_name)')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .limit(10)

    // Search by invoice_number OR by the clients we just found
    if (clientIds.length > 0) {
      invoiceQuery = invoiceQuery.or(
        `invoice_number.ilike."${searchTerm}",client_id.in.(${clientIds.join(',')})`
      )
    } else {
      invoiceQuery = invoiceQuery.ilike('invoice_number', `${searchTerm}`)
    }

    const { data: invoices, error: invoicesError } = await invoiceQuery

    if (invoicesError) throw invoicesError

    return { 
      success: true, 
      data: { 
        clients: clients || [], 
        invoices: invoices || [] 
      } 
    }
  } catch (error: unknown) {
    logError('search/searchAllData', error)
    return { success: false, error: sanitizeDatabaseError(error) }
  }
}
