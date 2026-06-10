import 'server-only'
import { promises as dns } from 'dns'
import { isIP } from 'net'

/**
 * Validates if a URL is safe to fetch from the server.
 * Blocks private, loopback, link-local and multicast/broadcast addresses (SSRF prevention).
 */
export async function isSafeUrl(urlStr: string): Promise<boolean> {
  try {
    const url = new URL(urlStr)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false
    }

    const hostname = url.hostname.toLowerCase()

    // Block localhost and standard loopback hostnames
    if (hostname === 'localhost' || hostname === 'localhost.localdomain') {
      return false
    }

    // If it is already an IP address, validate it directly
    if (isIP(hostname)) {
      return isSafeIP(hostname)
    }

    // Resolve hostname to get IP addresses
    try {
      const addresses = await dns.resolve(hostname).catch(async () => {
        // Fallback to dns.lookup if resolve fails (e.g. for some DNS configurations or local hosts)
        const lookup = await dns.lookup(hostname)
        return [lookup.address]
      })

      for (const addr of addresses) {
        if (!isSafeIP(addr)) {
          return false
        }
      }
    } catch (dnsErr) {
      // If DNS resolution completely fails, block the URL as unsafe
      console.warn(`[SSRF PREVENTER] DNS lookup failed for host ${hostname}:`, dnsErr)
      return false
    }

    return true
  } catch {
    return false
  }
}

function isSafeIP(ip: string): boolean {
  // Check IPv4 ranges
  if (ip.includes('.')) {
    const parts = ip.split('.').map(Number)
    if (parts.length !== 4 || parts.some(isNaN)) return false

    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return false

    // 10.0.0.0/8 (Private)
    if (parts[0] === 10) return false

    // 172.16.0.0/12 (Private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false

    // 192.168.0.0/16 (Private)
    if (parts[0] === 192 && parts[1] === 168) return false

    // 169.254.0.0/16 (Link-Local)
    if (parts[0] === 169 && parts[1] === 254) return false

    // 0.0.0.0/8 (Current network)
    if (parts[0] === 0) return false

    // 224.0.0.0/4 (Multicast) and 255.255.255.255/32 (Broadcast)
    if (parts[0] >= 224) return false
  }

  // Check IPv6 ranges
  if (ip.includes(':')) {
    const normalized = ip.toLowerCase()
    // Loopback ::1
    if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return false
    // Link-local fe80::/10
    if (normalized.startsWith('fe80:')) return false
    // Unique local fc00::/7
    if (normalized.startsWith('fc00:') || normalized.startsWith('fd00:')) return false
    // Unspecified ::
    if (normalized === '::') return false
  }

  return true
}

/**
 * Sanitizes a user-supplied URL for use in an href attribute.
 * Only allows http://, https://, mailto:, and tel: protocols.
 * Returns '#' for any other protocol (e.g. javascript:) to prevent XSS.
 */
export function sanitizeHref(urlStr: string | null | undefined): string {
  if (!urlStr) return '#'
  const trimmed = urlStr.trim()
  if (trimmed === '') return '#'
  const lower = trimmed.toLowerCase()
  if (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:')
  ) {
    return trimmed
  }
  return '#'
}

/**
 * Sanitizes database error messages to prevent internal details from leaking to the frontend.
 */
export function sanitizeDatabaseError(error: unknown, defaultMessage = 'An unexpected database error occurred.'): string {
  if (!error) return defaultMessage
  
  const msg = typeof error === 'string'
    ? error
    : (error instanceof Error ? error.message : String((error as Record<string, unknown>).message ?? ''))
  
  // Log the real internal error details safely
  console.error('[DATABASE INTERNAL ERROR]:', error)
  
  if (msg.includes('violates unique constraint') || msg.includes('duplicate key value')) {
    if (msg.includes('invoices_user_id_invoice_number_unique')) {
      return 'An invoice with this number already exists.'
    }
    return 'This record already exists.'
  }

  if (msg.includes('violates foreign key constraint')) {
    return 'The referenced client or invoice record does not exist or was deleted.'
  }

  if (msg.includes('violates check constraint')) {
    if (msg.includes('invoices_amount_non_negative')) {
      return 'Invoice amount must be 0 or greater.'
    }
    if (msg.includes('clients_client_name_not_blank')) {
      return 'Client name cannot be blank.'
    }
    if (msg.includes('user_ai_settings_temperature_range')) {
      return 'AI temperature must be between 0.0 and 2.0.'
    }
    return 'Data validation failed. Please check the values provided.'
  }

  if (msg.includes('JSON')) {
    return 'Invalid data format.'
  }
  
  return defaultMessage
}
