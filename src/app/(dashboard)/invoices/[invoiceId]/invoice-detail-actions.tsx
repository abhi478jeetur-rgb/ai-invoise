'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { deleteInvoiceAction, markInvoicePaidAction } from '@/lib/invoices/actions'

interface InvoiceDetailActionsProps {
  invoice: {
    id: string
    client_id: string
    invoice_number: string
    title: string | null
    description: string | null
    amount: number
    currency: string
    status: string
    due_date: string
    notes: string | null
    payment_link: string | null
  }
}

export function InvoiceDetailActions({ invoice }: InvoiceDetailActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return
    }
    setDeleting(true)
    const result = await deleteInvoiceAction(invoice.id)
    if (result.success) {
      router.push('/invoices')
    } else {
      setDeleting(false)
    }
  }

  async function handleMarkPaid() {
    setMarkingPaid(true)
    const result = await markInvoicePaidAction(invoice.id)
    if (result.success) {
      router.refresh()
    }
    setMarkingPaid(false)
  }

  const isPaid = invoice.status === 'paid'
  const isArchived = invoice.status === 'archived'

  return (
    <>
      <div className="flex items-center gap-2">
        {!isPaid && !isArchived && (
          <Button
            size="sm"
            onClick={handleMarkPaid}
            disabled={markingPaid}
            className="bg-[#10b981] hover:bg-[#10b981]/90 text-neutral-950 font-semibold text-xs cursor-pointer disabled:opacity-50"
          >
            {markingPaid ? 'Marking...' : 'Mark Paid'}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditOpen(true)}
          className="text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 cursor-pointer text-xs"
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="text-red-400 hover:text-red-300 hover:bg-red-950/30 cursor-pointer text-xs disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>

      <InvoiceForm
        open={editOpen}
        onOpenChange={setEditOpen}
        clients={[{
          id: invoice.client_id,
          client_name: '',
          email: null,
          company_name: null,
        }]}
        invoice={invoice}
        onSaved={() => router.refresh()}
      />
    </>
  )
}
