'use server'

import { createClient } from '@/lib/db/server'
import { revalidatePath } from 'next/cache'
import { decryptKey } from '@/lib/crypto'
import { isSafeUrl, sanitizeDatabaseError } from '@/lib/utils/security'
import { enforceRateLimit, RateLimitError } from '@/lib/utils/rate-limit'
import { logError } from '@/lib/utils/error-handler'
import { ReminderHistoryEvent } from '@/types/reminder'
import { headers } from 'next/headers'
import { getValidAccessToken, sendGmailReminder } from '@/lib/notifications/gmail'
import { buildPaymentReminderPrompt, callAIApi, ReminderPromptContext } from '@/lib/ai/prompt-builders/reminder-prompt'

function sanitizeInput(input?: string): string {
  if (!input) return '';
  let clean = input.replace(/(.)\1{4,}/g, '$1$1');
  clean = clean.replace(/[^\w\s\u0900-\u097F.,!?@'":;()\-]/g, '');
  const words = clean.split(/\s+/);
  const isGibberish = words.some(word => word.length > 30 && !word.startsWith('http'));
  if (isGibberish) return '';
  return clean.trim();
}

function formatPlainTextToEmailHtml(text: string): string {
  if (text.includes('<') && text.includes('>')) {
    return text;
  }
  
  const paragraphs = text.split(/\r?\n\r?\n/);
  
  const formattedParagraphs = paragraphs.map(p => {
    let cleanParagraph = p.trim();
    if (!cleanParagraph) return '';
    
    // Replace URLs with clickable anchors
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    cleanParagraph = cleanParagraph.replace(urlPattern, (url) => {
      let cleanUrl = url;
      let suffix = '';
      const lastChar = url[url.length - 1];
      if (['.', ',', '!', '?'].includes(lastChar)) {
        cleanUrl = url.slice(0, -1);
        suffix = lastChar;
      }
      return `<a href="${cleanUrl}" target="_blank" style="color: #10b981; font-weight: 600; text-decoration: underline;">${cleanUrl}</a>${suffix}`;
    });

    const withLineBreaks = cleanParagraph.replace(/\r?\n/g, '<br />');
    return `<p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #334155;">${withLineBreaks}</p>`;
  });

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="margin-bottom: 24px;">
        ${formattedParagraphs.filter(Boolean).join('')}
      </div>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
      <p style="color: #94a3b8; font-size: 11px; margin: 0; text-align: center;">Sent via ChaseFree AI</p>
    </div>
  `;
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

    const headersList = await headers()
    const e2eSecret = process.env.E2E_BYPASS_SECRET
    const isE2EBypass = Boolean(e2eSecret) && headersList.get('x-e2e-secret') === e2eSecret

    if (isE2EBypass) {
      const subject = `Payment Reminder - Invoice ${invoice.invoice_number}`
      const body = `Hi ${clientName},\n\nWe are following up regarding the outstanding invoice ${invoice.invoice_number} for the amount of ${currency} ${Number(invoice.amount).toFixed(2)}, which was due on ${invoice.due_date}.\n\nPlease let us know if you need any assistance.\n\nBest regards,\n${senderName}`

      const { data: draft, error: draftError } = await supabase
        .from('reminder_drafts')
        .insert({
          user_id: user.id,
          invoice_id: invoiceId,
          tone,
          subject,
          body,
        })
        .select()
        .single()

      if (draftError) {
        return { error: `Database error creating E2E draft: ${draftError.message}` }
      }

      revalidatePath(`/invoices/${invoiceId}`)

      return {
        success: true,
        data: {
          id: draft.id,
          subject: draft.subject,
          body: draft.body,
          tone: draft.tone,
        },
      }
    }

    // Build business rules section from global_rules
    const globalRules = (profile?.global_rules ?? {}) as Record<string, string>
    const rulesLines: string[] = []
    if (globalRules.communication_style) rulesLines.push(`Communication Style: ${globalRules.communication_style}`)
    if (globalRules.late_payment_policy) rulesLines.push(`Late Payment Policy: ${globalRules.late_payment_policy}`)
    if (globalRules.refund_policy) rulesLines.push(`Refund Policy: ${globalRules.refund_policy}`)
    const rulesSection = rulesLines.length > 0
      ? `\nBUSINESS RULES (follow these when writing the email):\n${rulesLines.join('\n')}\n`
      : ''

    const sanitizedInstructions = sanitizeInput(customInstructions)

    const contextParams: ReminderPromptContext = {
      senderName,
      senderCompany,
      clientName,
      companyName,
      clientEmail: client?.email ?? null,
      invoiceNumber: invoice.invoice_number,
      invoiceTitle: invoice.title,
      amount: Number(invoice.amount),
      currency,
      dueDate: invoice.due_date,
      daysOverdue,
      paymentLink: invoice.payment_link,
      description: invoice.description,
      rulesSection,
      kbSection,
      reminderCount: invoice.reminder_count || 0,
      tone,
      customInstructions: sanitizedInstructions
    }

    let subject = `Payment Reminder - Invoice ${invoice.invoice_number}`
    let body = ''
    try {
      const messages = buildPaymentReminderPrompt(contextParams)
      const aiResult = await callAIApi(baseUrl, modelName, apiKey, messages)
      subject = aiResult.subject
      body = aiResult.body
    } catch (e) {
      logError('reminders/generateReminderAction', e, 'Failed to generate single AI reminder')
      if (e instanceof Error && (e as any).rawContent) {
        const rawContent = (e as any).rawContent
        if (rawContent.includes('{') || rawContent.includes('}')) {
          body = 'We are following up regarding the outstanding invoice. Please let us know if you need any assistance.'
        } else {
          body = rawContent || 'Please find the payment reminder details enclosed.'
        }
      } else {
        return { error: e instanceof Error ? e.message : 'AI generation failed.' }
      }
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
        logError('reminders/generateReminderAction', fallbackError, 'Failed to update invoice reminder count via fallback')
      }
    } else if (updateError) {
      logError('reminders/generateReminderAction', updateError, 'Failed to increment reminder count via RPC')
    }



    // Log the event
    let eventRes: { error: { message: string; code?: string } | null } = await supabase
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
      logError('reminders/generateReminderEvent', eventRes.error, 'Failed to log draft_generated event')
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
    logError('reminders/generateReminder', e)
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

    const styleVariations = [
      'Write in a direct, concise style. Keep it short.',
      'Write with a slightly warmer, more personal tone.',
      'Write a more detailed version with clear next steps.',
    ]

    const baseContext: ReminderPromptContext = {
      senderName,
      senderCompany,
      clientName,
      companyName,
      clientEmail: client?.email ?? null,
      invoiceNumber: invoice.invoice_number,
      invoiceTitle: invoice.title,
      amount: Number(invoice.amount),
      currency,
      dueDate: invoice.due_date,
      daysOverdue,
      paymentLink: invoice.payment_link,
      description: invoice.description,
      rulesSection: rulesSection2,
      kbSection: '',
      reminderCount: invoice.reminder_count || 0,
      tone
    }

    const callLLM = async (styleInstruction: string) => {
      const messages = buildPaymentReminderPrompt({ ...baseContext, styleInstruction })
      return await callAIApi(baseUrl, modelName, apiKey, messages)
    }

    // Run 3 LLM calls in parallel, catching individual failures
    const results = await Promise.all(
      styleVariations.map(async (style, index) => {
        try {
          const { subject, body } = await callLLM(style)
          return { success: true as const, subject, body, variantIndex: index }
        } catch (e) {
          logError('reminders/generateMultipleDrafts', e instanceof Error ? e : new Error(String(e)), `Variant ${index} failed`)
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
        logError('reminders/generateMultipleDrafts', draftError, `Failed to insert variant ${variant.variantIndex}`)
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
        logError('reminders/generateMultipleDrafts', fallbackError, 'Failed to update invoice reminder count via fallback')
      }
    } else if (updateError) {
      logError('reminders/generateMultipleDrafts', updateError, 'Failed to increment reminder count via RPC')
    }

    return { success: true, data: inserted }
  } catch (e) {
    if (e instanceof RateLimitError) {
      return { error: `Too many requests. Please try again in ${Math.ceil(e.retryAfterMs / 1000)} seconds.` }
    }
    if (e instanceof Error && e.name === 'TimeoutError') {
      return { error: 'AI request timed out after 30 seconds. Please try again.' }
    }
    logError('reminders/generateMultipleDrafts', e)
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
    logError('reminders/logReminderEvent', e)
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
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

    interface DbEvent {
      id: string
      event_type: string
      description: string | null
      created_at: string
      draft_id: string | null
      mail_subject?: string | null
      mail_body?: string | null
    }

    let queryResult: { data: DbEvent[] | null; error: { message: string; code?: string } | null } = await supabase
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
      .map((e: DbEvent) => e.draft_id)
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
      (e: DbEvent) => ({
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
    logError('reminders/getReminderHistory', e)
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function sendDirectGmailReminderAction(
  invoiceId: string,
  to: string,
  subject: string,
  bodyHtml: string,
  draftId?: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    // Fetch active Gmail connection for the user
    const { data: connection } = await supabase
      .from('email_connections')
      .select('email_address')
      .eq('user_id', user.id)
      .eq('provider', 'gmail')
      .single()

    if (!connection) {
      return { error: 'No active Gmail connection found. Please connect your Gmail account in Settings.' }
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(supabase, user.id)

    // Format plaintext body to professional HTML
    const formattedHtml = formatPlainTextToEmailHtml(bodyHtml)

    // Send the email via Gmail API
    const sendResult = await sendGmailReminder(accessToken, to, subject, formattedHtml)

    // Fetch invoice detail to get client_id
    const { data: invoice } = await supabase
      .from('invoices')
      .select('client_id, reminder_count')
      .eq('id', invoiceId)
      .single()

    // Log in email_messages
    const { error: msgError } = await supabase
      .from('email_messages')
      .insert({
        user_id: user.id,
        invoice_id: invoiceId,
        client_id: invoice?.client_id,
        gmail_message_id: sendResult.messageId,
        gmail_thread_id: sendResult.threadId,
        direction: 'outbound',
        subject,
        body_text: bodyHtml,
      })

    if (msgError) {
      logError('reminders/sendDirectGmailReminder', msgError, 'Failed to log message in email_messages')
    }

    // Log the reminder event
    await logReminderEventAction(
      invoiceId,
      'marked_sent',
      draftId,
      `Reminder email sent directly via Gmail connection to ${to}`
    )

    // Update reminder count atomically
    const { error: updateError } = await supabase.rpc('increment_reminder_count', {
      p_invoice_id: invoiceId,
      p_user_id: user.id,
    })

    if (updateError && updateError.code === '42883') {
      await supabase
        .from('invoices')
        .update({
          reminder_count: ((invoice?.reminder_count || 0) + 1),
          last_reminder_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
    }

    revalidatePath(`/invoices/${invoiceId}`)
    revalidatePath('/invoices')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (e) {
    logError('reminders/sendDirectGmailReminder', e)
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}
