'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, AlertCircle, Check, Clock, ArrowRight, Copy, Send, Sparkles, Loader2, FileText, MessageSquare, ExternalLink } from 'lucide-react'
import { getReminderHistoryAction, generateMultipleDraftsAction, logReminderEventAction } from '@/lib/reminders/actions'

interface Invoice {
  id: string
  invoice_number: string
  title: string | null
  amount: number
  currency: string
  status: string
  due_date: string
  reminder_count: number
  last_reminder_at: string | null
  clients: {
    client_name: string
    email: string | null
    company_name: string | null
  } | null
}

interface AiSettings {
  base_url: string
  provider_label: string
  model_name: string
  temperature: number
  masked_api_key: string
}

interface RemindersPageClientProps {
  initialInvoices: Invoice[]
  initialSettings: AiSettings | null
}

interface ReminderHistoryEvent {
  id: string
  event_type: string
  description: string | null
  created_at: string
  tone: string | null
  draft_subject: string | null
}

interface DraftVariant {
  id: string
  subject: string
  body: string
  tone: string
  variantIndex: number
}

type FilterKey = 'all' | 'needs_followup' | 'overdue' | 'recently_reminded'
type ToneKey = 'friendly' | 'professional' | 'firm' | 'final_notice'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'needs_followup', label: 'Needs Follow-up' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'recently_reminded', label: 'Recently Reminded' },
]

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-zinc-700/50 text-zinc-400',
  sent: 'bg-blue-500/15 text-blue-400',
  due_soon: 'bg-amber-500/15 text-amber-400',
  overdue: 'bg-red-500/[0.1] text-red-400',
  paid: 'bg-emerald-500/15 text-emerald-400',
  archived: 'bg-zinc-700/50 text-zinc-500',
}

const TONE_LABELS: Record<string, string> = {
  friendly: 'Friendly',
  professional: 'Professional',
  firm: 'Firm',
  final_notice: 'Final Notice',
}

const TONE_PRESETS: { key: ToneKey; label: string; sub: string }[] = [
  { key: 'friendly', label: 'Friendly Nudge', sub: 'Soft, warm, and polite. Assumes the client simply forgot.' },
  { key: 'professional', label: 'Professional Reminder', sub: 'Standard business-appropriate. Clear and courteous.' },
  { key: 'firm', label: 'Firm Deadline', sub: 'Urgent and direct. Sets clear expectations and a deadline.' },
  { key: 'final_notice', label: 'Final Notice', sub: 'Extremely direct final warning before further action.' },
]

const VARIANT_LABELS = ['Concise', 'Warm', 'Detailed']

const EVENT_ICONS: Record<string, typeof Check> = {
  draft_generated: ArrowRight,
  draft_copied: Check,
  marked_sent: Check,
}

function getDueInfo(invoice: Invoice) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(invoice.due_date + 'T00:00:00')
  due.setHours(0, 0, 0, 0)
  const diffMs = due.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  return { diffDays, isPast: diffDays < 0 }
}

function getFollowupRecommendation(invoice: Invoice): { message: string; tone: ToneKey } {
  const { diffDays } = getDueInfo(invoice)

  if (diffDays < 0) {
    const days = Math.abs(diffDays)
    if (days > 14) return { message: `Overdue by ${days} days. A Final Notice tone is recommended.`, tone: 'final_notice' }
    if (days > 7) return { message: `Overdue by ${days} days. A Firm Deadline tone is recommended.`, tone: 'firm' }
    return { message: `Overdue by ${days} days. A Professional follow-up is recommended.`, tone: 'professional' }
  }
  if (diffDays === 0) return { message: 'Due today. A Friendly Nudge is recommended.', tone: 'friendly' }
  if (diffDays === 1) return { message: 'Due tomorrow. A Friendly reminder is recommended.', tone: 'friendly' }
  if (diffDays <= 3) return { message: `Due in ${diffDays} days. A Professional heads-up is recommended.`, tone: 'professional' }
  return { message: `Due in ${diffDays} days. No urgent action needed.`, tone: 'friendly' }
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function extractShortSms(body: string): string {
  // Take the first paragraph, strip greeting lines, keep it concise
  const paragraphs = body.split(/\n\n+/).filter((p) => p.trim().length > 0)
  const first = paragraphs[0] ?? body
  // Remove common greeting lines like "Hi John," at the start
  const lines = first.split('\n').filter((l) => l.trim().length > 0)
  const contentLines = lines.filter((l) => !/^(hi|hello|dear|hey)\b/i.test(l.trim()))
  const text = contentLines.join(' ').trim()
  return text.length > 200 ? text.slice(0, 197) + '...' : text
}

function buildEmailUrl(
  provider: 'gmail' | 'outlook' | 'default',
  to: string,
  subject: string,
  body: string
): string {
  const encTo = encodeURIComponent(to)
  const encSubject = encodeURIComponent(subject)
  const encBody = encodeURIComponent(body)

  switch (provider) {
    case 'gmail':
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${encTo}&su=${encSubject}&body=${encBody}`
    case 'outlook':
      return `https://outlook.live.com/mail/0/deeplink/compose?to=${encTo}&subject=${encSubject}&body=${encBody}`
    case 'default':
      return `mailto:${encTo}?subject=${encSubject}&body=${encBody}`
  }
}

export function RemindersPageClient({ initialInvoices, initialSettings }: RemindersPageClientProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [history, setHistory] = useState<ReminderHistoryEvent[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  // Tone & generation state
  const [selectedTone, setSelectedTone] = useState<ToneKey>('professional')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // Drafts state
  const [drafts, setDrafts] = useState<DraftVariant[]>([])
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(null)

  // Editor state
  const [editSubject, setEditSubject] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editSms, setEditSms] = useState('')

  // Feedback state
  const [copied, setCopied] = useState(false)
  const [sentFeedback, setSentFeedback] = useState(false)

  const selectedInvoice = initialInvoices.find((inv) => inv.id === selectedInvoiceId) ?? null
  const needsSetup = !initialSettings?.base_url || !initialSettings?.model_name

  // Auto-set recommended tone when invoice changes
  useEffect(() => {
    if (selectedInvoice) {
      const { tone } = getFollowupRecommendation(selectedInvoice)
      setSelectedTone(tone as ToneKey)
    }
  }, [selectedInvoiceId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset workspace when invoice changes
  useEffect(() => {
    setDrafts([])
    setSelectedVariantIndex(null)
    setEditSubject('')
    setEditBody('')
    setEditSms('')
    setGenerateError(null)
  }, [selectedInvoiceId])

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    let list = initialInvoices

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(q) ||
          (inv.clients?.client_name ?? '').toLowerCase().includes(q)
      )
    }

    switch (activeFilter) {
      case 'needs_followup':
        list = list.filter((inv) => inv.status !== 'paid' && inv.status !== 'archived')
        break
      case 'overdue': {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        list = list.filter((inv) => {
          if (inv.status === 'paid' || inv.status === 'archived') return false
          const due = new Date(inv.due_date + 'T00:00:00')
          due.setHours(0, 0, 0, 0)
          return due < today
        })
        break
      }
      case 'recently_reminded':
        list = list.filter((inv) => (inv.reminder_count ?? 0) > 0)
        break
    }

    return list
  }, [initialInvoices, searchQuery, activeFilter])

  // Fetch history
  const fetchHistory = useCallback(async () => {
    if (!selectedInvoiceId) {
      setHistory([])
      setHistoryError(null)
      return
    }

    setHistoryLoading(true)
    setHistoryError(null)

    const result = await getReminderHistoryAction(selectedInvoiceId)
    setHistoryLoading(false)
    if (result.success && result.data) {
      setHistory(result.data)
    } else {
      setHistoryError(result.error ?? 'Failed to load history.')
      setHistory([])
    }
  }, [selectedInvoiceId])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Generate drafts
  async function handleGenerate() {
    if (!selectedInvoiceId || needsSetup) return

    setGenerating(true)
    setGenerateError(null)
    setDrafts([])
    setSelectedVariantIndex(null)

    const result = await generateMultipleDraftsAction(selectedInvoiceId, selectedTone)

    setGenerating(false)

    if (result.success && result.data) {
      setDrafts(result.data)
      // Auto-select first variant
      if (result.data.length > 0) {
        selectVariant(result.data, 0)
      }
      fetchHistory()
    } else {
      setGenerateError(result.error ?? 'Generation failed.')
    }
  }

  // Select a variant and populate editor
  function selectVariant(variants: DraftVariant[], index: number) {
    const variant = variants[index]
    if (!variant) return
    setSelectedVariantIndex(variant.variantIndex)
    setEditSubject(variant.subject)
    setEditBody(variant.body)
    setEditSms(extractShortSms(variant.body))
  }

  // Copy to clipboard
  async function handleCopy() {
    const text = `Subject: ${editSubject}\n\n${editBody}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    const selectedDraft = drafts.find((d) => d.variantIndex === selectedVariantIndex)
    if (selectedDraft && selectedInvoiceId) {
      await logReminderEventAction(selectedInvoiceId, 'draft_copied', selectedDraft.id)
      fetchHistory()
    }
  }

  // Mark as sent
  async function handleMarkSent() {
    const selectedDraft = drafts.find((d) => d.variantIndex === selectedVariantIndex)
    if (!selectedDraft || !selectedInvoiceId) return

    await logReminderEventAction(selectedInvoiceId, 'marked_sent', selectedDraft.id)
    setSentFeedback(true)
    setTimeout(() => setSentFeedback(false), 2500)
    fetchHistory()
  }

  const hasDrafts = drafts.length > 0
  const selectedDraft = drafts.find((d) => d.variantIndex === selectedVariantIndex) ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">AI Reminders</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Select an invoice to generate AI-powered follow-up emails.
        </p>
      </div>

      {needsSetup && (
        <div className="rounded-lg border border-amber-500/[0.2] bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-400 backdrop-blur-md">
          AI settings not configured.{' '}
          <a href="/settings" className="underline hover:text-amber-200">
            Set up your API key in Settings
          </a>{' '}
          before generating reminders.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          {/* Search & Filters */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
            <div className="p-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      activeFilter === filter.key
                        ? 'bg-zinc-700 text-zinc-200'
                        : 'bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Invoice List */}
            <div className="max-h-[400px] overflow-y-auto border-t border-zinc-800">
              {filteredInvoices.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  {initialInvoices.length === 0 ? 'No invoices found.' : 'No invoices match your filters.'}
                </div>
              ) : (
                <ul className="divide-y divide-zinc-800">
                  {filteredInvoices.map((invoice) => {
                    const isSelected = invoice.id === selectedInvoiceId
                    return (
                      <li key={invoice.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceId(invoice.id)}
                          className={`flex w-full flex-col gap-1 px-4 py-4 text-left transition-colors ${
                            isSelected ? 'bg-zinc-800/80' : 'hover:bg-zinc-800/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-zinc-200">
                              {invoice.invoice_number}
                            </span>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                STATUS_STYLES[invoice.status] ?? 'bg-zinc-700/50 text-zinc-400'
                              }`}
                            >
                              {invoice.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>{invoice.clients?.client_name ?? 'Unknown client'}</span>
                            <span>
                              {invoice.currency} {Number(invoice.amount).toFixed(2)}
                            </span>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Selected Invoice Context Card */}
          {selectedInvoice && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
              <h3 className="text-sm font-medium text-zinc-300">Invoice Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-zinc-500">Due Date</span>
                  <p className="text-zinc-200">
                    {new Date(selectedInvoice.due_date + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500">Amount</span>
                  <p className="text-zinc-200">
                    {selectedInvoice.currency} {Number(selectedInvoice.amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500">Reminders Sent</span>
                  <p className="text-zinc-200">{selectedInvoice.reminder_count ?? 0}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Last Reminded</span>
                  <p className="text-zinc-200">
                    {selectedInvoice.last_reminder_at
                      ? new Date(selectedInvoice.last_reminder_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Never'}
                  </p>
                </div>
              </div>

              {/* Why this needs follow-up */}
              {(() => {
                const { message, tone } = getFollowupRecommendation(selectedInvoice)
                return (
                  <div className="rounded-md border border-zinc-800 bg-zinc-950/50 px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      <div>
                        <p className="text-xs text-zinc-300">{message}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          Suggested tone: <span className="text-zinc-400">{TONE_LABELS[tone] ?? tone}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Reminder History Timeline */}
          {selectedInvoice && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <h3 className="mb-3 text-sm font-medium text-zinc-300">Reminder History</h3>

              {historyLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Clock className="h-4 w-4 animate-spin text-zinc-500" />
                  <span className="ml-2 text-xs text-zinc-500">Loading history...</span>
                </div>
              ) : historyError ? (
                <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {historyError}
                </div>
              ) : history.length === 0 ? (
                <div className="py-6 text-center">
                  <Clock className="mx-auto h-5 w-5 text-zinc-700" />
                  <p className="mt-2 text-xs text-zinc-600">No reminder activity yet.</p>
                </div>
              ) : (
                <div className="relative pl-4">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-800" />

                  <ul className="space-y-3">
                    {history.map((event) => {
                      const Icon = EVENT_ICONS[event.event_type] ?? Clock
                      return (
                        <li key={event.id} className="relative flex items-start gap-3">
                          <div className="relative z-10 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-zinc-700">
                            <Icon className="h-2.5 w-2.5 text-zinc-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-zinc-300">
                              {event.event_type === 'draft_generated' && (
                                <>
                                  Generated{' '}
                                  <span className="text-zinc-400">
                                    {event.tone ? (TONE_LABELS[event.tone] ?? event.tone) : 'reminder'}
                                  </span>{' '}
                                  draft
                                </>
                              )}
                              {event.event_type === 'draft_copied' && 'Copied draft to clipboard'}
                              {event.event_type === 'marked_sent' && 'Marked as sent'}
                            </p>
                            {event.draft_subject && (
                              <p className="mt-0.5 truncate text-xs text-zinc-600">
                                {event.draft_subject}
                              </p>
                            )}
                            <p className="mt-0.5 text-[11px] text-zinc-600">
                              {formatRelativeDate(event.created_at)}
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column — Workspace */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
          {!selectedInvoice ? (
            <div className="flex h-full min-h-[300px] items-center justify-center px-6 text-center">
              <div>
                <p className="text-sm text-zinc-500">
                  Select an invoice to begin drafting follow-ups.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Header */}
              <div>
                <h3 className="text-lg font-medium text-zinc-100">
                  {selectedInvoice.invoice_number}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {selectedInvoice.clients?.client_name ?? 'Unknown client'} &middot;{' '}
                  {selectedInvoice.currency} {Number(selectedInvoice.amount).toFixed(2)}
                </p>
              </div>

              {/* Tone Preset Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Select Tone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TONE_PRESETS.map((preset) => {
                    const isSelected = selectedTone === preset.key
                    const { tone: recommendedTone } = getFollowupRecommendation(selectedInvoice)
                    const isRecommended = recommendedTone === preset.key
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => setSelectedTone(preset.key)}
                        className={`relative rounded-lg border px-3 py-2.5 text-left transition-colors ${
                          isSelected
                            ? 'border-zinc-500 bg-zinc-800'
                            : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
                        }`}
                      >
                        {isRecommended && (
                          <span className="absolute -top-1.5 right-2 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                            Recommended
                          </span>
                        )}
                        <p className={`text-xs font-medium ${isSelected ? 'text-zinc-100' : 'text-zinc-300'}`}>
                          {preset.label}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-tight text-zinc-500">
                          {preset.sub}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || needsSetup}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating 3 variants...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Reminders
                  </>
                )}
              </button>

              {/* Generate Error */}
              {generateError && (
                <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {generateError}
                </div>
              )}

              {/* Generating Skeleton */}
              {generating && (
                <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800" />
                  <div className="space-y-2">
                    <div className="h-3 w-full animate-pulse rounded bg-zinc-800/70" />
                    <div className="h-3 w-full animate-pulse rounded bg-zinc-800/70" />
                    <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-800/70" />
                    <div className="h-3 w-full animate-pulse rounded bg-zinc-800/70" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-800/70" />
                  </div>
                  <div className="pt-2">
                    <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800/50" />
                  </div>
                </div>
              )}

              {/* Draft Variant Cards */}
              {hasDrafts && !generating && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Choose a Variant
                  </label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {drafts.map((draft) => {
                      const isSelected = selectedVariantIndex === draft.variantIndex
                      return (
                        <button
                          key={draft.variantIndex}
                          type="button"
                          onClick={() => selectVariant(drafts, draft.variantIndex)}
                          className={`rounded-lg border p-3 text-left transition-colors ${
                            isSelected
                              ? 'border-zinc-400 bg-zinc-800 ring-1 ring-zinc-500'
                              : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-zinc-500" />
                            <span className={`text-xs font-medium ${isSelected ? 'text-zinc-100' : 'text-zinc-300'}`}>
                              Variant {draft.variantIndex + 1}: {VARIANT_LABELS[draft.variantIndex] ?? 'Draft'}
                            </span>
                          </div>
                          <p className="mt-1.5 truncate text-xs text-zinc-500">
                            {draft.subject}
                          </p>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-600">
                            {draft.body.slice(0, 100)}...
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Editable Workspace */}
              {selectedDraft && !generating && (
                <div className="space-y-4">
                  {/* Email Editor */}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-zinc-500" />
                      <span className="text-sm font-medium text-zinc-300">Email Draft</span>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Subject</label>
                      <input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Body</label>
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={10}
                        className="w-full resize-y rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm leading-relaxed text-zinc-200 focus:border-zinc-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* SMS / WhatsApp Version */}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-zinc-500" />
                      <span className="text-sm font-medium text-zinc-300">Short SMS / WhatsApp Version</span>
                    </div>

                    <div>
                      <textarea
                        value={editSms}
                        onChange={(e) => setEditSms(e.target.value)}
                        rows={3}
                        className="w-full resize-y rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm leading-relaxed text-zinc-200 focus:border-zinc-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Action Buttons & Feedback */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 text-emerald-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Draft
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleMarkSent}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
                      >
                        <Send className="h-4 w-4" />
                        Mark as Sent
                      </button>
                    </div>

                    {/* Success Feedback Banners */}
                    {copied && (
                      <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                        Draft copied to clipboard.
                      </div>
                    )}
                    {sentFeedback && (
                      <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
                        Reminder marked as sent.
                      </div>
                    )}
                  </div>

                  {/* Send Email via... */}
                  {selectedInvoice?.clients?.email && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-zinc-400">Send Email via...</p>
                      <div className="flex gap-2">
                        {[
                          { key: 'gmail' as const, label: 'Gmail', color: 'hover:border-red-500/40 hover:bg-red-500/10' },
                          { key: 'outlook' as const, label: 'Outlook', color: 'hover:border-blue-500/40 hover:bg-blue-500/10' },
                          { key: 'default' as const, label: 'Mail App', color: 'hover:border-zinc-500/40 hover:bg-zinc-500/10' },
                        ].map((provider) => (
                          <a
                            key={provider.key}
                            href={buildEmailUrl(
                              provider.key,
                              selectedInvoice.clients!.email!,
                              editSubject,
                              editBody
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2.5 text-xs font-medium text-zinc-300 transition-colors ${provider.color}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            {provider.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
