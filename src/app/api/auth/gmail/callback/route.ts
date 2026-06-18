import { createClient } from '@/lib/db/server'
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, getGoogleUserEmail } from '@/lib/notifications/gmail'
import { encryptKey } from '@/lib/crypto'
import { logError } from '@/lib/utils/error-handler'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  const redirectError = (reason: string) => {
    return NextResponse.redirect(new URL(`/settings?gmail=error&reason=${encodeURIComponent(reason)}`, request.url))
  }

  if (error) {
    logError('api/auth/gmail/callback/error', error)
    return redirectError(error)
  }

  if (!code) {
    return redirectError('No authorization code provided')
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return redirectError('Unauthorized user session')
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code)

    if (!tokens.refresh_token) {
      // Note: Google only sends refresh token on the first authorization/consent screen.
      // We force 'consent' in getGoogleAuthUrl to ensure we always receive one if they re-connect.
      logError('api/auth/gmail/callback/no-refresh-token', 'No refresh token returned by Google')
    }

    // Fetch user's Gmail address to display on settings screen
    const emailAddress = await getGoogleUserEmail(tokens.access_token)

    const accessTokenEncrypted = encryptKey(tokens.access_token)
    // If refresh token is missing (which shouldn't happen with prompt=consent), check if we have one in DB already,
    // otherwise throw an error.
    let refreshTokenEncrypted = tokens.refresh_token ? encryptKey(tokens.refresh_token) : null

    if (!refreshTokenEncrypted) {
      const { data: existingConnection } = await supabase
        .from('email_connections')
        .select('refresh_token_encrypted')
        .eq('user_id', user.id)
        .eq('provider', 'gmail')
        .single()

      if (existingConnection) {
        refreshTokenEncrypted = existingConnection.refresh_token_encrypted
      } else {
        return redirectError('Failed to obtain offline access permission. Please disconnect and try again.')
      }
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Save or update in database
    const { error: upsertError } = await supabase
      .from('email_connections')
      .upsert({
        user_id: user.id,
        provider: 'gmail',
        email_address: emailAddress,
        access_token_encrypted: accessTokenEncrypted,
        refresh_token_encrypted: refreshTokenEncrypted,
        expires_at: expiresAt,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      })

    if (upsertError) {
      logError('api/auth/gmail/callback/upsert', upsertError)
      return redirectError('Database error occurred while saving connections')
    }

    return NextResponse.redirect(new URL('/settings?gmail=connected', request.url))
  } catch (err: unknown) {
    logError('api/auth/gmail/callback/catch', err)
    const message = err instanceof Error ? err.message : 'Unknown authorization error'
    return redirectError(message)
  }
}
