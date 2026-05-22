'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createInvoiceAction, updateInvoiceAction, getNextInvoiceNumberAction } from '@/lib/invoices/actions'
import { ClientForm } from '@/components/clients/client-form'

interface Client {
  id: string
  client_name: string
  email: string | null
  company_name: string | null
}

interface Invoice {
  id: string
  client_id: string
  invoice_number: string
  title: string | null
  description: string | null
  amount: number
  currency: string
  due_date: string
  notes: string | null
  payment_link: string | null
}

interface InvoiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
  clients: Client[]
  invoice?: Invoice | null
}

export function InvoiceForm({ open, onOpenChange, onSaved, clients, invoice }: InvoiceFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [localClients, setLocalClients] = useState(clients)
  const [showClientModal, setShowClientModal] = useState(false)
  const invoiceNumberRef = useRef<HTMLInputElement>(null)

  const isEditing = !!invoice

  useEffect(() => {
    if (open) {
      setSelectedClientId(invoice?.client_id ?? '')
      if (!isEditing) {
        getNextInvoiceNumberAction().then((res) => {
          if (res.success && invoiceNumberRef.current) {
            invoiceNumberRef.current.value = res.data
          }
        })
      }
    } else {
      setError(null)
      setLoading(false)
      setSelectedClientId('')
      setLocalClients(clients)
      setShowClientModal(false)
    }
  }, [open, invoice, isEditing])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set('clientId', selectedClientId)

    const result = isEditing
      ? await updateInvoiceAction(invoice!.id, formData)
      : await createInvoiceAction(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onOpenChange(false)
      onSaved?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] border-neutral-800 bg-[#0a0a0a] backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-neutral-100">
            {isEditing ? 'Edit Invoice' : 'New Invoice'}
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-500">
            {isEditing
              ? 'Update the invoice details below.'
              : 'Create a new invoice to track payments and generate reminders.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs font-medium bg-red-950/30 border border-red-900/50 text-red-400 rounded-lg text-center">
              {error}
            </div>
          )}

          {/* Client Select */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-neutral-400">
                Client <span className="text-red-500">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setShowClientModal(true)}
                className="text-xs text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                + Add New Client
              </button>
            </div>
            <Select value={selectedClientId} onValueChange={(val) => setSelectedClientId(val ?? '')} required>
              <SelectTrigger className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus:ring-neutral-700/50">
                <SelectValue placeholder="Select a client">
                  {selectedClientId
                    ? localClients.find((c) => c.id === selectedClientId)?.client_name
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-neutral-800 bg-neutral-950/95 backdrop-blur-xl">
                {localClients.map((client) => (
                  <SelectItem
                    key={client.id}
                    value={client.id}
                    className="text-neutral-200 focus:bg-neutral-800 focus:text-neutral-100"
                  >
                    {client.client_name}
                    {client.company_name && (
                      <span className="text-neutral-500 ml-1">({client.company_name})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Number & Title */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-neutral-400" htmlFor="invoiceNumber">
                Invoice Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                ref={invoiceNumberRef}
                required
                defaultValue={invoice?.invoice_number ?? ''}
                placeholder="INV-001"
                className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-neutral-400" htmlFor="title">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                defaultValue={invoice?.title ?? ''}
                placeholder="Website Redesign"
                className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
              />
            </div>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-neutral-400" htmlFor="amount">
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                required
                defaultValue={invoice?.amount ?? ''}
                placeholder="2500.00"
                className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-neutral-400" htmlFor="currency">
                Currency
              </Label>
              <Input
                id="currency"
                name="currency"
                defaultValue={invoice?.currency ?? 'USD'}
                placeholder="USD"
                className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label className="text-neutral-400" htmlFor="dueDate">
              Due Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              required
              defaultValue={invoice?.due_date ?? ''}
              className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-neutral-400" htmlFor="description">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={invoice?.description ?? ''}
              placeholder="Brief description of work or services..."
              rows={2}
              className="border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50 resize-none"
            />
          </div>

          {/* Payment Link */}
          <div className="space-y-1.5">
            <Label className="text-neutral-400" htmlFor="paymentLink">
              Payment Link
            </Label>
            <Input
              id="paymentLink"
              name="paymentLink"
              type="url"
              defaultValue={invoice?.payment_link ?? ''}
              placeholder="https://stripe.com/pay/..."
              className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-neutral-400" htmlFor="notes">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={invoice?.notes ?? ''}
              placeholder="Internal notes..."
              rows={2}
              className="border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50 resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedClientId}
              className="bg-white text-black hover:bg-neutral-200 font-medium text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? isEditing ? 'Saving...' : 'Creating...'
                : isEditing ? 'Save Changes' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <ClientForm
        open={showClientModal}
        onOpenChange={setShowClientModal}
        onSaved={(newClient) => {
          if (newClient) {
            setLocalClients((prev) => [...prev, newClient])
            setSelectedClientId(newClient.id)
            router.refresh()
          }
        }}
      />
    </Dialog>
  )
}
