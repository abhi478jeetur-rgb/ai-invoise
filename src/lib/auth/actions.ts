'use server'

import { createClient } from '@/lib/db/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { signUpSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations/auth'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

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
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  // Validate using Zod
  const validation = signUpSchema.safeParse({ email, password, fullName })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
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
    return { error: error.message }
  }

  return { success: true, email, message: 'A 6-digit verification code has been sent to your email.' }
}

export async function verifyOtpAction(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const token = formData.get('otp') as string
  const type = (formData.get('type') as 'signup' | 'recovery') || 'signup'

  if (!email || !token) {
    return { error: 'Email and OTP are required.' }
  }

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type,
  })

  if (error) {
    return { error: error.message }
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
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/sign-in')
}

export async function sendPasswordReset(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const validation = forgotPasswordSchema.safeParse({ email })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  // Supabase will send a recovery token (OTP code)
  const { error } = await supabase.auth.resetPasswordForEmail(email)

  if (error) {
    return { error: error.message }
  }

  return { success: true, email, message: 'A 6-digit recovery code has been sent to your email.' }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  const validation = resetPasswordSchema.safeParse({ password, confirmPassword })
  if (!validation.success) {
    return { error: validation.error.issues[0].message }
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Password successfully updated!' }
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/api/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data?.url) {
    redirect(data.url)
  }
}
