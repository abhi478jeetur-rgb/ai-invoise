'use server'

import { createClient } from '@/lib/db/server'
import { revalidatePath } from 'next/cache'
import { decryptKey } from '@/lib/crypto'
import { isSafeUrl, sanitizeDatabaseError } from '@/lib/utils/security'
import { enforceRateLimit, RateLimitError } from '@/lib/utils/rate-limit'

function sanitizeInput(input?: string): string {
  if (!input) return '';
  let clean = input.replace(/(.)\1{4,}/g, '$1$1');
  clean = clean.replace(/[^\w\s\u0900-\u097F.,!?@'":;()\-]/g, '');
  const words = clean.split(/\s+/);
  const isGibberish = words.some(word => word.length > 30 && !word.startsWith('http'));
  if (isGibberish) return '';
  return clean.trim();
}

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

    await enforceRateLimit(user.id, { limit: 10, windowMs: 60_000 })

    // Fetch invoice with client
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, clients (client_name, email, company_name)')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (invoiceError || !invoice) return { error: 'Invoice not found.' }

    // Fetch user profile (includes global business rules for AI context)
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name, global_rules')
      .eq('id', user.id)
      .single()

    // Fetch AI Knowledge Base Documents
    const { data: kbDocs } = await supabase
      .from('user_knowledge_base')
      .select('extracted_text')
      .eq('user_id', user.id)

    const kbText = kbDocs?.map(d => d.extracted_text).join('\n\n---\n\n') || ''
    const kbSection = kbText 
      ? `\nUSER KNOWLEDGE BASE (Strictly adhere to these custom guidelines from the user's uploaded documents):\n${kbText}\n`
      : ''

    const baseUrl = process.env.AI_BASE_URL
    const modelName = process.env.AI_MODEL_NAME
    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY

    if (!baseUrl || !modelName || !apiKey) {
      return { error: 'AI configuration (AI_BASE_URL, AI_MODEL_NAME, AI_API_KEY) is missing in server environment variables.' }
    }

    // SSRF Defense-in-depth Check
    const safeUrl = await isSafeUrl(baseUrl)
    if (!safeUrl) {
      return { error: 'Unsafe AI Base URL detected in environment variables.' }
    }

    // Calculate days overdue
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const due = new Date(invoice.due_date + 'T00:00:00')
    due.setHours(0, 0, 0, 0)
    const daysOverdue = Math.max(0, Math.round((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))

    const client = invoice.clients as { client_name: string; email: string | null; company_name: string | null } | null
    const senderName = profile?.full_name || 'the service provider'
    const senderCompany = profile?.company_name || ''
    const clientName = client?.client_name || 'Client'
    const companyName = client?.company_name || ''
    const currency = invoice.currency || 'USD'

    // Build business rules section from global_rules
    const globalRules = (profile?.global_rules ?? {}) as Record<string, string>
    const rulesLines: string[] = []
    if (globalRules.communication_style) rulesLines.push(`Communication Style: ${globalRules.communication_style}`)
    if (globalRules.late_payment_policy) rulesLines.push(`Late Payment Policy: ${globalRules.late_payment_policy}`)
    if (globalRules.refund_policy) rulesLines.push(`Refund Policy: ${globalRules.refund_policy}`)
    const rulesSection = rulesLines.length > 0
      ? `\nBUSINESS RULES (follow these when writing the email):\n${rulesLines.join('\n')}\n`
      : ''

    const toneDescriptions: Record<string, string> = {
      friendly: 'Soft, warm, and polite. Assume the client simply forgot. Be understanding and gentle. Use casual professional language.',
      professional: 'Standard business-appropriate. Polite but clear about the outstanding payment. Neutral and courteous tone.',
      firm: 'Urgent and direct. Set clear expectations and a specific deadline. Professional but assertive. Convey seriousness.',
      final_notice: 'Extremely direct final warning. State this is the last notice before further action. Professional but unyielding. Create urgency.',
    }

    const sanitizedInstructions = sanitizeInput(customInstructions)

    const prompt = `You are an expert email writer specializing in payment follow-up reminders for freelancers.

Generate a payment reminder email with the following context:

SENDER:
- Name: ${senderName}
${senderCompany ? `- Company: ${senderCompany}` : ''}

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
${rulesSection}
TONE: ${tone}
Tone Guidelines: ${toneDescriptions[tone]}

${invoice.reminder_count > 0 ? `This is reminder #${invoice.reminder_count + 1}. Previous reminders have already been sent.` : 'This is the first reminder for this invoice.'}
${sanitizedInstructions ? `\nCUSTOM INSTRUCTIONS FROM SENDER:\n${sanitizedInstructions}` : ''}
${kbSection}

IMPORTANT RULES:
- Write as if you are ${senderName} sending to ${clientName}.
- Keep the email concise but professional (2-4 paragraphs).
- Include the invoice number and amount clearly.
${invoice.payment_link ? '- Include the payment link prominently.' : ''}
- Be human-sounding, not robotic.
- Do NOT include a subject line in the body text.

Respond ONLY using this exact format (no markdown code blocks):
SUBJECT: Your subject line here
BODY:
The full email body here (with normal paragraphs and line breaks)`

    // Call the LLM
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
              content: `You are ChaseFree AI, a highly empathetic yet highly effective professional communication expert specializing in writing payment follow-ups for business owners and freelancers. 
              
Your goal is to write natural, human-sounding emails that get invoices paid faster without ruining client relationships.

CRITICAL INSTRUCTIONS:
1. Speak 100% as the sender (business owner/freelancer) writing directly to the client. Never speak as an assistant.
2. Structure the email logically:
   - Appropriate salutation (e.g., "Hi [Client Name]", "Dear [Client Name]" depending on tone).
   - A clear opening explaining the status of the invoice.
   - Body showing invoice number, amount due, and due date clearly.
   - A direct, clean call-to-action (prominently referencing the payment link if provided).
   - Professional, warm sign-off (e.g., "Best regards,", "Thanks," followed by sender name).
3. Do not sound robotic, boilerplate, or over-formal unless the tone strictly demands it. Make the text sound fresh and tailored to the invoice details.
4. Output formatting: You MUST respond ONLY in the following plain text format. Do not use JSON or markdown code blocks.
SUBJECT: The email subject line
BODY:
The full email body including salutations, paragraphs, and sign-off.`
            },
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
    let subject: string = `Payment Reminder - Invoice ${invoice.invoice_number}`
    let body: string = ''

    try {
      const subjectMatch = rawContent.match(/SUBJECT:\s*([^\n]+)/i)
      const bodyMatch = rawContent.match(/BODY:\s*([\s\S]+)/i)

      if (subjectMatch) subject = subjectMatch[1].trim()
      
      if (bodyMatch) {
        body = bodyMatch[1].trim()
      } else {
        // Fallback if the model ignores the BODY tag
        body = rawContent.replace(/SUBJECT:\s*[^\n]+\n/i, '').trim()
      }

      if (!body) throw new Error('Missing body content')
    } catch (e) {
      console.error('Failed to parse AI response:', e)
      body = rawContent || 'Please find the payment reminder details enclosed.'
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

    if (draftError) return { error: sanitizeDatabaseError(draftError) }

    // H10: Update invoice using RPC for atomic increment to prevent race conditions
    // First try atomic increment via raw SQL expression
    const { error: updateError } = await supabase.rpc('increment_reminder_count', {
      p_invoice_id: invoiceId,
      p_user_id: user.id,
    })

    // Fallback: If the RPC doesn't exist, use regular update (still safe for single-user)
    if (updateError && updateError.code === '42883') {
      // Function doesn't exist, use regular update
      const { error: fallbackError } = await supabase
        .from('invoices')
        .update({
          reminder_count: (invoice.reminder_count || 0) + 1,
          last_reminder_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .eq('user_id', user.id)

      if (fallbackError) {
        console.error('Failed to update invoice reminder count:', fallbackError.message)
      }
    } else if (updateError) {
      console.error('Failed to increment reminder count:', updateError.message)
    }

    // Log the event
    let eventRes: any = await supabase
      .from('reminder_events')
      .insert({
        user_id: user.id,
        invoice_id: invoiceId,
        draft_id: draft.id,
        event_type: 'draft_generated',
        description: `Generated ${tone} reminder for Invoice ${invoice.invoice_number}`,
        mail_subject: subject,
        mail_body: body,
      })

    // Fallback if mail_subject or mail_body columns do not exist yet (undefined_column)
    if (eventRes.error && (eventRes.error.code === '42703' || eventRes.error.message?.includes('mail_subject'))) {
      eventRes = await supabase
        .from('reminder_events')
        .insert({
          user_id: user.id,
          invoice_id: invoiceId,
          draft_id: draft.id,
          event_type: 'draft_generated',
          description: `Generated ${tone} reminder for Invoice ${invoice.invoice_number}`,
        })
    }

    if (eventRes.error) {
      console.error('Failed to log draft_generated event:', eventRes.error.message)
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
    if (e instanceof RateLimitError) {
      return { error: `Too many requests. Please try again in ${Math.ceil(e.retryAfterMs / 1000)} seconds.` }
    }
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

    await enforceRateLimit(user.id, { limit: 5, windowMs: 60_000 })

    // Fetch invoice with client
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, clients (client_name, email, company_name)')
      .eq('id', invoiceId)
      .eq('user_id', user.id)
      .single()

    if (invoiceError || !invoice) return { error: 'Invoice not found.' }

    // Fetch user profile (includes global business rules for AI context)
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, company_name, global_rules')
      .eq('id', user.id)
      .single()

    const baseUrl = process.env.AI_BASE_URL
    const modelName = process.env.AI_MODEL_NAME
    const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY

    if (!baseUrl || !modelName || !apiKey) {
      return { error: 'AI configuration (AI_BASE_URL, AI_MODEL_NAME, AI_API_KEY) is missing in server environment variables.' }
    }

    // SSRF Defense-in-depth Check
    const safeUrl = await isSafeUrl(baseUrl)
    if (!safeUrl) {
      return { error: 'Unsafe AI Base URL detected in environment variables.' }
    }

    // Calculate days overdue
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const due = new Date(invoice.due_date + 'T00:00:00')
    due.setHours(0, 0, 0, 0)
    const daysOverdue = Math.max(0, Math.round((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))

    const client = invoice.clients as { client_name: string; email: string | null; company_name: string | null } | null
    const senderName = profile?.full_name || 'the service provider'
    const senderCompany = profile?.company_name || ''
    const clientName = client?.client_name || 'Client'
    const companyName = client?.company_name || ''
    const currency = invoice.currency || 'USD'

    const globalRules2 = (profile?.global_rules ?? {}) as Record<string, string>
    const rulesLines2: string[] = []
    if (globalRules2.communication_style) rulesLines2.push(`Communication Style: ${globalRules2.communication_style}`)
    if (globalRules2.late_payment_policy) rulesLines2.push(`Late Payment Policy: ${globalRules2.late_payment_policy}`)
    if (globalRules2.refund_policy) rulesLines2.push(`Refund Policy: ${globalRules2.refund_policy}`)
    const rulesSection2 = rulesLines2.length > 0
      ? `\nBUSINESS RULES:\n${rulesLines2.join('\n')}\n`
      : ''

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
${senderCompany ? `- Company: ${senderCompany}` : ''}

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
${rulesSection2}
TONE: ${tone}
Tone Guidelines: ${toneDescriptions[tone]}

${invoice.reminder_count > 0 ? `This is reminder #${invoice.reminder_count + 1}. Previous reminders have already been sent.` : 'This is the first reminder for this invoice.'}

STYLE: ${styleInstruction}

IMPORTANT RULES:
- Write as if you are ${senderName} sending to ${clientName}.
- Keep the email concise but professional (2-4 paragraphs).
- Include the invoice number and amount clearly.
${invoice.payment_link ? '- Include the payment link prominently.' : ''}
- Be human-sounding, not robotic.
- Do NOT include a subject line in the body text.

Respond ONLY using this exact format (no markdown code blocks):
SUBJECT: Your subject line here
BODY:
The full email body here (with normal paragraphs and line breaks)`

    const normalizedUrl = baseUrl.replace(/\/+$/, '')
    const endpoint = `${normalizedUrl}/chat/completions`

    const callLLM = async (styleInstruction: string) => {
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
              content: `You are ChaseFree AI, a highly empathetic yet highly effective professional communication expert specializing in writing payment follow-ups for business owners and freelancers. 
              
Your goal is to write natural, human-sounding emails that get invoices paid faster without ruining client relationships.

CRITICAL INSTRUCTIONS:
1. Speak 100% as the sender (business owner/freelancer) writing directly to the client. Never speak as an assistant.
2. Structure the email logically:
   - Appropriate salutation (e.g., "Hi [Client Name]", "Dear [Client Name]" depending on tone).
   - A clear opening explaining the status of the invoice.
   - Body showing invoice number, amount due, and due date clearly.
   - A direct, clean call-to-action (prominently referencing the payment link if provided).
   - Professional, warm sign-off (e.g., "Best regards,", "Thanks," followed by sender name).
3. Do not sound robotic, boilerplate, or over-formal unless the tone strictly demands it. Make the text sound fresh and tailored to the invoice details.
4. Output formatting: You MUST respond ONLY in the following plain text format. Do not use JSON or markdown code blocks.
SUBJECT: The email subject line
BODY:
The full email body including salutations, paragraphs, and sign-off.`
            },
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

      let subject: string = `Payment Reminder - Invoice ${invoice.invoice_number}`
      let body: string = ''
      try {
        const subjectMatch = rawContent.match(/SUBJECT:\s*([^\n]+)/i)
        const bodyMatch = rawContent.match(/BODY:\s*([\s\S]+)/i)

        if (subjectMatch) subject = subjectMatch[1].trim()
        
        if (bodyMatch) {
          body = bodyMatch[1].trim()
        } else {
          // Fallback if the model ignores the BODY tag
          body = rawContent.replace(/SUBJECT:\s*[^\n]+\n/i, '').trim()
        }

        if (!body) throw new Error('Missing body content')
      } catch (e) {
        console.error('Failed to parse AI response:', e)
        body = rawContent || 'Please find the payment reminder details enclosed.'
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

    // M10: Log draft_generated events for each inserted draft (audit trail)
    for (const draft of inserted) {
      let eventRes: any = await supabase
        .from('reminder_events')
        .insert({
          user_id: user.id,
          invoice_id: invoiceId,
          draft_id: draft.id,
          event_type: 'draft_generated',
          description: `Generated ${tone} reminder for Invoice ${invoice.invoice_number}`,
          mail_subject: draft.subject,
          mail_body: draft.body,
        })

      // Fallback if mail_subject or mail_body columns do not exist yet
      if (eventRes.error && (eventRes.error.code === '42703' || eventRes.error.message?.includes('mail_subject'))) {
        eventRes = await supabase
          .from('reminder_events')
          .insert({
            user_id: user.id,
            invoice_id: invoiceId,
            draft_id: draft.id,
            event_type: 'draft_generated',
            description: `Generated ${tone} reminder for Invoice ${invoice.invoice_number}`,
          })
      }

      if (eventRes.error) {
        console.error('Failed to log draft_generated event:', eventRes.error.message)
      }
    }

    // H9: Update invoice reminder_count and last_reminder_at after successful draft generation
    const { error: updateError } = await supabase.rpc('increment_reminder_count', {
      p_invoice_id: invoiceId,
      p_user_id: user.id,
    })

    // Fallback: If the RPC doesn't exist, use regular update
    if (updateError && updateError.code === '42883') {
      const { error: fallbackError } = await supabase
        .from('invoices')
        .update({
          reminder_count: (invoice.reminder_count || 0) + 1,
          last_reminder_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .eq('user_id', user.id)

      if (fallbackError) {
        console.error('Failed to update invoice reminder count:', fallbackError.message)
      }
    } else if (updateError) {
      console.error('Failed to increment reminder count:', updateError.message)
    }

    // M9: Revalidate paths so UI reflects updated reminder counts
    revalidatePath('/dashboard')
    revalidatePath('/invoices')
    revalidatePath(`/invoices/${invoiceId}`)

    return { success: true, data: inserted }
  } catch (e) {
    if (e instanceof RateLimitError) {
      return { error: `Too many requests. Please try again in ${Math.ceil(e.retryAfterMs / 1000)} seconds.` }
    }
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

    if (error) return { error: sanitizeDatabaseError(error) }

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
  mail_subject?: string | null
  mail_body?: string | null
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

    let queryResult: any = await supabase
      .from('reminder_events')
      .select('id, event_type, description, created_at, draft_id, mail_subject, mail_body')
      .eq('user_id', user.id)
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false })
      .limit(20)

    // Fallback if mail_subject or mail_body columns do not exist yet (undefined_column)
    if (queryResult.error && (queryResult.error.code === '42703' || queryResult.error.message?.includes('mail_subject'))) {
      queryResult = await supabase
        .from('reminder_events')
        .select('id, event_type, description, created_at, draft_id')
        .eq('user_id', user.id)
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false })
        .limit(20)
    }

    if (queryResult.error) return { error: sanitizeDatabaseError(queryResult.error) }

    const events = queryResult.data ?? []

    // Collect draft_ids to fetch their tone and subject
    const draftIds = events
      .map((e: any) => e.draft_id)
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
      (e: any) => ({
        id: e.id,
        event_type: e.event_type,
        description: e.description,
        created_at: e.created_at,
        tone: e.draft_id ? draftsMap[e.draft_id]?.tone ?? null : null,
        draft_subject: e.draft_id ? draftsMap[e.draft_id]?.subject ?? null : null,
        mail_subject: e.mail_subject ?? null,
        mail_body: e.mail_body ?? null,
      })
    )

    return { success: true, data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}
