'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { deleteInvoiceAction, markInvoicePaidAction, updateInvoiceStatusAction } from '@/lib/invoices/actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

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
  const [statusOpen, setStatusOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(invoice.status)
  const [amountPaid, setAmountPaid] = useState('0')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return
    }
    setDeleting(true)
    try {
      const result = await deleteInvoiceAction(invoice.id)
      if (result.success) {
        toast.success('Invoice deleted successfully!')
        router.push('/invoices')
      } else {
        toast.error(result.error || 'Failed to delete invoice')
        setDeleting(false)
      }
    } catch {
      toast.error('Network error occurred during deletion.')
      setDeleting(false)
    }
  }

  async function handleMarkPaid() {
    setMarkingPaid(true)
    try {
      const result = await markInvoicePaidAction(invoice.id)
      if (result.success) {
        toast.success('Invoice marked as paid!')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to mark invoice as paid')
      }
    } catch {
      toast.error('Network connection issue. Failed to update status.')
    } finally {
      setMarkingPaid(false)
    }
  }

  async function handleUpdateStatus() {
    setUpdatingStatus(true)
    try {
      const result = await updateInvoiceStatusAction(invoice.id, selectedStatus, parseFloat(amountPaid) || 0)
      if (result.success) {
        toast.success('Invoice status updated successfully!')
        setStatusOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to update status')
      }
    } catch {
      toast.error('Network error. Failed to save changes.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const isPaid = invoice.status === 'paid'
  const isArchived = invoice.status === 'archived'

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => router.push(`/invoices/${invoice.id}/builder`)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer"
        >
          Open Smart Builder
        </Button>
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
          onClick={() => {
            setSelectedStatus(invoice.status)
            setStatusOpen(true)
          }}
          className="text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer text-xs"
        >
          Change Status
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            toast.info("Preparing PDF download...", {
              description: `Downloading invoice #${invoice.invoice_number} as PDF.`,
              duration: 3000,
            });
            const link = document.createElement('a');
            link.href = `/api/invoices/${invoice.id}/pdf`;
            link.download = `invoice_${invoice.invoice_number}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer text-xs"
        >
          Download PDF
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditOpen(true)}
          className="text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer text-xs"
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

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="due_soon">Due Soon</option>
                <option value="overdue">Overdue</option>
                <option value="promised">Promised to Pay</option>
                <option value="partial">Partial Payment</option>
                <option value="paused">Paused</option>
                <option value="paid">Paid</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            {selectedStatus === 'partial' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="amountPaid">Amount Paid</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="bg-secondary border-border"
                  placeholder="e.g. 500"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} disabled={updatingStatus} className="bg-blue-600 hover:bg-blue-700 text-white">
              {updatingStatus ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
