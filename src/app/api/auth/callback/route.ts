import { NextResponse } from 'next/server'
import { createClient } from '@/lib/db/server'

/**
 * Sanitizes the `next` redirect path to prevent open redirect attacks.
 * Only allows relative paths starting with a single `/`.
 * Rejects protocol-relative URLs (//evil.com), absolute URLs (https://evil.com),
 * and path traversal attempts.
 */
function sanitizeNextPath(next: string): string {
  // Must start with exactly one slash, not two or more
  if (!next.startsWith('/') || next.startsWith('//')) {
    return '/dashboard'
  }
  // Reject any string containing a protocol scheme (http:, javascript:, data:, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(next)) {
    return '/dashboard'
  }
  // Normalize path traversal sequences
  const normalized = next.replace(/\\/g, '/')
  // Reject if it still looks suspicious after normalization
  if (normalized.includes('\0')) {
    return '/dashboard'
  }
  return normalized
}

/**
 * Resolves the base URL for redirects.
 * Uses NEXT_PUBLIC_SITE_URL in production, falls back to request origin in development.
 */
function getBaseUrl(request: Request): string {
  const { origin } = new URL(request.url)
  const isLocalEnv = process.env.NODE_ENV === 'development'

  if (isLocalEnv) {
    return origin
  }

  // In production, prefer the explicitly configured site URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (siteUrl) {
    // Ensure no trailing slash
    return siteUrl.replace(/\/+$/, '')
  }

  // Fallback to request origin (safe when behind a trusted reverse proxy)
  return origin
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'
  const next = sanitizeNextPath(rawNext)
  const baseUrl = getBaseUrl(request)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${baseUrl}/sign-in?error=Authentication failed. Please try again.`)
}
