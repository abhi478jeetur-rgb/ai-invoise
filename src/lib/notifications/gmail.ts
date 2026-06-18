import { encryptKey, decryptKey } from '@/lib/crypto'
import { logError } from '@/lib/utils/error-handler'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = 'http://localhost:3000/api/auth/gmail/callback'

export interface GmailTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

export interface GoogleUserInfo {
  email: string
}

/**
 * Generate the Google OAuth authorization URL for Gmail scopes.
 */
export function getGoogleAuthUrl(): string {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('[gmail/getGoogleAuthUrl] GOOGLE_CLIENT_ID is not set.')
  }

  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email',
  ]

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline', // Critical to get refresh token
    prompt: 'select_account consent', // Always prompt consent to ensure refresh token is returned
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

/**
 * Exchange OAuth authorization code for access and refresh tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<GmailTokenResponse> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('[gmail/exchangeCodeForTokens] Google OAuth credentials are not set.')
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => ({}))
    logError('gmail/exchangeCodeForTokens', errorData)
    throw new Error(`Failed to exchange authorization code for tokens: ${response.statusText}`)
  }

  return response.json() as Promise<GmailTokenResponse>
}

/**
 * Refresh the Google access token using the stored refresh token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<Pick<GmailTokenResponse, 'access_token' | 'expires_in'>> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('[gmail/refreshAccessToken] Google OAuth credentials are not set.')
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => ({}))
    logError('gmail/refreshAccessToken', errorData)
    throw new Error(`Failed to refresh Google access token: ${response.statusText}`)
  }

  return response.json() as Promise<Pick<GmailTokenResponse, 'access_token' | 'expires_in'>>
}

/**
 * Fetch the authenticated user's email address using the access token.
 */
export async function getGoogleUserEmail(accessToken: string): Promise<string> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch user email: ${response.statusText}`)
  }

  const userInfo = (await response.json()) as GoogleUserInfo
  return userInfo.email
}

/**
 * Get a valid, non-expired access token for the user. Refreshes if expired.
 */
export async function getValidAccessToken(
  supabase: any,
  userId: string
): Promise<string> {
  const { data: connection, error } = await supabase
    .from('email_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'gmail')
    .single()

  if (error || !connection) {
    throw new Error('Gmail connection not found.')
  }

  const expiresAt = new Date(connection.expires_at).getTime()
  const now = Date.now()

  // If token is still valid (with 5-minute buffer), return it
  if (expiresAt - now > 5 * 60 * 1000) {
    return decryptKey(connection.access_token_encrypted)
  }

  // Token is expired or about to expire, refresh it
  const decryptedRefreshToken = decryptKey(connection.refresh_token_encrypted)
  const refreshResponse = await refreshAccessToken(decryptedRefreshToken)

  const newAccessTokenEncrypted = encryptKey(refreshResponse.access_token)
  const newExpiresAt = new Date(Date.now() + refreshResponse.expires_in * 1000).toISOString()

  const { error: updateError } = await supabase
    .from('email_connections')
    .update({
      access_token_encrypted: newAccessTokenEncrypted,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', connection.id)

  if (updateError) {
    logError('gmail/getValidAccessToken/update', updateError)
    throw new Error('Failed to update refreshed access token in database.')
  }

  return refreshResponse.access_token
}

/**
 * Send an email reminder using the Gmail REST API.
 */
export async function sendGmailReminder(
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string
): Promise<{ messageId: string; threadId: string }> {
  // Construct RFC 2822 formatted raw email string
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`
  const emailLines = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    bodyText,
  ]
  const rawEmail = Buffer.from(emailLines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: rawEmail,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    logError('gmail/sendGmailReminder', errorText)
    throw new Error(`Failed to send email via Gmail API: ${response.statusText}`)
  }

  const data = (await response.json()) as { id: string; threadId: string }
  return {
    messageId: data.id,
    threadId: data.threadId,
  }
}
