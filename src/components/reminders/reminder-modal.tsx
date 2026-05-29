'use client'

import React, { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { generateReminderAction, logReminderEventAction } from '@/lib/reminders/actions'
import { toast } from 'sonner'

type Tone = 'friendly' | 'professional' | 'firm' | 'final_notice'

interface ReminderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId: string
  invoiceNumber: string
  clientEmail?: string | null
  amount: number
  currency: string
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
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

const TONE_OPTIONS: { value: Tone; label: string; description: string }[] = [
  {
    value: 'friendly',
    label: 'Friendly',
    description: 'Soft, warm poke. Assumes they simply forgot.',
  },
  {
    value: 'professional',
    label: 'Professional',
    description: 'Standard business-appropriate reminder.',
  },
  {
    value: 'firm',
    label: 'Firm',
    description: 'Urgent, direct, sets clear expectations.',
  },
  {
    value: 'final_notice',
    label: 'Final Notice',
    description: 'Direct final warning before further action.',
  },
]

export function ReminderModal({ open, onOpenChange, invoiceId, invoiceNumber, clientEmail, amount, currency }: ReminderModalProps) {
  const [tone, setTone] = useState<Tone>('professional')
  const [customInstructions, setCustomInstructions] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Draft state
  const [draft, setDraft] = useState<{ id: string; subject: string; body: string } | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editedBody, setEditedBody] = useState('')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [markingSent, setMarkingSent] = useState(false)

  function handleClose(open: boolean) {
    if (!open) {
      setDraft(null)
      setError(null)
      setEditMode(false)
      setEditedBody('')
      setCopiedField(null)
      setCustomInstructions('')
    }
    onOpenChange(open)
  }

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    setDraft(null)

    const result = await generateReminderAction(invoiceId, tone, customInstructions || undefined)

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setDraft(result.data)
      setEditedBody(result.data.body)
    }
    setGenerating(false)
  }

  async function handleCopy(field: 'subject' | 'body', text: string) {
    await navigator.clipboard.writeText(text)
    toast.success('AI Reminder draft copied to clipboard!')
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)

    // Log copy event silently
    if (draft) {
      await logReminderEventAction(invoiceId, 'draft_copied', draft.id, `Copied ${field} to clipboard`)
    }
  }

  async function handleMarkSent() {
    if (!draft) return
    setMarkingSent(true)

    await logReminderEventAction(
      invoiceId,
      'marked_sent',
      draft.id,
      `Reminder marked as sent for Invoice ${invoiceNumber}`
    )

    setMarkingSent(false)
    handleClose(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] border-border bg-[#0a0a0a] backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            {draft ? 'Reminder Draft' : 'Generate Reminder'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {draft
              ? `AI-generated ${tone} reminder for Invoice ${invoiceNumber}`
              : `Create an AI-drafted follow-up for Invoice ${invoiceNumber}`}
          </DialogDescription>
        </DialogHeader>

        {!draft ? (
          /* Tone Selection & Generate */
          <div className="space-y-5 pt-2">
            {error && (
              <div className="p-3 text-xs font-medium bg-red-500/[0.1] border border-red-500/[0.2] text-red-400 rounded-lg text-center backdrop-blur-md">
                {error}
              </div>
            )}

            {/* Tone Selector */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Select Tone</Label>
              <div className="grid grid-cols-2 gap-2">
                {TONE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTone(option.value)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      tone === option.value
                        ? 'border-neutral-600 bg-accent/80'
                        : 'border-border/60 bg-secondary/30 hover:bg-card/50'
                    }`}
                  >
                    <p className={`text-sm font-medium ${tone === option.value ? 'text-foreground' : 'text-foreground/80'}`}>
                      {option.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Instructions */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-sm">
                Custom Instructions <span className="text-muted-foreground/60">(optional)</span>
              </Label>
              <Textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g., Mention the updated bank details, keep it under 3 sentences..."
                rows={3}
                className="border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus-visible:border-border focus-visible:ring-ring/50 resize-none text-sm"
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
                  AI is crafting your reminder...
                </span>
              ) : (
                'Generate Draft'
              )}
            </Button>
          </div>
        ) : (
          /* Draft Display */
          <div className="space-y-4 pt-2">
            {/* Prominent Amount & Currency Banner */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-blue-900/50 bg-blue-950/20">
              <div>
                <p className="text-xs text-blue-400 font-medium mb-1">Total Outstanding</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(amount, currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Invoice</p>
                <p className="text-sm font-medium text-foreground/80">{invoiceNumber}</p>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-sm">Subject</Label>
                <button
                  type="button"
                  onClick={() => handleCopy('subject', draft.subject)}
                  className="text-xs text-muted-foreground hover:text-foreground/80 transition-colors cursor-pointer"
                >
                  {copiedField === 'subject' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="p-3 rounded-lg border border-border/60 bg-card/40">
                <p className="text-sm text-foreground">{draft.subject}</p>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-sm">Email Body</Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (editMode) {
                        setDraft({ ...draft, body: editedBody })
                      }
                      setEditMode(!editMode)
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground/80 transition-colors cursor-pointer"
                  >
                    {editMode ? 'Save' : 'Edit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy('body', editMode ? editedBody : draft.body)}
                    className="text-xs text-muted-foreground hover:text-foreground/80 transition-colors cursor-pointer"
                  >
                    {copiedField === 'body' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              {editMode ? (
                <Textarea
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  rows={10}
                  className="border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50 resize-none text-sm leading-relaxed"
                />
              ) : (
                <div className="p-3.5 rounded-lg border border-border/60 bg-card/40 max-h-[320px] overflow-y-auto">
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                    {draft.body}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={handleMarkSent}
                disabled={markingSent}
                className="flex-1 h-9 bg-green-600 text-white hover:bg-green-700 font-medium text-sm cursor-pointer disabled:opacity-50"
              >
                {markingSent ? 'Marking...' : 'Mark as Sent'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setDraft(null)
                  setError(null)
                  setEditMode(false)
                }}
                className="h-9 text-muted-foreground hover:text-foreground hover:bg-accent text-sm cursor-pointer"
              >
                New Draft
              </Button>
            </div>

            {/* Send Email via... */}
            {clientEmail && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Send Email via...</p>
                <div className="flex gap-2">
                  {[
                    { key: 'gmail' as const, label: 'Gmail', color: 'hover:border-red-500/40 hover:bg-red-500/10' },
                    { key: 'outlook' as const, label: 'Outlook', color: 'hover:border-blue-500/40 hover:bg-blue-500/10' },
                    { key: 'default' as const, label: 'Mail App', color: 'hover:border-border/40 hover:bg-neutral-500/10' },
                  ].map((provider) => (
                    <a
                      key={provider.key}
                      href={buildEmailUrl(
                        provider.key,
                        clientEmail,
                        draft.subject,
                        editMode ? editedBody : draft.body
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2.5 text-xs font-medium text-foreground/80 transition-colors ${provider.color}`}
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
      </DialogContent>
    </Dialog>
  )
}
