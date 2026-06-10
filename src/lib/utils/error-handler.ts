import * as Sentry from '@sentry/nextjs'
import { toast } from 'sonner'

/**
 * Log error internally with details, context, and Sentry tracking in production.
 * Includes module prefix for better searchability.
 */
export function logError(moduleAndAction: string, error: unknown, message?: string): void {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const fullMessage = message ? `${message}: ${errorMessage}` : errorMessage
  
  console.error(`[${moduleAndAction}] ${fullMessage}`, error)
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      tags: { module: moduleAndAction },
      extra: { customMessage: message }
    })
  }
}

/**
 * Handle a client-side error by logging it and displaying a toast notification to the user.
 */
export function handleClientError(moduleAndAction: string, error: unknown, fallbackMessage: string): void {
  logError(moduleAndAction, error)
  const userMessage = error instanceof Error ? error.message : fallbackMessage
  toast.error(userMessage)
}
