'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ReminderModal } from '@/components/reminders/reminder-modal'
import { ActivityTimeline } from '@/components/reminders/activity-timeline'

interface ActivityEvent {
  id: string
  event_type: string
  description: string | null
  created_at: string
  invoice_number: string | null
  invoice_title: string | null
}

interface InvoiceReminderSectionProps {
  invoiceId: string
  invoiceNumber: string
  initialEvents: ActivityEvent[]
  variant?: 'timeline' | 'cta'
  clientEmail?: string | null
  amount: number
  currency: string
}

export function InvoiceReminderSection({
  invoiceId,
  invoiceNumber,
  initialEvents,
  variant = 'timeline',
  clientEmail,
  amount,
  currency,
}: InvoiceReminderSectionProps) {
  const searchParams = useSearchParams()
  const autoReminder = searchParams?.get('reminder') === 'true'
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (autoReminder && variant === 'cta') {
      setModalOpen(true)
    }
  }, [autoReminder, variant])

  if (variant === 'cta') {
    return (
      <>
        <Card className="border-border bg-card shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          <CardContent className="py-5 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent/80 border border-border mb-3">
              <span className="text-sm text-muted-foreground">AI</span>
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">Generate Reminder</h3>
            <p className="text-xs text-muted-foreground mb-4">
              AI-drafted follow-up emails calibrated to the right tone.
            </p>
            <Button
              onClick={() => setModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm cursor-pointer"
            >
              Generate Reminder
            </Button>
          </CardContent>
        </Card>

        <ReminderModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          invoiceId={invoiceId}
          invoiceNumber={invoiceNumber}
          clientEmail={clientEmail}
          amount={amount}
          currency={currency}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div />
        <Button
          size="sm"
          onClick={() => setModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs cursor-pointer h-7 px-3"
        >
          + Generate Reminder
        </Button>
      </div>

      <ActivityTimeline events={initialEvents} />

      <ReminderModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        clientEmail={clientEmail}
        amount={amount}
        currency={currency}
      />
    </>
  )
}
