import 'server-only'
import { headers } from 'next/headers'

/**
 * Fixed-window in-memory rate limiter for server actions and API routes.
 *
 * Identifies requests by authenticated User ID (preferred) or client IP address.
 * Stores state in a process-local Map — suitable for single-server deployments.
 * For multi-instance deployments, swap the store with Redis or similar.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

export interface RateLimitResult {
  /** Whether the request is allowed under the limit. */
  success: boolean
  /** How many requests remain in the current window. */
  remaining: number
  /** Unix timestamp (ms) when the window resets. */
  resetAt: number
}

export interface RateLimitOptions {
  /** Maximum number of requests allowed in the window. */
  limit: number
  /** Window duration in milliseconds. */
  windowMs: number
}

export class RateLimitError extends Error {
  public readonly retryAfterMs: number
  public readonly resetAt: number

  constructor(result: RateLimitResult) {
    super('Rate limit exceeded. Please try again later.')
    this.name = 'RateLimitError'
    this.retryAfterMs = result.resetAt - Date.now()
    this.resetAt = result.resetAt
  }
}

// ── In-memory store ────────────────────────────────────────────────
const store = new Map<string, RateLimitEntry>()

// Periodic cleanup to prevent unbounded memory growth.
// Evicts expired entries every 60 seconds.
const CLEANUP_INTERVAL_MS = 60_000
const cleanupTimer = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of Array.from(store)) {
    if (now >= entry.resetAt) {
      store.delete(key)
    }
  }
}, CLEANUP_INTERVAL_MS)

// Allow the timer to not keep the process alive in edge/serverless environments.
if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
  cleanupTimer.unref()
}

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Extracts the best-effort client IP from standard proxy headers.
 * Returns 'unknown' if no IP can be determined.
 */
async function getClientIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for may contain a chain: client, proxy1, proxy2
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return h.get('x-real-ip') ?? 'unknown'
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Checks the rate limit for a given identifier.
 *
 * @param identifier - A string that uniquely identifies the requester (e.g. user ID or IP).
 * @param options    - Limit and window configuration.
 * @returns          - A result indicating whether the request is allowed.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions,
): RateLimitResult {
  const { limit, windowMs } = options
  const now = Date.now()
  const key = `rl:${identifier}`

  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    // Start a new window
    const newEntry: RateLimitEntry = { count: 1, resetAt: now + windowMs }
    store.set(key, newEntry)
    return {
      success: true,
      remaining: limit - 1,
      resetAt: newEntry.resetAt,
    }
  }

  if (entry.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  entry.count++
  return {
    success: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Convenience wrapper that resolves the caller identity (user ID or IP)
 * and enforces the rate limit in one call.
 *
 * @param userId  - Authenticated user's ID, if available. Falls back to IP.
 * @param options - Limit and window configuration.
 * @returns       - A rate-limit result.
 * @throws        - `RateLimitError` if the limit is exceeded.
 */
export async function enforceRateLimit(
  userId: string | null | undefined,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const identifier = userId ?? (await getClientIp())
  const result = checkRateLimit(identifier, options)

  if (!result.success) {
    throw new RateLimitError(result)
  }

  return result
}
