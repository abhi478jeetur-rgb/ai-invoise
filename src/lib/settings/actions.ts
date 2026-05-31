'use server'

import { createClient } from '@/lib/db/server'
import { revalidatePath } from 'next/cache'
import { encryptKey, decryptKey, maskApiKey } from '@/lib/crypto'
import { isSafeUrl, sanitizeDatabaseError } from '@/lib/utils/security'
import { enforceRateLimit, RateLimitError } from '@/lib/utils/rate-limit'

export async function getSettingsAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    // Fetch profile (includes all business fields)
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        full_name, email, default_currency,
        reminder_enabled, reminder_day, reminder_time,
        company_name, company_address, company_website,
        tax_id, logo_url, bank_details, payment_link_default,
        global_rules, default_tax_label, default_tax_rate, default_payment_terms
      `)
      .eq('id', user.id)
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // Auto-create a profile row for self-healing!
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email ?? '',
            full_name: user.user_metadata?.full_name || '',
            default_currency: 'USD'
          })
          .select(`
            full_name, email, default_currency,
            reminder_enabled, reminder_day, reminder_time,
            company_name, company_address, company_website,
            tax_id, logo_url, bank_details, payment_link_default,
            global_rules, default_tax_label, default_tax_rate, default_payment_terms
          `)
          .single()

        if (!insertError && newProfile) {
          profile = newProfile
          profileError = null
        } else {
          return { error: sanitizeDatabaseError(insertError, 'Failed to auto-create missing user profile.') }
        }
      } else {
        return { error: sanitizeDatabaseError(profileError) }
      }
    }

    // Fetch AI settings
    const { data: aiSettings } = await supabase
      .from('user_ai_settings')
      .select('base_url, provider_label, model_name, temperature')
      .eq('user_id', user.id)
      .single()

    // Fetch knowledge base documents
    const { data: kbDocs } = await supabase
      .from('user_knowledge_base')
      .select('id, file_name, file_size, file_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return {
      success: true,
      data: {
        profile: {
          full_name: profile?.full_name ?? '',
          email: profile?.email ?? user.email ?? '',
          default_currency: profile?.default_currency ?? 'USD',
          reminder_enabled: profile?.reminder_enabled ?? false,
          reminder_day: profile?.reminder_day ?? 'Monday',
          reminder_time: profile?.reminder_time ?? 'Morning',
          // Business Profile fields
          company_name: profile?.company_name ?? '',
          company_address: profile?.company_address ?? '',
          company_website: profile?.company_website ?? '',
          tax_id: profile?.tax_id ?? '',
          logo_url: profile?.logo_url ?? '',
          bank_details: profile?.bank_details ?? '',
          payment_link_default: profile?.payment_link_default ?? '',
          global_rules: profile?.global_rules ?? {},
          default_tax_label: profile?.default_tax_label ?? '',
          default_tax_rate: profile?.default_tax_rate ?? null,
          default_payment_terms: profile?.default_payment_terms ?? 'net_30',
        },
        aiSettings: aiSettings
          ? {
              base_url: aiSettings.base_url ?? '',
              provider_label: aiSettings.provider_label ?? '',
              model_name: aiSettings.model_name ?? '',
              temperature: aiSettings.temperature != null ? Number(aiSettings.temperature) : 0.4,
            }
          : null,
        knowledgeBaseDocuments: kbDocs || [],
      },
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}


export async function saveProfileSettingsAction(formData: FormData) {
  try {
    const fullName = formData.get('fullName') as string
    const defaultCurrency = formData.get('defaultCurrency') as string

    if (!fullName || fullName.trim().length === 0) {
      return { error: 'Full name is required.' }
    }
    if (fullName.trim().length > 100) {
      return { error: 'Full name must be 100 characters or less.' }
    }
    if (defaultCurrency && defaultCurrency.trim().length > 10) {
      return { error: 'Currency must be 10 characters or less.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        default_currency: defaultCurrency || 'USD',
      })
      .eq('id', user.id)

    if (error) return { error: sanitizeDatabaseError(error) }

    revalidatePath('/settings')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

// C9: Allowed currency codes - must match DB CHECK constraint exactly
// supabase-migration-v8-security-audit.sql: CHECK (currency IN ('USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY'))
const ALLOWED_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY']
const ALLOWED_PAYMENT_TERMS = ['receipt','net_15','net_30','net_60','net_90','custom']

export async function saveBusinessProfileAction(formData: FormData) {
  try {
    const companyName    = formData.get('companyName') as string
    const companyAddress = formData.get('companyAddress') as string
    const companyWebsite = formData.get('companyWebsite') as string
    const taxId          = formData.get('taxId') as string
    const bankDetails    = formData.get('bankDetails') as string
    const paymentLinkDefault = formData.get('paymentLinkDefault') as string
    const defaultTaxLabel = formData.get('defaultTaxLabel') as string
    const defaultTaxRateRaw = formData.get('defaultTaxRate') as string
    const defaultPaymentTerms = formData.get('defaultPaymentTerms') as string
    const defaultCurrency = formData.get('defaultCurrency') as string
    const invoicePrefix   = formData.get('invoicePrefix') as string
    const invoiceFormat   = formData.get('invoiceFormat') as string

    // Late Payment Policy and T&C rules
    const latePolicyText = formData.get('rule_late_payment') as string
    const tncText        = formData.get('rule_tnc') as string
    const commStyle      = formData.get('rule_comm_style') as string
    const refundPolicy   = formData.get('rule_refund') as string

    // --- Validation ---
    if (companyName && companyName.trim().length > 150)
      return { error: 'Company name must be 150 characters or less.' }
    if (companyAddress && companyAddress.trim().length > 500)
      return { error: 'Company address must be 500 characters or less.' }
    if (bankDetails && bankDetails.trim().length > 2000)
      return { error: 'Bank details must be 2000 characters or less.' }
    if (taxId && taxId.trim().length > 50)
      return { error: 'Tax ID must be 50 characters or less.' }
    if (invoicePrefix && invoicePrefix.trim().length > 20)
      return { error: 'Invoice prefix must be 20 characters or less.' }
    if (invoiceFormat && invoiceFormat !== 'PREFIX-[SEQUENCE]' && invoiceFormat !== 'PREFIX-[YEAR]-[SEQUENCE]')
      return { error: 'Invalid invoice format selection.' }
    if (companyWebsite && companyWebsite.trim().length > 0) {
      if (!/^https?:\/\//i.test(companyWebsite.trim()))
        return { error: 'Company website must start with http:// or https://' }
      if (companyWebsite.trim().length > 200)
        return { error: 'Website URL must be 200 characters or less.' }
    }
    if (paymentLinkDefault && paymentLinkDefault.trim().length > 0) {
      if (!/^https?:\/\//i.test(paymentLinkDefault.trim()))
        return { error: 'Payment link must start with http:// or https://' }
    }
    if (defaultCurrency && !ALLOWED_CURRENCIES.includes(defaultCurrency))
      return { error: 'Invalid currency selection.' }
    if (defaultPaymentTerms && !ALLOWED_PAYMENT_TERMS.includes(defaultPaymentTerms))
      return { error: 'Invalid payment terms selection.' }
    
    const defaultTaxRate = defaultTaxRateRaw ? parseFloat(defaultTaxRateRaw) : null
    if (defaultTaxRate !== null && (isNaN(defaultTaxRate) || defaultTaxRate < 0 || defaultTaxRate > 100))
      return { error: 'Tax rate must be between 0 and 100.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    // Build global_rules JSON from form fields
    const global_rules: Record<string, string> = {}
    if (latePolicyText?.trim()) global_rules.late_payment_policy = latePolicyText.trim().slice(0, 500)
    if (tncText?.trim())        global_rules.terms_and_conditions  = tncText.trim().slice(0, 2000)
    if (commStyle?.trim())      global_rules.communication_style   = commStyle.trim().slice(0, 500)
    if (refundPolicy?.trim())   global_rules.refund_policy         = refundPolicy.trim().slice(0, 500)
    
    // Add custom invoice prefix and formatting pattern
    global_rules.invoice_prefix = invoicePrefix?.trim() || 'INV-'
    global_rules.invoice_format = invoiceFormat?.trim() || 'PREFIX-[SEQUENCE]'

    const updates: Record<string, unknown> = {
      company_name:          companyName?.trim() || null,
      company_address:       companyAddress?.trim() || null,
      company_website:       companyWebsite?.trim() || null,
      tax_id:                taxId?.trim() || null,
      bank_details:          bankDetails?.trim() || null,
      payment_link_default:  paymentLinkDefault?.trim() || null,
      default_tax_label:     defaultTaxLabel?.trim() || null,
      default_tax_rate:      defaultTaxRate,
      global_rules,
    }

    if (defaultCurrency)     updates.default_currency      = defaultCurrency
    if (defaultPaymentTerms) updates.default_payment_terms = defaultPaymentTerms

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) return { error: sanitizeDatabaseError(error) }

    revalidatePath('/settings')
    revalidatePath('/invoices')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

// H7: Save AI Settings Action - persists AI provider configuration to user_ai_settings table
const SETTINGS_RATE_LIMIT = { limit: 10, windowMs: 60 * 1000 } // 10 per minute

export async function saveAISettingsAction(formData: FormData) {
  try {
    // M12: Actually enforce rate limit so the catch block works
    await enforceRateLimit('save_ai_settings', SETTINGS_RATE_LIMIT)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const baseUrl = (formData.get('aiBaseUrl') as string) || ''
    const providerLabel = (formData.get('aiProviderLabel') as string) || ''
    const modelName = (formData.get('aiModelName') as string) || ''
    const temperatureRaw = formData.get('aiTemperature') as string
    const apiKey = (formData.get('aiApiKey') as string) || ''

    // Validate inputs
    if (modelName.trim().length > 200) {
      return { error: 'Model name must be 200 characters or less.' }
    }
    if (providerLabel.trim().length > 100) {
      return { error: 'Provider label must be 100 characters or less.' }
    }
    if (baseUrl && !(await isSafeUrl(baseUrl))) {
      return { error: 'Invalid base URL.' }
    }

    // Parse temperature with proper null handling
    let temperature: number | null = null
    if (temperatureRaw && temperatureRaw.trim() !== '') {
      const parsed = parseFloat(temperatureRaw)
      if (isNaN(parsed) || parsed < 0 || parsed > 2) {
        return { error: 'Temperature must be between 0.0 and 2.0.' }
      }
      temperature = parsed
    }

    // Encrypt API key if provided
    let encryptedKey: string | null = null
    if (apiKey.trim()) {
      try {
        encryptedKey = encryptKey(apiKey.trim())
      } catch (encryptError) {
        console.error('[AI SETTINGS] Encryption error:', encryptError)
        return { error: 'Failed to securely store API key. Please check server configuration.' }
      }
    }

    // Upsert into user_ai_settings
    const upsertData: Record<string, unknown> = {
      user_id: user.id,
      base_url: baseUrl.trim() || null,
      provider_label: providerLabel.trim() || null,
      model_name: modelName.trim() || null,
      temperature: temperature,
    }

    // Only update encrypted_key if a new key was provided
    if (encryptedKey) {
      upsertData.encrypted_key = encryptedKey
    }

    const { error: upsertError } = await supabase
      .from('user_ai_settings')
      .upsert(upsertData, { onConflict: 'user_id' })

    if (upsertError) {
      return { error: sanitizeDatabaseError(upsertError) }
    }

    revalidatePath('/settings')
    return { success: true, message: 'AI settings saved successfully.' }
  } catch (e) {
    if (e instanceof RateLimitError) {
      return { error: `Too many requests. Please try again in ${Math.ceil(e.retryAfterMs / 1000)} seconds.` }
    }
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function uploadBusinessLogoAction(formData: FormData) {
  try {
    const file = formData.get('logo') as File | null
    if (!file || file.size === 0) return { error: 'No file provided.' }

    // Security: only allow image types
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: 'Only JPG, PNG, and WebP images are allowed.' }
    }
    // 2MB limit
    if (file.size > 2 * 1024 * 1024) {
      return { error: 'Logo must be smaller than 2MB.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const ext = file.type === 'image/webp' ? 'webp'
      : file.type === 'image/png' ? 'png' : 'jpg'

    // Store under user's own folder: {user_id}/logo.{ext}
    const filePath = `${user.id}/logo.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('business-logos')
      .upload(filePath, file, { upsert: true, contentType: file.type })

    if (uploadError) return { error: 'Failed to upload logo. Please try again.' }

    const { data: { publicUrl } } = supabase.storage
      .from('business-logos')
      .getPublicUrl(filePath)

    // Save URL to profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ logo_url: publicUrl })
      .eq('id', user.id)

    if (updateError) return { error: sanitizeDatabaseError(updateError) }

    revalidatePath('/settings')
    return { success: true, url: publicUrl }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}



// ==============================================================================
// AI Knowledge Base Actions
// ==============================================================================

export async function getKnowledgeBaseDocumentsAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    const { data, error } = await supabase
      .from('user_knowledge_base')
      .select('id, file_name, file_size, file_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return { error: sanitizeDatabaseError(error) }

    return { success: true, data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function uploadKnowledgeBaseDocumentAction(formData: FormData) {
  try {
    const file = formData.get('document') as File | null
    if (!file || file.size === 0) return { error: 'No file provided.' }

    // Security: Validate file type & size (max 5MB)
    const ALLOWED_TYPES = ['application/pdf', 'text/plain']
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: 'Only PDF and TXT files are allowed.' }
    }
    if (file.size > 5 * 1024 * 1024) {
      return { error: 'Document must be smaller than 5MB.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    // 1. Extract text from file
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    let extractedText = ''

    if (file.type === 'application/pdf') {
      try {
        const pdfParseModule: any = await import('pdf-parse');
        const pdfParse = pdfParseModule.default || pdfParseModule;
        const parsed = await (pdfParse as any)(buffer)
        extractedText = parsed.text
      } catch (parseError) {
        return { error: 'Failed to extract text from PDF. The file may be encrypted, scanned without OCR, or corrupted.' }
      }
    } else if (file.type === 'text/plain') {
      extractedText = buffer.toString('utf-8')
    }

    // Limit extracted text to roughly 5000 words to prevent blowing up the LLM context (approx 30,000 chars)
    if (extractedText.length > 30000) {
      extractedText = extractedText.substring(0, 30000) + '\n\n[...TEXT TRUNCATED DUE TO LENGTH LIMIT...]'
    }

    // 2. Upload original file to Storage for backup/reference
    const fileExt = file.type === 'application/pdf' ? 'pdf' : 'txt'
    const rawName = file.name || `document.${fileExt}`
    // L14: Sanitize filename to prevent path traversal
    const fileName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100)
    const storagePath = `${user.id}/${Date.now()}-${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('ai-knowledge-base')
      .upload(storagePath, file, { contentType: file.type })

    if (uploadError) return { error: 'Failed to upload document to storage.' }

    // 3. Save to database
    const { error: dbError } = await supabase
      .from('user_knowledge_base')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_size: file.size,
        file_type: file.type,
        storage_path: storagePath,
        extracted_text: extractedText.trim()
      })

    if (dbError) {
      // Rollback storage upload if DB fails
      await supabase.storage.from('ai-knowledge-base').remove([storagePath])
      return { error: sanitizeDatabaseError(dbError) }
    }

    revalidatePath('/settings')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function deleteKnowledgeBaseDocumentAction(documentId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    // Get the storage path first
    const { data: doc, error: fetchError } = await supabase
      .from('user_knowledge_base')
      .select('storage_path')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !doc) return { error: 'Document not found.' }

    // Delete from DB
    const { error: deleteError } = await supabase
      .from('user_knowledge_base')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id)

    if (deleteError) return { error: sanitizeDatabaseError(deleteError) }

    // Delete from Storage
    await supabase.storage.from('ai-knowledge-base').remove([doc.storage_path])

    revalidatePath('/settings')
    return { success: true }
  } catch (e) {
    return { error: sanitizeDatabaseError(e) }
  }
}


export async function deleteAccountAction(confirmationText: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    // Hardcoded security check
    if (confirmationText !== 'delete my account') {
      return { error: 'Confirmation text does not match exactly.' }
    }

    // Call the RPC function to delete the user account
    const { error } = await supabase.rpc('delete_user_account')

    if (error) {
      return { error: sanitizeDatabaseError(error, 'Failed to delete account.') }
    }

    // Sign out to clear the session locally
    await supabase.auth.signOut()

    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}
