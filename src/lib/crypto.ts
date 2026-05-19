import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT = 'chasefree-ai-v1-salt'

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY

  if (!secret) {
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
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return `${iv.toString('hex')}:${encrypted}`
}

export function decryptKey(encryptedText: string): string {
  const key = getEncryptionKey()
  const [ivHex, encrypted] = encryptedText.split(':')

  if (!ivHex || !encrypted) {
    throw new Error('Invalid encrypted key format.')
  }

  const iv = Buffer.from(ivHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '****'
  return `${key.slice(0, 4)}${'*'.repeat(key.length - 8)}${key.slice(-4)}`
}
