'use server'

import { createClient } from '@/lib/db/server'
import { revalidatePath } from 'next/cache'
import { decryptKey } from '@/lib/crypto'

interface ReminderResult {
  success?: boolean
  data?: {
    id: string
    subject: string
    body: string
    tone: string
  }
  error?: string
}

interface MultipleReminderResult {
  success?: boolean
  data?: Array<{
    id: string
    subject: string
    body: string
    tone: string
    variantIndex: number
  }>
  error?: string
}

export async function generateReminderAction(
  invoiceId: string,
  tone: 'friendly' | 'professional' | 'firm' | 'final_notice',
  customInstructions?: string
): Promise<ReminderResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    // Fetch invoice with client
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, clients (client_name, email, company_name)')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (invoiceError || !invoice) return { error: 'Invoice not found.' }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Fetch AI settings
    const { data: aiSettings, error: settingsError } = await supabase
      .from('user_ai_settings')
      .select('base_url, api_key_encrypted, model_name')
      .eq('user_id', user.id)
      .single()

    if (settingsError || !aiSettings) {
      return { error: 'AI settings not configured. Please set your API key in Settings.' }
    }

    let apiKey: string
    try {
      apiKey = decryptKey(aiSettings.api_key_encrypted)
    } catch {
      return { error: 'Failed to decrypt API key. Please re-enter your API key in Settings.' }
    }

    // Calculate days overdue
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const due = new Date(invoice.due_date + 'T00:00:00')
    due.setHours(0, 0, 0, 0)
    const daysOverdue = Math.max(0, Math.round((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))

    const client = invoice.clients as { client_name: string; email: string | null; company_name: string | null } | null
    const senderName = profile?.full_name || 'the service provider'
    const clientName = client?.client_name || 'Client'
    const companyName = client?.company_name || ''
    const currency = invoice.currency || 'USD'

    const toneDescriptions: Record<string, string> = {
      friendly: 'Soft, warm, and polite. Assume the client simply forgot. Be understanding and gentle. Use casual professional language.',
      professional: 'Standard business-appropriate. Polite but clear about the outstanding payment. Neutral and courteous tone.',
      firm: 'Urgent and direct. Set clear expectations and a specific deadline. Professional but assertive. Convey seriousness.',
      final_notice: 'Extremely direct final warning. State this is the last notice before further action. Professional but unyielding. Create urgency.',
    }

    const prompt = `You are an expert email writer specializing in payment follow-up reminders for freelancers.

Generate a payment reminder email with the following context:

SENDER:
- Name: ${senderName}

RECIPIENT:
- Client Name: ${clientName}
${companyName ? `- Company: ${companyName}` : ''}
${client?.email ? `- Email: ${client.email}` : ''}

INVOICE DETAILS:
- Invoice Number: ${invoice.invoice_number}
${invoice.title ? `- Title: ${invoice.title}` : ''}
- Amount: ${currency} ${Number(invoice.amount).toFixed(2)}
- Due Date: ${invoice.due_date}
- Days ${daysOverdue > 0 ? 'Overdue' : 'Until Due'}: ${daysOverdue > 0 ? daysOverdue : Math.abs(daysOverdue)}
${invoice.payment_link ? `- Payment Link: ${invoice.payment_link}` : ''}
${invoice.description ? `- Description: ${invoice.description}` : ''}

TONE: ${tone}
Tone Guidelines: ${toneDescriptions[tone]}

${invoice.reminder_count > 0 ? `This is reminder #${invoice.reminder_count + 1}. Previous reminders have already been sent.` : 'This is the first reminder for this invoice.'}
${customInstructions ? `\nCUSTOM INSTRUCTIONS FROM SENDER:\n${customInstructions}` : ''}

IMPORTANT RULES:
- Write as if you are ${senderName} sending to ${clientName}.
- Keep the email concise (3-5 short paragraphs max).
- Include the invoice number and amount clearly.
${invoice.payment_link ? '- Include the payment link prominently.' : ''}
- Be human-sounding, not robotic.
- Do NOT include a subject line in the body text.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{"subject": "Your subject line here", "body": "The full email body here"}`

    // Call the LLM
    const baseUrl = aiSettings.base_url.replace(/\/+$/, '')
    const endpoint = `${baseUrl}/chat/completions`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: aiSettings.model_name,
        messages: [
          { role: 'system', content: 'You are a professional email writer. Always respond with valid JSON only, no markdown formatting or code fences.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 1000,
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      return { error: `AI provider error (HTTP ${response.status}): ${errorText.slice(0, 200) || response.statusText}` }
    }

    const data = await response.json()
    const rawContent = data.choices?.[0]?.message?.content?.trim() ?? ''

    // Parse the response
    let subject: string
    let body: string

    try {
      // Try to extract JSON from the response
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonStr = jsonMatch[0]
        try {
          const parsed = JSON.parse(jsonStr)
          subject = parsed.subject || `Payment Reminder - Invoice ${invoice.invoice_number}`
          body = parsed.body || rawContent
        } catch {
          // Robust regex extraction fallback for malformed JSON with literal newlines
          const subjectMatch = jsonStr.match(/"subject"\s*:\s*"([\s\S]*?)"\s*(?:,|\})/i)
          const bodyMatch = jsonStr.match(/"body"\s*:\s*"([\s\S]*?)"\s*\}/i) || jsonStr.match(/"body"\s*:\s*"([\s\S]*?)"\s*$/i)

          subject = subjectMatch ? subjectMatch[1].trim() : `Payment Reminder - Invoice ${invoice.invoice_number}`
          body = bodyMatch ? bodyMatch[1].trim() : rawContent

          // Unescape newlines or quotes if they were escaped
          body = body.replace(/\\n/g, '\n').replace(/\\"/g, '"')
          subject = subject.replace(/\\"/g, '"')
        }
      } else {
        throw new Error('No JSON found')
      }
    } catch {
      // Fallback: use raw content as body, generate subject
      subject = `Payment Reminder - Invoice ${invoice.invoice_number}`
      body = rawContent
    }

    // Insert the draft
    const { data: draft, error: draftError } = await supabase
      .from('reminder_drafts')
      .insert({
        user_id: user.id,
        invoice_id: invoiceId,
        tone,
        subject,
        body,
        status: 'generated',
      })
      .select()
      .single()

    if (draftError) return { error: draftError.message }

    // Update invoice: increment reminder_count and set last_reminder_at
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        reminder_count: (invoice.reminder_count || 0) + 1,
        last_reminder_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to update invoice reminder count:', updateError.message)
    }

    // Log the event
    const { error: eventError } = await supabase
      .from('reminder_events')
      .insert({
        user_id: user.id,
        invoice_id: invoiceId,
        draft_id: draft.id,
        event_type: 'draft_generated',
        description: `Generated ${tone} reminder for Invoice ${invoice.invoice_number}`,
      })

    if (eventError) {
      console.error('Failed to log draft_generated event:', eventError.message)
    }

    revalidatePath('/invoices')
    revalidatePath(`/invoices/${invoiceId}`)
    revalidatePath('/dashboard')

    return {
      success: true,
      data: {
        id: draft.id,
        subject,
        body,
        tone,
      },
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'TimeoutError') {
      return { error: 'AI request timed out after 30 seconds. Please try again.' }
    }
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function generateMultipleDraftsAction(
  invoiceId: string,
  tone: 'friendly' | 'professional' | 'firm' | 'final_notice'
): Promise<MultipleReminderResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    // Fetch invoice with client
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, clients (client_name, email, company_name)')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (invoiceError || !invoice) return { error: 'Invoice not found.' }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Fetch AI settings
    const { data: aiSettings, error: settingsError } = await supabase
      .from('user_ai_settings')
      .select('base_url, api_key_encrypted, model_name')
      .eq('user_id', user.id)
      .single()

    if (settingsError || !aiSettings) {
      return { error: 'AI settings not configured. Please set your API key in Settings.' }
    }

    let apiKey: string
    try {
      apiKey = decryptKey(aiSettings.api_key_encrypted)
    } catch {
      return { error: 'Failed to decrypt API key. Please re-enter your API key in Settings.' }
    }

    // Calculate days overdue
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const due = new Date(invoice.due_date + 'T00:00:00')
    due.setHours(0, 0, 0, 0)
    const daysOverdue = Math.max(0, Math.round((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))

    const client = invoice.clients as { client_name: string; email: string | null; company_name: string | null } | null
    const senderName = profile?.full_name || 'the service provider'
    const clientName = client?.client_name || 'Client'
    const companyName = client?.company_name || ''
    const currency = invoice.currency || 'USD'

    const toneDescriptions: Record<string, string> = {
      friendly: 'Soft, warm, and polite. Assume the client simply forgot. Be understanding and gentle. Use casual professional language.',
      professional: 'Standard business-appropriate. Polite but clear about the outstanding payment. Neutral and courteous tone.',
      firm: 'Urgent and direct. Set clear expectations and a specific deadline. Professional but assertive. Convey seriousness.',
      final_notice: 'Extremely direct final warning. State this is the last notice before further action. Professional but unyielding. Create urgency.',
    }

    const styleVariations = [
      'Write in a direct, concise style. Keep it short.',
      'Write with a slightly warmer, more personal tone.',
      'Write a more detailed version with clear next steps.',
    ]

    const buildPrompt = (styleInstruction: string) => `You are an expert email writer specializing in payment follow-up reminders for freelancers.

Generate a payment reminder email with the following context:

SENDER:
- Name: ${senderName}

RECIPIENT:
- Client Name: ${clientName}
${companyName ? `- Company: ${companyName}` : ''}
${client?.email ? `- Email: ${client.email}` : ''}

INVOICE DETAILS:
- Invoice Number: ${invoice.invoice_number}
${invoice.title ? `- Title: ${invoice.title}` : ''}
- Amount: ${currency} ${Number(invoice.amount).toFixed(2)}
- Due Date: ${invoice.due_date}
- Days ${daysOverdue > 0 ? 'Overdue' : 'Until Due'}: ${daysOverdue > 0 ? daysOverdue : Math.abs(daysOverdue)}
${invoice.payment_link ? `- Payment Link: ${invoice.payment_link}` : ''}
${invoice.description ? `- Description: ${invoice.description}` : ''}

TONE: ${tone}
Tone Guidelines: ${toneDescriptions[tone]}

${invoice.reminder_count > 0 ? `This is reminder #${invoice.reminder_count + 1}. Previous reminders have already been sent.` : 'This is the first reminder for this invoice.'}

STYLE: ${styleInstruction}

IMPORTANT RULES:
- Write as if you are ${senderName} sending to ${clientName}.
- Keep the email concise (3-5 short paragraphs max).
- Include the invoice number and amount clearly.
${invoice.payment_link ? '- Include the payment link prominently.' : ''}
- Be human-sounding, not robotic.
- Do NOT include a subject line in the body text.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{"subject": "Your subject line here", "body": "The full email body here"}`

    const baseUrl = aiSettings.base_url.replace(/\/+$/, '')
    const endpoint = `${baseUrl}/chat/completions`

    const callLLM = async (styleInstruction: string) => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: aiSettings.model_name,
          messages: [
            { role: 'system', content: 'You are a professional email writer. Always respond with valid JSON only, no markdown formatting or code fences.' },
            { role: 'user', content: buildPrompt(styleInstruction) },
          ],
          temperature: 0.4,
          max_tokens: 1000,
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`AI provider error (HTTP ${response.status}): ${errorText.slice(0, 200) || response.statusText}`)
      }

      const data = await response.json()
      const rawContent = data.choices?.[0]?.message?.content?.trim() ?? ''

      let subject: string
      let body: string
      try {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          subject = parsed.subject || `Payment Reminder - Invoice ${invoice.invoice_number}`
          body = parsed.body || rawContent
        } else {
          throw new Error('No JSON found')
        }
      } catch {
        subject = `Payment Reminder - Invoice ${invoice.invoice_number}`
        body = rawContent
      }

      return { subject, body }
    }

    // Run 3 LLM calls in parallel, catching individual failures
    const results = await Promise.all(
      styleVariations.map(async (style, index) => {
        try {
          const { subject, body } = await callLLM(style)
          return { success: true as const, subject, body, variantIndex: index }
        } catch (e) {
          console.error(`Variant ${index} failed:`, e instanceof Error ? e.message : e)
          return { success: false as const, variantIndex: index }
        }
      })
    )

    const successful = results.filter((r): r is { success: true; subject: string; body: string; variantIndex: number } => r.success)

    if (successful.length === 0) {
      return { error: 'All generation attempts failed.' }
    }

    // Insert successful drafts into reminder_drafts
    const inserted: MultipleReminderResult['data'] = []

    for (const variant of successful) {
      const { data: draft, error: draftError } = await supabase
        .from('reminder_drafts')
        .insert({
          user_id: user.id,
          invoice_id: invoiceId,
          tone,
          subject: variant.subject,
          body: variant.body,
          status: 'generated',
        })
        .select()
        .single()

      if (draftError) {
        console.error(`Failed to insert variant ${variant.variantIndex}:`, draftError.message)
        continue
      }

      inserted.push({
        id: draft.id,
        subject: variant.subject,
        body: variant.body,
        tone,
        variantIndex: variant.variantIndex,
      })
    }

    if (inserted.length === 0) {
      return { error: 'All generation attempts failed.' }
    }

    return { success: true, data: inserted }
  } catch (e) {
    if (e instanceof Error && e.name === 'TimeoutError') {
      return { error: 'AI request timed out after 30 seconds. Please try again.' }
    }
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function logReminderEventAction(
  invoiceId: string,
  eventType: 'draft_copied' | 'marked_sent',
  draftId?: string,
  description?: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const { error } = await supabase
      .from('reminder_events')
      .insert({
        user_id: user.id,
        invoice_id: invoiceId,
        draft_id: draftId || null,
        event_type: eventType,
        description: description || (eventType === 'draft_copied' ? 'Copied draft to clipboard' : 'Reminder marked as sent'),
      })

    if (error) return { error: error.message }

    revalidatePath(`/invoices/${invoiceId}`)
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

interface ReminderHistoryEvent {
  id: string
  event_type: string
  description: string | null
  created_at: string
  tone: string | null
  draft_subject: string | null
}

interface ReminderHistoryResult {
  success?: boolean
  data?: ReminderHistoryEvent[]
  error?: string
}

export async function getReminderHistoryAction(
  invoiceId: string
): Promise<ReminderHistoryResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const { data: events, error: eventsError } = await supabase
      .from('reminder_events')
      .select('id, event_type, description, created_at, draft_id')
      .eq('user_id', user.id)
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (eventsError) return { error: eventsError.message }

    // Collect draft_ids to fetch their tone and subject
    const draftIds = events
      .map((e: { draft_id: string | null }) => e.draft_id)
      .filter((id: string | null): id is string => id !== null)

    let draftsMap: Record<string, { tone: string; subject: string }> = {}

    if (draftIds.length > 0) {
      const { data: drafts } = await supabase
        .from('reminder_drafts')
        .select('id, tone, subject')
        .in('id', draftIds)

      if (drafts) {
        draftsMap = Object.fromEntries(
          drafts.map((d: { id: string; tone: string; subject: string }) => [d.id, { tone: d.tone, subject: d.subject }])
        )
      }
    }

    const data: ReminderHistoryEvent[] = events.map(
      (e: { id: string; event_type: string; description: string | null; created_at: string; draft_id: string | null }) => ({
        id: e.id,
        event_type: e.event_type,
        description: e.description,
        created_at: e.created_at,
        tone: e.draft_id ? draftsMap[e.draft_id]?.tone ?? null : null,
        draft_subject: e.draft_id ? draftsMap[e.draft_id]?.subject ?? null : null,
      })
    )

    return { success: true, data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}
