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
import { toast } from 'sonner'

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
  po_number?: string | null
  tax_rate?: number
  tax_label?: string | null
  discount_amount?: number
  discount_type?: string | null
}

interface DefaultProfile {
  default_currency?: string
  payment_link_default?: string
  default_payment_terms?: string
  default_tax_label?: string | null
  default_tax_rate?: number | null
}

interface InvoiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
  clients: Client[]
  invoice?: Invoice | null
  defaultProfile?: DefaultProfile
}

const CURRENCIES = [
  'USD','EUR','GBP','INR','CAD','AUD','JPY','SGD','CHF','AED','HKD','MYR'
]

export function InvoiceForm({ open, onOpenChange, onSaved, clients, invoice, defaultProfile }: InvoiceFormProps) {

  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [localClients, setLocalClients] = useState(clients)
  const [showClientModal, setShowClientModal] = useState(false)
  const invoiceNumberRef = useRef<HTMLInputElement>(null)

  const [dueDate, setDueDate] = useState('')
  const [paymentTerm, setPaymentTerm] = useState('custom')

  const isEditing = !!invoice

  useEffect(() => {
    if (open) {
      setSelectedClientId(invoice?.client_id ?? '')
      if (invoice?.due_date) {
        setDueDate(invoice.due_date)
        setPaymentTerm('custom')
      } else {
        // Use default payment terms from profile
        const defaultTerms = defaultProfile?.default_payment_terms || 'net_30'
        handleTermChange(defaultTerms)
      }
      // L5: Only auto-fill invoice number if the field is empty to avoid overwriting user input
      if (!isEditing && invoiceNumberRef.current && !invoiceNumberRef.current.value) {
        getNextInvoiceNumberAction().then((res) => {
          // Re-check field is still empty when the async call returns
          if (res.success && invoiceNumberRef.current && !invoiceNumberRef.current.value) {
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
      setDueDate('')
      setPaymentTerm('custom')
    }
  }, [open, invoice, isEditing, defaultProfile])

  function handleTermChange(term: string) {
    setPaymentTerm(term)
    if (term === 'custom') return

    const date = new Date()
    if (term === 'net_15') date.setDate(date.getDate() + 15)
    else if (term === 'net_30') date.setDate(date.getDate() + 30)
    else if (term === 'net_60') date.setDate(date.getDate() + 60)
    
    setDueDate(date.toISOString().split('T')[0])
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDueDate(e.target.value)
    setPaymentTerm('custom')
  }

  // Calculate min and max dates (1 year past to 1 year future)
  const minDate = new Date()
  minDate.setFullYear(minDate.getFullYear() - 1)
  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]
  const maxDateStr = maxDate.toISOString().split('T')[0]

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
      toast.success(isEditing ? 'Invoice saved successfully!' : 'Invoice created successfully!')
      onOpenChange(false)
      onSaved?.()
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] border-border bg-card backdrop-blur-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            {isEditing ? 'Edit Invoice' : 'New Invoice'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isEditing
              ? 'Update the invoice details below.'
              : 'Create a new invoice to track payments and generate reminders.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs font-medium bg-red-500/[0.1] border border-red-500/[0.2] text-red-400 rounded-lg text-center backdrop-blur-md">
              {error}
            </div>
          )}

          {/* Client Select */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">
                Client <span className="text-red-500">*</span>
              </Label>
              <button
                type="button"
                onClick={() => setShowClientModal(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                + Add New Client
              </button>
            </div>
            <Select value={selectedClientId} onValueChange={(val) => setSelectedClientId(val ?? '')} required>
              <SelectTrigger className="h-9 border-border bg-background text-foreground focus:ring-ring/50">
                <SelectValue placeholder="Select a client">
                  {selectedClientId
                    ? localClients.find((c) => c.id === selectedClientId)?.client_name
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="border-border bg-background/95 backdrop-blur-xl">
                {localClients.map((client) => (
                  <SelectItem
                    key={client.id}
                    value={client.id}
                    className="text-foreground focus:bg-accent focus:text-foreground"
                  >
                    {client.client_name}
                    {client.company_name && (
                      <span className="text-muted-foreground ml-1">({client.company_name})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Number & Title */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground" htmlFor="invoiceNumber">
                Invoice Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                ref={invoiceNumberRef}
                required
                defaultValue={invoice?.invoice_number ?? ''}
                placeholder="INV-001"
                className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground" htmlFor="title">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                defaultValue={invoice?.title ?? ''}
                placeholder="Website Redesign"
                className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50"
              />
            </div>
          </div>

          {/* Amount & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-muted-foreground" htmlFor="amount">
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={invoice?.amount ?? ''}
                placeholder="2500.00"
                className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground" htmlFor="currency">
                Currency
              </Label>
              <select
                id="currency"
                name="currency"
                defaultValue={invoice?.currency ?? defaultProfile?.default_currency ?? 'USD'}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring/50 focus:border-border">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Tax Label & Rate */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-muted-foreground" htmlFor="taxLabel">
                Tax Label
              </Label>
              <Input
                id="taxLabel"
                name="taxLabel"
                defaultValue={invoice?.tax_label ?? defaultProfile?.default_tax_label ?? 'Tax'}
                placeholder="GST"
                className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground" htmlFor="taxRate">
                Tax Rate (%)
              </Label>
              <Input
                id="taxRate"
                name="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={invoice?.tax_rate ?? defaultProfile?.default_tax_rate ?? '0'}
                placeholder="18"
                className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50"
              />
            </div>
          </div>

          {/* Discount Amount & Type */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-muted-foreground" htmlFor="discountAmount">
                Discount
              </Label>
              <Input
                id="discountAmount"
                name="discountAmount"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={invoice?.discount_amount ?? '0'}
                placeholder="100.00"
                className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground" htmlFor="discountType">
                Discount Type
              </Label>
              <select
                id="discountType"
                name="discountType"
                defaultValue={invoice?.discount_type ?? 'flat'}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring/50 focus:border-border">
                <option value="flat">Flat</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
          </div>

          {/* Payment Terms & Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Payment Terms</Label>
              <Select value={paymentTerm} onValueChange={(val) => handleTermChange(val ?? 'custom')}>
                <SelectTrigger className="h-9 border-border bg-background text-foreground focus:ring-ring/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-background/95 backdrop-blur-xl">
                  <SelectItem value="receipt" className="text-foreground focus:bg-accent">Due on Receipt</SelectItem>
                  <SelectItem value="net_15" className="text-foreground focus:bg-accent">Net 15</SelectItem>
                  <SelectItem value="net_30" className="text-foreground focus:bg-accent">Net 30</SelectItem>
                  <SelectItem value="net_60" className="text-foreground focus:bg-accent">Net 60</SelectItem>
                  <SelectItem value="custom" className="text-foreground focus:bg-accent">Custom Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground" htmlFor="dueDate">
                Due Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                required
                value={dueDate}
                onChange={handleDateChange}
                min={minDateStr}
                max={maxDateStr}
                className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground" htmlFor="description">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={invoice?.description ?? ''}
              placeholder="Brief description of work or services..."
              rows={2}
              className="border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50 resize-none"
            />
          </div>

          {/* PO Number */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground" htmlFor="poNumber">
              PO Number <span className="text-muted-foreground/60 text-xs">(optional)</span>
            </Label>
            <Input
              id="poNumber"
              name="poNumber"
              defaultValue={invoice?.po_number ?? ''}
              placeholder="PO-2024-001"
              className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50"
            />
          </div>

          {/* Payment Link */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground" htmlFor="paymentLink">
              Payment Link
            </Label>
            <Input
              id="paymentLink"
              name="paymentLink"
              type="url"
              defaultValue={invoice?.payment_link ?? (defaultProfile?.payment_link_default ?? '')}
              placeholder="https://stripe.com/pay/..."
              className="h-9 border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground" htmlFor="notes">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={invoice?.notes ?? ''}
              placeholder="Internal notes..."
              rows={2}
              className="border-border bg-background text-foreground focus-visible:border-border focus-visible:ring-ring/50 resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-black text-white hover:bg-secondary hover:text-foreground border border-border cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedClientId}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
