import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM_GCM = 'aes-256-gcm'
const ALGORITHM_CBC = 'aes-256-cbc'
const KEY_LENGTH = 32
const IV_LENGTH_GCM = 12
const IV_LENGTH_CBC = 16
const SALT = 'chasefree-ai-v1-salt'

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[SECURITY] ENCRYPTION_KEY environment variable is not set. ' +
        'This key is required to encrypt and decrypt API keys securely in production.'
      )
    }
    console.warn(
      '[SECURITY] ENCRYPTION_KEY not set. Using development fallback. ' +
      'Set ENCRYPTION_KEY in .env.local for production.'
    )
    return scryptSync('chasefree-dev-fallback-key', SALT, KEY_LENGTH)
  }

  return scryptSync(secret, SALT, KEY_LENGTH)
}

export function encryptKey(text: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH_GCM)
  const cipher = createCipheriv(ALGORITHM_GCM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const tag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

export function decryptKey(encryptedText: string): string {
  const key = getEncryptionKey()
  const parts = encryptedText.split(':')

  // Handle AES-256-GCM (3 parts: iv:tag:encrypted)
  if (parts.length === 3) {
    const [ivHex, tagHex, encrypted] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const decipher = createDecipheriv(ALGORITHM_GCM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  // Handle Legacy AES-256-CBC (2 parts: iv:encrypted)
  if (parts.length === 2) {
    const [ivHex, encrypted] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = createDecipheriv(ALGORITHM_CBC, key, iv)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  throw new Error('Invalid encrypted key format.')
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '****'
  return `${key.slice(0, 4)}${'*'.repeat(key.length - 8)}${key.slice(-4)}`
}

