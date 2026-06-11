'use server'

import { createClient } from '@/lib/db/server'
import { isSafeUrl } from '@/lib/utils/security'
import { logError } from '@/lib/utils/error-handler'
import { revalidateTag } from 'next/cache'
import { InvoiceStatus } from '@/lib/constants/invoice-status'

// Helper: Custom lightweight CSV parser to avoid external package overhead
function parseCSV(text: string): string[][] {
  const lines: string[][] = []
  let row: string[] = []
  let inQuotes = false
  let entry = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        entry += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push(entry.trim())
      entry = ''
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      entry = entry.trim()
      if (char === '\r' && nextChar === '\n') {
        i++
      }
      row.push(entry)
      if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
        lines.push(row)
      }
      row = []
      entry = ''
    } else {
      entry += char
    }
  }
  if (entry || row.length > 0) {
    row.push(entry.trim())
    lines.push(row)
  }
  return lines
}

export async function analyzeCSVHeadersAction(csvTextSample: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const parsed = parseCSV(csvTextSample)
    if (parsed.length === 0) {
      return { error: 'The uploaded file is empty.' }
    }

    const headers = parsed[0]
    const sampleRows = parsed.slice(1, 4) // up to 3 sample rows

    // Call Mimo LLM to map columns
    const baseUrl = process.env.AI_BASE_URL
    const modelName = process.env.AI_MODEL_NAME
    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY

    if (!baseUrl || !modelName || !apiKey) {
      return { error: 'AI configuration is missing in server environment variables.' }
    }

    const safeUrl = await isSafeUrl(baseUrl)
    if (!safeUrl) {
      return { error: 'Unsafe AI Base URL detected.' }
    }

    const prompt = `You are a column mapping engine. We need to match CSV columns to our database invoice fields.
Our expected fields are:
1. "client_name" (The name of the client receiving the invoice)
2. "invoice_number" (The invoice reference code or ID number)
3. "amount" (The billing total currency value)
4. "due_date" (The invoice payment deadline date)

Here are the CSV headers:
${JSON.stringify(headers)}

Here is some sample row data:
${JSON.stringify(sampleRows)}

Match each expected field to exactly one CSV header name. If a field cannot be matched, return null for it.
Respond ONLY with a valid JSON object matching this schema (no markdown, no code fences):
{
  "client_name": "CSV header matching client",
  "invoice_number": "CSV header matching invoice id",
  "amount": "CSV header matching amount",
  "due_date": "CSV header matching due date"
}`

    const normalizedUrl = baseUrl.replace(/\/+$/, '')
    const endpoint = `${normalizedUrl}/chat/completions`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: 'You are a precise data mapping parser. Output only valid JSON. Do not write code fences or pre/post statements.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      return { error: `AI classification failed (HTTP ${response.status})` }
    }

    const text = await response.text()
    let mapping: Record<string, string | null> = {
      client_name: null,
      invoice_number: null,
      amount: null,
      due_date: null
    }

    try {
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
      mapping = JSON.parse(cleanJson)
    } catch (e) {
      logError('invoices/csv-actions-parse-ai', e, 'Failed to parse AI response: ' + text)
    }

    return {
      success: true,
      headers,
      sampleRows,
      mapping
    }
  } catch (e) {
    logError('invoices/csv-actions-analyze', e)
    return { error: e instanceof Error ? e.message : 'Failed to analyze headers.' }
  }
}

export async function importCSVInvoicesAction(csvText: string, mapping: Record<string, string>) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const parsed = parseCSV(csvText)
    if (parsed.length <= 1) {
      return { error: 'The uploaded file has no rows to import.' }
    }

    const headers = parsed[0]
    const rows = parsed.slice(1)

    // Match column indexes from mappings
    const clientNameIdx = headers.indexOf(mapping.client_name)
    const invoiceNumberIdx = headers.indexOf(mapping.invoice_number)
    const amountIdx = headers.indexOf(mapping.amount)
    const dueDateIdx = headers.indexOf(mapping.due_date)

    if (clientNameIdx === -1 || invoiceNumberIdx === -1 || amountIdx === -1 || dueDateIdx === -1) {
      return { error: 'Invalid column mapping configuration.' }
    }

    // Load active clients to avoid duplicate creations
    const { data: existingClients, error: clientsError } = await supabase
      .from('clients')
      .select('id, client_name')
      .eq('user_id', user.id)
      .is('deleted_at', null)

    if (clientsError) throw new Error(clientsError.message)

    const clientMap = new Map<string, string>()
    existingClients?.forEach(c => {
      clientMap.set(c.client_name.toLowerCase().trim(), c.id)
    })

    let importCount = 0

    for (const row of rows) {
      if (row.length < Math.max(clientNameIdx, invoiceNumberIdx, amountIdx, dueDateIdx) + 1) {
        continue // Skip malformed rows
      }

      const clientName = row[clientNameIdx]?.trim()
      const invoiceNumber = row[invoiceNumberIdx]?.trim()
      const amountRaw = row[amountIdx]?.replace(/[^\d.]/g, '') // strip currency symbols
      const dueDateRaw = row[dueDateIdx]?.trim()

      if (!clientName || !invoiceNumber || !amountRaw || !dueDateRaw) {
        continue // Skip empty critical fields
      }

      const amount = parseFloat(amountRaw)
      if (isNaN(amount) || amount < 0) {
        continue // Skip invalid amounts
      }

      // Convert date string into a valid format or ISO date
      let dueDate = ''
      try {
        const d = new Date(dueDateRaw)
        if (isNaN(d.getTime())) continue
        dueDate = d.toISOString().split('T')[0]
      } catch {
        continue
      }

      // 1. Resolve client
      const clientKey = clientName.toLowerCase().trim()
      let clientId = clientMap.get(clientKey)

      if (!clientId) {
        // Create client dynamically
        const { data: newClient, error: newClientError } = await supabase
          .from('clients')
          .insert({
            user_id: user.id,
            client_name: clientName,
          })
          .select()
          .single()

        if (newClientError || !newClient) {
          logError('invoices/csv-import-client', newClientError || new Error('Client creation returned no data'), `Failed to create client: ${clientName}`)
          continue
        }
        if (!newClient.id) {
          logError('invoices/csv-import-client', new Error('Client creation returned no ID'), `Failed to create client: ${clientName}`)
          continue
        }
        clientId = newClient.id as string
        clientMap.set(clientKey, clientId)
      }
      
      if (!clientId) {
        continue
      }

      // 2. Insert invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          client_id: clientId,
          invoice_number: invoiceNumber,
          amount: amount,
          due_date: dueDate,
          status: 'sent' as InvoiceStatus,
          currency: 'USD'
        })

      if (invoiceError) {
        logError('invoices/csv-import-invoice', invoiceError, `Failed to insert invoice: ${invoiceNumber}`)
        continue
      }

      importCount++
    }

    revalidateTag(`dashboard-analytics-${user.id}`, 'max')

    return {
      success: true,
      count: importCount
    }
  } catch (e) {
    logError('invoices/csv-import-execute', e)
    return { error: e instanceof Error ? e.message : 'CSV import execution failed.' }
  }
}
