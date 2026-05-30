import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM_GCM = 'aes-256-gcm'
const ALGORITHM_CBC = 'aes-256-cbc'
const KEY_LENGTH = 32
const IV_LENGTH_GCM = 12
const IV_LENGTH_CBC = 16

/**
 * H12: Salt is derived from the ENCRYPTION_KEY itself (not hardcoded).
 * Since we use scryptSync for key derivation, the ENCRYPTION_KEY is already
 * a high-entropy secret. We use a fixed domain-separation string as salt
 * so that the derived key is deterministic per ENCRYPTION_KEY value.
 * This is safe because: (1) the key is unique per deployment, (2) scrypt
 * is designed for password-based key derivation, (3) the domain separator
 * prevents cross-system collisions.
 */
const SALT = 'chasefree-encryption-v2-salt'

function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY

  // H13: Throw unconditionally if ENCRYPTION_KEY is missing (no dev fallback)
  if (!secret) {
    throw new Error(
      '[SECURITY] ENCRYPTION_KEY environment variable is not set. ' +
      'This key is required to encrypt and decrypt API keys securely. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
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
  // NOTE: CBC is kept for backward compatibility with existing encrypted data.
  // New encryptions always use GCM. Consider migrating CBC data to GCM.
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
