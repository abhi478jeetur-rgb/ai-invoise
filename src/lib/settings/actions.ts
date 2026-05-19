'use server'

import { createClient } from '@/lib/db/server'
import { revalidatePath } from 'next/cache'
import { encryptKey, decryptKey, maskApiKey } from '@/lib/crypto'

export async function getSettingsAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    // Fetch profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email, default_currency')
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
          .select('full_name, email, default_currency')
          .single()

        if (!insertError && newProfile) {
          profile = newProfile
          profileError = null
        } else {
          return { error: insertError?.message || 'Failed to auto-create missing user profile.' }
        }
      } else {
        return { error: profileError.message }
      }
    }

    // Fetch AI settings
    const { data: aiSettings } = await supabase
      .from('user_ai_settings')
      .select('base_url, api_key_encrypted, provider_label, model_name, temperature')
      .eq('user_id', user.id)
      .single()

    let maskedApiKey = ''
    if (aiSettings?.api_key_encrypted) {
      try {
        const decrypted = decryptKey(aiSettings.api_key_encrypted)
        maskedApiKey = maskApiKey(decrypted)
      } catch {
        maskedApiKey = ''
      }
    }

    return {
      success: true,
      data: {
        profile: {
          full_name: profile?.full_name ?? '',
          email: profile?.email ?? user.email ?? '',
          default_currency: profile?.default_currency ?? 'USD',
        },
        aiSettings: aiSettings
          ? {
              base_url: aiSettings.base_url ?? '',
              provider_label: aiSettings.provider_label ?? '',
              model_name: aiSettings.model_name ?? '',
              temperature: Number(aiSettings.temperature) ?? 0.4,
              masked_api_key: maskedApiKey,
            }
          : null,
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

    if (error) return { error: error.message }

    revalidatePath('/settings')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function saveAiSettingsAction(formData: FormData) {
  try {
    const baseUrl = formData.get('baseUrl') as string
    const modelName = formData.get('modelName') as string
    const providerLabel = formData.get('providerLabel') as string
    const apiKey = formData.get('apiKey') as string
    const maskedKey = formData.get('maskedApiKey') as string

    if (!baseUrl || baseUrl.trim().length === 0) return { error: 'Base URL is required.' }
    if (!modelName || modelName.trim().length === 0) return { error: 'Model name is required.' }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    // Determine the API key to store
    let encryptedKey: string

    if (!apiKey || apiKey.trim().length === 0 || apiKey === maskedKey) {
      // No new key provided or key is the masked placeholder -- preserve existing
      const { data: existing } = await supabase
        .from('user_ai_settings')
        .select('api_key_encrypted')
        .eq('user_id', user.id)
        .single()

      if (!existing?.api_key_encrypted) {
        return { error: 'API key is required.' }
      }
      encryptedKey = existing.api_key_encrypted
    } else {
      // New key provided -- encrypt it
      encryptedKey = encryptKey(apiKey.trim())
    }

    // Upsert AI settings
    const { error } = await supabase
      .from('user_ai_settings')
      .upsert({
        user_id: user.id,
        base_url: baseUrl.trim(),
        model_name: modelName.trim(),
        provider_label: providerLabel?.trim() || null,
        api_key_encrypted: encryptedKey,
      }, {
        onConflict: 'user_id',
      })

    if (error) return { error: error.message }

    revalidatePath('/settings')
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}

export async function testAiConnectionAction(formData: FormData) {
  try {
    const baseUrl = formData.get('baseUrl') as string
    const modelName = formData.get('modelName') as string
    const apiKey = formData.get('apiKey') as string
    const maskedKey = formData.get('maskedApiKey') as string

    if (!baseUrl) return { error: 'Base URL is required.' }
    if (!modelName) return { error: 'Model name is required.' }

    let resolvedApiKey = apiKey

    // If the key is the masked placeholder, decrypt the saved one
    if (!apiKey || apiKey.trim().length === 0 || apiKey === maskedKey) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { error: 'You must be authenticated.' }

      const { data: settings } = await supabase
        .from('user_ai_settings')
        .select('api_key_encrypted')
        .eq('user_id', user.id)
        .single()

      if (!settings?.api_key_encrypted) {
        return { error: 'No saved API key found. Please enter your API key.' }
      }

      resolvedApiKey = decryptKey(settings.api_key_encrypted)
    }

    // Normalize the base URL
    const normalizedUrl = baseUrl.trim().replace(/\/+$/, '')

    // Try chat completions endpoint first
    const endpoint = `${normalizedUrl}/chat/completions`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resolvedApiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'user', content: 'Respond only with the word OK.' },
        ],
        max_tokens: 10,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      return {
        error: `Connection failed (HTTP ${response.status}): ${errorText.slice(0, 200) || response.statusText}`,
      }
    }

    const data = await response.json()

    if (data.choices?.[0]?.message?.content) {
      return { success: true, message: 'Connection successful!' }
    }

    return { success: true, message: 'Connection successful! (Unexpected response format, but endpoint is reachable)' }
  } catch (e) {
    if (e instanceof Error && e.name === 'TimeoutError') {
      return { error: 'Connection timed out after 15 seconds. Check your base URL and network.' }
    }
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}
