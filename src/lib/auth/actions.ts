'use server'

import { createClient } from '@/lib/db/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { signUpSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations/auth'
import { enforceRateLimit, RateLimitError } from '@/lib/utils/rate-limit'

// ── Rate limit configs (keyed by IP since user isn't authenticated) ──
const AUTH_RATE_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 }  // 5 per 15 min
const OTP_RATE_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 }   // 5 per 15 min
const SIGNUP_RATE_LIMIT = { limit: 3, windowMs: 15 * 60 * 1000 } // 3 per 15 min
const RESET_RATE_LIMIT = { limit: 3, windowMs: 15 * 60 * 1000 }  // 3 per 15 min
const OAUTH_RATE_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 } // 10 per 15 min

/** Wraps RateLimitError into a safe user-facing error object */
function handleRateLimitError(e: unknown): { error: string } | null {
  if (e instanceof RateLimitError) {
    const seconds = Math.ceil(e.retryAfterMs / 1000)
    return { error: `Too many attempts. Please try again in ${seconds} seconds.` }
  }
  return null
}

/** Verifies the Cloudflare Turnstile token */
export async function verifyTurnstileToken(token: string | null) {
  // Bypass Turnstile for automated E2E tests in CI or local Playwright tests
  if (process.env.CI === 'true' || process.env.NEXT_PUBLIC_IS_E2E === 'true') {
    return { success: true }
  }

  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    console.warn('TURNSTILE_SECRET_KEY is not set. Skipping verification for development.')
    return { success: true }
  }

  if (!token) {
    return { success: false, error: 'Please complete the security check.' }
  }

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    const data = await res.json()
    if (!data.success) {
      console.error('Turnstile verification failed:', data)
      return { success: false, error: 'Security check failed. Please try again.' }
    }
    return { success: true }
  } catch (err) {
    console.error('Turnstile request error:', err)
    return { success: false, error: 'Failed to verify security check.' }
  }
}

export async function login(formData: FormData) {
  // C4: Rate limit login attempts by IP
  try {
    await enforceRateLimit(null, AUTH_RATE_LIMIT)
  } catch (e) {
    const rateLimitErr = handleRateLimitError(e)
    if (rateLimitErr) return rateLimitErr
  }

  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const turnstileToken = formData.get('cf-turnstile-response') as string | null

  const turnstileCheck = await verifyTurnstileToken(turnstileToken)
  if (!turnstileCheck.success) {
    return { error: turnstileCheck.error || 'Security check failed.' }
  }

  // Validate using Zod
  const validation = loginSchema.safeParse({ email, password })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Don't leak whether the email exists
    return { error: 'Invalid email or password.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  // C4: Rate limit signup attempts by IP
  try {
    await enforceRateLimit(null, SIGNUP_RATE_LIMIT)
  } catch (e) {
    const rateLimitErr = handleRateLimitError(e)
    if (rateLimitErr) return rateLimitErr
  }

  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const turnstileToken = formData.get('cf-turnstile-response') as string | null

  const turnstileCheck = await verifyTurnstileToken(turnstileToken)
  if (!turnstileCheck.success) {
    return { error: turnstileCheck.error || 'Security check failed.' }
  }

  // Validate using Zod
  const validation = signUpSchema.safeParse({ email, password, fullName })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  // Check if user already exists (use generic message to prevent email enumeration)
  const { data: emailExists, error: checkError } = await supabase.rpc('check_email_exists', { email_to_check: email })
  if (checkError) {
    console.error('Email check failed:', checkError)
    // Proceed with signup — Supabase will handle duplicate email on insert
  }
  if (emailExists) {
    return { success: true, email, message: 'A 6-digit verification code has been sent to your email.' }
  }

  // Supabase sign up sends OTP automatically if configured in templates
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    console.error('[SIGNUP ERROR]', error)
    return { error: 'Unable to create account. Please try again.' }
  }

  return { success: true, email, message: 'A 6-digit verification code has been sent to your email.' }
}

/** C6: Allowed OTP types for this application. Reject any other value. */
const ALLOWED_OTP_TYPES = ['signup', 'recovery'] as const
type AllowedOtpType = typeof ALLOWED_OTP_TYPES[number]

export async function verifyOtpAction(formData: FormData) {
  // C4: Rate limit OTP verification attempts by IP (strictest limit)
  try {
    await enforceRateLimit(null, OTP_RATE_LIMIT)
  } catch (e) {
    const rateLimitErr = handleRateLimitError(e)
    if (rateLimitErr) return rateLimitErr
  }

  const supabase = await createClient()
  const email = formData.get('email') as string
  const token = formData.get('otp') as string
  const rawType = formData.get('type') as string

  if (!email || !token) {
    return { error: 'Email and OTP are required.' }
  }

  // C6: Strictly validate the OTP type parameter at runtime
  if (!rawType || !ALLOWED_OTP_TYPES.includes(rawType as AllowedOtpType)) {
    return { error: 'Invalid verification type.' }
  }
  const type = rawType as AllowedOtpType

  // Use generic error to prevent OTP enumeration
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type,
  })

  if (error) {
    return { error: 'Invalid or expired verification code.' }
  }

  revalidatePath('/', 'layout')
  if (type === 'recovery') {
    // If it's recovery, redirect them to the reset-password page
    redirect('/reset-password')
  } else {
    // If it's signup verification, redirect to dashboard
    redirect('/dashboard')
  }
}

export async function logout() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('[LOGOUT ERROR]', error)
    return { error: 'Failed to sign out. Please try again.' }
  }

  revalidatePath('/', 'layout')
  redirect('/sign-in')
}

export async function sendPasswordReset(formData: FormData) {
  // C4: Rate limit password reset attempts by IP
  try {
    await enforceRateLimit(null, RESET_RATE_LIMIT)
  } catch (e) {
    const rateLimitErr = handleRateLimitError(e)
    if (rateLimitErr) return rateLimitErr
  }

  const supabase = await createClient()
  const email = formData.get('email') as string
  const turnstileToken = formData.get('cf-turnstile-response') as string | null

  const turnstileCheck = await verifyTurnstileToken(turnstileToken)
  if (!turnstileCheck.success) {
    return { error: turnstileCheck.error || 'Security check failed.' }
  }

  const validation = forgotPasswordSchema.safeParse({ email })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  // Supabase will send a recovery token (OTP code)
  const { error } = await supabase.auth.resetPasswordForEmail(email)

  if (error) {
    console.error('[PASSWORD RESET ERROR]', error)
    // Always return success to prevent email enumeration
    return { success: true, email, message: 'A 6-digit recovery code has been sent to your email.' }
  }

  return { success: true, email, message: 'A 6-digit recovery code has been sent to your email.' }
}

export async function updatePassword(formData: FormData) {
  // C4: Rate limit password update attempts by IP
  try {
    await enforceRateLimit(null, AUTH_RATE_LIMIT)
  } catch (e) {
    const rateLimitErr = handleRateLimitError(e)
    if (rateLimitErr) return rateLimitErr
  }

  const supabase = await createClient()
  const currentPassword = formData.get('currentPassword') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // H11: Require current password
  if (!currentPassword) {
    return { error: 'Current password is required.' }
  }

  const validation = resetPasswordSchema.safeParse({ password, confirmPassword })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  // H11: Verify current password by getting the user and attempting sign-in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return { error: 'Unable to verify identity. Please sign in again.' }
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (verifyError) {
    return { error: 'Current password is incorrect.' }
  }

  // Current password verified, now update to the new password
  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    console.error('[UPDATE PASSWORD ERROR]', error)
    return { error: 'Failed to update password. Please try again.' }
  }

  return { success: true, message: 'Password successfully updated!' }
}

export async function signInWithGoogle() {
  // C4: Rate limit OAuth attempts by IP
  try {
    await enforceRateLimit(null, OAUTH_RATE_LIMIT)
  } catch (e) {
    const rateLimitErr = handleRateLimitError(e)
    if (rateLimitErr) return rateLimitErr
  }

  const supabase = await createClient()

  // H14: Use NEXT_PUBLIC_SITE_URL as the trusted base URL.
  // Do NOT trust headers (x-forwarded-proto, host) as they are user-controllable.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/api/auth/callback`,
    },
  })

  if (error) {
    console.error('[GOOGLE SIGN-IN ERROR]', error)
    return { error: 'Failed to initiate Google sign-in. Please try again.' }
  }

  if (data?.url) {
    redirect(data.url)
  }
}
