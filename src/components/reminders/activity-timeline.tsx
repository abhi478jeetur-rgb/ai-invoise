'use client'

import React from 'react'

interface ActivityEvent {
  id: string
  event_type: string
  description: string | null
  created_at: string
  invoice_number: string | null
  invoice_title: string | null
}

interface ActivityTimelineProps {
  events: ActivityEvent[]
  showInvoiceRef?: boolean
}

const EVENT_META: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  draft_generated: {
    icon: 'AI',
    color: 'text-blue-400',
    bg: 'bg-blue-950/40',
    border: 'border-blue-900/50',
  },
  draft_copied: {
    icon: 'C',
    color: 'text-purple-400',
    bg: 'bg-purple-950/40',
    border: 'border-purple-900/50',
  },
  marked_sent: {
    icon: 'S',
    color: 'text-green-400',
    bg: 'bg-green-950/40',
    border: 'border-green-900/50',
  },
  sent_failed: {
    icon: '!',
    color: 'text-red-400',
    bg: 'bg-red-950/40',
    border: 'border-red-900/50',
  },
  status_changed: {
    icon: '~',
    color: 'text-yellow-400',
    bg: 'bg-yellow-950/40',
    border: 'border-yellow-900/50',
  },
  invoice_imported: {
    icon: 'I',
    color: 'text-neutral-400',
    bg: 'bg-neutral-800/40',
    border: 'border-neutral-700/50',
  },
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return diffMin === 1 ? '1 min ago' : `${diffMin} mins ago`
  if (diffHr < 24) return diffHr === 1 ? '1 hour ago' : `${diffHr} hours ago`
  if (diffDays < 7) return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ActivityTimeline({ events, showInvoiceRef = false }: ActivityTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm text-neutral-500">No activity yet.</p>
        <p className="text-xs text-neutral-600 mt-1">
          Generate a reminder to see activity here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {events.map((event, idx) => {
        const meta = EVENT_META[event.event_type] ?? {
          icon: '?',
          color: 'text-neutral-400',
          bg: 'bg-neutral-800/40',
          border: 'border-neutral-700/50',
        }

        return (
          <div key={event.id} className="flex gap-3">
            {/* Timeline dot + line */}
            <div className="flex flex-col items-center">
              <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${meta.bg} border ${meta.border} shrink-0`}>
                <span className={`text-[9px] font-bold ${meta.color}`}>{meta.icon}</span>
              </div>
              {idx < events.length - 1 && (
                <div className="w-px flex-1 bg-neutral-800 my-1" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 min-w-0 flex-1">
              <p className="text-xs text-neutral-300 leading-relaxed">
                {event.description || event.event_type}
              </p>
              {showInvoiceRef && event.invoice_number && (
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Invoice {event.invoice_number}
                  {event.invoice_title && ` - ${event.invoice_title}`}
                </p>
              )}
              <p className="text-[10px] text-neutral-600 mt-1">
                {formatRelativeTime(event.created_at)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
