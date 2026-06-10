'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Trash2, Save, ArrowLeft } from 'lucide-react'
import { updateInvoiceAction } from '@/lib/invoices/actions'
import { LivePdfPreview } from '@/components/invoices/live-pdf-preview'
import { toast } from 'sonner'

const inputStyles = "bg-card/50 border border-white/[0.08] rounded-lg px-4 py-2.5 text-foreground placeholder-zinc-500 transition-all focus-visible:ring-1 focus-visible:ring-white/[0.15] focus-visible:border-white/[0.1]"
const cardStyles = "bg-background/40 backdrop-blur-md border border-white/[0.05] rounded-xl p-6 mb-6 shadow-2xl"

import { Invoice, LineItem } from '@/types/invoice'
import { Client } from '@/types/client'
import { UserProfile } from '@/types/settings'

interface BuilderLineItem {
  id: string
  name: string
  description?: string
  quantity: number
  rate: number
  total: number
}

interface SmartBuilderProps {
  invoice: Invoice
  client: Client | null
  profile: UserProfile | null
  allClients: Client[]
}

export default function SmartBuilderClient({ invoice, client, profile, allClients }: SmartBuilderProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  
  // Local state for all fields to feed the live preview
  const [formData, setFormData] = useState({
    clientId: invoice.client_id || '',
    invoiceNumber: invoice.invoice_number || '',
    title: invoice.title || '',
    description: invoice.description || '',
    currency: invoice.currency || 'USD',
    dueDate: invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : '',
    notes: invoice.notes || '',
    paymentLink: invoice.payment_link || '',
    poNumber: invoice.po_number || '',
    taxRate: invoice.tax_rate !== undefined ? invoice.tax_rate : (profile?.default_tax_rate || 0),
    taxLabel: invoice.tax_label || (profile?.default_tax_label || 'Tax'),
    discountAmount: invoice.discount_amount || 0,
    discountType: invoice.discount_type || 'flat',
    lineItems: invoice.line_items && invoice.line_items.length > 0
      ? (invoice.line_items as unknown as BuilderLineItem[]).map((item) => ({ ...item, id: item.id || crypto.randomUUID() }))
      : [{ id: crypto.randomUUID(), name: invoice.title || '', description: invoice.description || '', quantity: 1, rate: invoice.amount || 0, total: invoice.amount || 0 }] as BuilderLineItem[]
  })

  // We still need to pass client and profile data to the PDF.
  // Profile is mostly static but let's allow passing it cleanly.
  const [localProfile] = useState(profile)
  const [localClient, setLocalClient] = useState(client)
  const [paymentTerm, setPaymentTerm] = useState(profile?.default_payment_terms || 'net_30')

  const handleTermChange = (term: string) => {
    setPaymentTerm(term)
    if (term === 'custom') return

    const date = new Date()
    if (term === 'receipt') {
      // Due on receipt (today)
    } else if (term === 'net_15') {
      date.setDate(date.getDate() + 15)
    } else if (term === 'net_30') {
      date.setDate(date.getDate() + 30)
    } else if (term === 'net_60') {
      date.setDate(date.getDate() + 60)
    }
    
    setFormData(prev => ({
      ...prev,
      dueDate: date.toISOString().split('T')[0]
    }))
  }

  const handleClientChange = (clientId: string | null) => {
    if (!clientId) return
    const selected = allClients.find((c) => c.id === clientId)
    if (selected) {
      setLocalClient(selected)
      setFormData(prev => ({ ...prev, clientId }))
    }
  }

  const updateLineItem = (index: number, field: keyof BuilderLineItem, value: string | number) => {
    const newItems = [...formData.lineItems]
    newItems[index] = { ...newItems[index], [field]: value }
    // Recalculate total if quantity or rate changes
    if (field === 'quantity' || field === 'rate') {
      const qty = parseFloat(newItems[index].quantity as unknown as string) || 0
      const rate = parseFloat(newItems[index].rate as unknown as string) || 0
      newItems[index].total = qty * rate
    }
    setFormData({ ...formData, lineItems: newItems })
  }

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { id: crypto.randomUUID(), name: '', description: '', quantity: 1, rate: 0, total: 0 }]
    })
    toast.success("Line item added", { duration: 1500 })
  }

  const removeLineItem = (index: number) => {
    const newItems = formData.lineItems.filter((_, i: number) => i !== index)
    setFormData({ ...formData, lineItems: newItems })
    toast.warning("Line item removed", { duration: 1500 })
  }

  const subtotal = useMemo(() => {
    return formData.lineItems.reduce((sum: number, item) => sum + (item.total || 0), 0)
  }, [formData.lineItems])

  const discountVal = useMemo(() => {
    const rate = Number(formData.discountAmount) || 0
    if (formData.discountType === 'percentage') {
      return (subtotal * rate) / 100
    }
    return rate
  }, [subtotal, formData.discountAmount, formData.discountType])

  const taxableAmount = useMemo(() => {
    return Math.max(0, subtotal - discountVal)
  }, [subtotal, discountVal])

  const taxVal = useMemo(() => {
    const rate = Number(formData.taxRate) || 0
    return (taxableAmount * rate) / 100
  }, [taxableAmount, formData.taxRate])

  const grandTotal = useMemo(() => {
    return taxableAmount + taxVal
  }, [taxableAmount, taxVal])

  const uniqueClients = useMemo(() => {
    // Just use allClients, do not deduplicate by name as it breaks UUID matching
    return allClients;
  }, [allClients]);

  const handleSave = async (statusOverride?: 'draft' | 'sent') => {
    setIsSaving(true)
    
    const savePromise = new Promise(async (resolve, reject) => {
      try {
        const form = new FormData()
        form.append('clientId', formData.clientId)
        form.append('invoiceNumber', formData.invoiceNumber)
        form.append('title', formData.title)
        form.append('description', formData.description)
        form.append('amount', grandTotal.toString())
        form.append('currency', formData.currency)
        form.append('dueDate', formData.dueDate)
        form.append('notes', formData.notes)
        form.append('paymentLink', formData.paymentLink)
        form.append('poNumber', formData.poNumber)
        form.append('lineItems', JSON.stringify(formData.lineItems))
        form.append('taxRate', formData.taxRate.toString())
        form.append('taxLabel', formData.taxLabel)
        form.append('discountAmount', formData.discountAmount.toString())
        form.append('discountType', formData.discountType)
        
        const statusToSave = statusOverride || invoice.status
        if (statusToSave === 'draft' || statusToSave === 'sent') {
          form.append('status', statusToSave)
        }

        const result = await updateInvoiceAction(invoice.id, form)
        
        if (result.error) {
          reject(new Error(result.error))
        } else {
          resolve(result)
        }
      } catch (e) {
        reject(e)
      }
    })

    toast.promise(savePromise, {
      loading: 'Saving invoice changes...',
      success: () => {
        setTimeout(() => router.push(`/invoices/${invoice.id}`), 600)
        return 'Invoice saved successfully!'
      },
      error: (err) => err.message || 'An unexpected error occurred'
    })

    try {
      await savePromise
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  const previewInvoice = {
    invoice_number: formData.invoiceNumber || invoice.invoice_number,
    title: formData.title || invoice.title || '',
    description: formData.description || invoice.description || '',
    amount: grandTotal,
    currency: formData.currency,
    due_date: formData.dueDate || invoice.due_date || new Date().toISOString(),
    notes: formData.notes || invoice.notes || '',
    payment_link: formData.paymentLink || invoice.payment_link || '',
    created_at: invoice.created_at || new Date().toISOString(),
    po_number: formData.poNumber || invoice.po_number || '',
    tax_rate: Number(formData.taxRate) || 0,
    tax_label: formData.taxLabel || 'Tax',
    discount_amount: Number(formData.discountAmount) || 0,
    discount_type: formData.discountType,
    line_items: formData.lineItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      quantity: Number(item.quantity) || 0,
      rate: Number(item.rate) || 0,
      total: Number(item.total) || 0
    }))
  }

  return (
    <div className="flex flex-col lg:flex-row items-start gap-8 pb-12">
      
      {/* Left Pane - Form Builder */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6 pt-2 px-1">
        
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4 w-full bg-card/30 p-3 rounded-xl border border-white/[0.05]">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/invoices/${invoice.id}`)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Details
          </Button>
          <div className="flex items-center gap-2">
            {(invoice.status === 'draft' || !invoice.id) ? (
              <>
                <Button 
                  onClick={() => handleSave('draft')} 
                  disabled={isSaving} 
                  variant="outline"
                  className="border-border hover:bg-secondary text-foreground/80 cursor-pointer h-9 px-3 text-xs"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Save as Draft
                </Button>
                <Button 
                  onClick={() => handleSave('sent')} 
                  disabled={isSaving} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer h-9 px-3 text-xs"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                  Save & Mark as Sent
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => handleSave()} 
                disabled={isSaving} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer h-9 px-3 text-xs"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                Save Changes
              </Button>
            )}
          </div>
        </div>

        {/* FROM Section */}
        <div className={cardStyles}>
          <div className="pb-4">
            <h3 className="text-sm text-muted-foreground font-medium tracking-wide uppercase">From (Your Details)</h3>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-2">These details are pulled from your profile settings.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Company Name</Label>
                <Input value={localProfile?.company_name || localProfile?.full_name || ''} disabled className={inputStyles} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Email</Label>
                <Input value={localProfile?.email || ''} disabled className={inputStyles} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Address</Label>
                <Input value={localProfile?.company_address || ''} disabled className={inputStyles} />
              </div>
            </div>
          </div>
        </div>

        {/* TO Section */}
        <div className={cardStyles}>
          <div className="pb-4">
            <h3 className="text-sm text-muted-foreground font-medium tracking-wide uppercase">To (Client Details)</h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label className="text-[13px] font-medium text-muted-foreground/80 mb-1.5 block">Select Client</Label>
              <Select value={formData.clientId} onValueChange={handleClientChange}>
                <SelectTrigger className={inputStyles}>
                  <SelectValue placeholder="Select a client">
                    {localClient ? (localClient.company_name ? `${localClient.company_name} (${localClient.client_name})` : localClient.client_name) : "Select a client"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-secondary border border-white/[0.08] rounded-lg shadow-xl">
                  {uniqueClients.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-foreground focus:bg-accent focus:text-white">
                      {c.company_name ? `${c.company_name} (${c.client_name})` : c.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {localClient && (
              <div className="p-4 bg-secondary/40 rounded-lg border border-white/[0.05] text-sm text-foreground/80 space-y-1.5">
                <p><span className="text-muted-foreground">Name:</span> {localClient.client_name}</p>
                {localClient.email && <p><span className="text-muted-foreground">Email:</span> {localClient.email}</p>}
                {localClient.company_name && <p><span className="text-muted-foreground">Company:</span> {localClient.company_name}</p>}
              </div>
            )}
          </div>
        </div>

        {/* INVOICE DETAILS Section */}
        <div className={cardStyles}>
          <div className="pb-4">
            <h3 className="text-sm text-muted-foreground font-medium tracking-wide uppercase">Invoice Details</h3>
          </div>
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Invoice Number</Label>
                <Input 
                  value={formData.invoiceNumber} 
                  onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})} 
                  className={inputStyles} 
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">PO Number (Optional)</Label>
                <Input 
                  value={formData.poNumber} 
                  onChange={(e) => setFormData({...formData, poNumber: e.target.value})} 
                  className={inputStyles} 
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Payment Terms</Label>
                <Select value={paymentTerm} onValueChange={(val) => { if (val) handleTermChange(val) }}>
                  <SelectTrigger className={inputStyles}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-secondary border border-white/[0.08] rounded-lg shadow-xl">
                    <SelectItem value="receipt" className="text-foreground focus:bg-accent">Due on Receipt</SelectItem>
                    <SelectItem value="net_15" className="text-foreground focus:bg-accent">Net 15</SelectItem>
                    <SelectItem value="net_30" className="text-foreground focus:bg-accent">Net 30</SelectItem>
                    <SelectItem value="net_60" className="text-foreground focus:bg-accent">Net 60</SelectItem>
                    <SelectItem value="custom" className="text-foreground focus:bg-accent">Custom Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Due Date</Label>
                <Input 
                  type="date"
                  value={formData.dueDate} 
                  onChange={(e) => {
                    setFormData({...formData, dueDate: e.target.value})
                    setPaymentTerm('custom')
                  }} 
                  className={inputStyles} 
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Currency</Label>
                <Select 
                  value={formData.currency || 'USD'} 
                  onValueChange={(val) => setFormData({...formData, currency: val || 'USD'})}
                >
                  <SelectTrigger className={inputStyles}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-secondary border border-white/[0.08] rounded-lg shadow-xl">
                    {['USD','EUR','GBP','INR','CAD','AUD','JPY','SGD','CHF','AED','HKD','MYR'].map((c) => (
                      <SelectItem key={c} value={c} className="text-foreground focus:bg-accent focus:text-white">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Main Title (Optional)</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g. Website Redesign"
                className={inputStyles} 
              />
            </div>
          </div>
        </div>

        {/* LINE ITEMS Section */}
        <div className={cardStyles}>
          <div className="pb-4 flex flex-row items-center justify-between">
            <h3 className="text-sm text-muted-foreground font-medium tracking-wide uppercase">Line Items</h3>
          </div>
          <div className="space-y-4">
            {formData.lineItems.map((item, idx: number) => (
              <div key={item.id} className="p-4 bg-secondary/30 rounded-xl border border-white/[0.05] relative group">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-accent text-muted-foreground hover:text-red-400 hover:bg-accent opacity-0 group-hover:opacity-100 transition-all shadow-md"
                  onClick={() => removeLineItem(idx)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 sm:col-span-5">
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Item Name</Label>
                    <Input value={item.name} onChange={(e) => updateLineItem(idx, 'name', e.target.value)} className={inputStyles} />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Qty</Label>
                    <Input type="number" value={item.quantity} onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)} className={inputStyles} />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Rate</Label>
                    <Input type="number" value={item.rate} onChange={(e) => updateLineItem(idx, 'rate', e.target.value)} className={inputStyles} />
                  </div>
                  <div className="col-span-4 sm:col-span-3">
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Total</Label>
                    <div className="h-[46px] flex items-center px-4 bg-secondary/80 border border-white/[0.05] rounded-lg text-sm font-medium text-foreground/80">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(item.total)}
                    </div>
                  </div>
                  <div className="col-span-12">
                    <Input 
                      placeholder="Optional description" 
                      value={item.description} 
                      onChange={(e) => updateLineItem(idx, 'description', e.target.value)} 
                      className={`${inputStyles} border-dashed bg-transparent mt-2 h-10`} 
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <Button 
              className="bg-secondary border border-white/[0.1] text-foreground hover:bg-accent/80 transition-all rounded-lg px-4 py-2 w-full mt-4" 
              onClick={addLineItem}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
            
            {/* Tax & Discount section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5 mt-5 border-t border-white/[0.05]">
              {/* Discount inputs */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground block">Discount</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={formData.discountAmount || ''} 
                    onChange={(e) => setFormData({...formData, discountAmount: parseFloat(e.target.value) || 0})}
                    className={`${inputStyles} flex-1`}
                  />
                  <Select 
                    value={formData.discountType || 'flat'} 
                    onValueChange={(val) => setFormData({...formData, discountType: val as 'flat' | 'percentage'})}
                  >
                    <SelectTrigger className="w-[100px] bg-secondary border border-white/[0.08] text-foreground rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-secondary border border-white/[0.08] rounded-lg">
                      <SelectItem value="flat" className="text-foreground focus:bg-accent">Flat</SelectItem>
                      <SelectItem value="percentage" className="text-foreground focus:bg-accent">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tax inputs */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground block">Tax / GST / VAT</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Tax Label (e.g. GST)" 
                    value={formData.taxLabel} 
                    onChange={(e) => setFormData({...formData, taxLabel: e.target.value})}
                    className={`${inputStyles} flex-1`}
                  />
                  <Input 
                    type="number" 
                    placeholder="Rate (%)" 
                    value={formData.taxRate || ''} 
                    onChange={(e) => setFormData({...formData, taxRate: parseFloat(e.target.value) || 0})}
                    className={`${inputStyles} w-[100px]`}
                  />
                </div>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="flex flex-col items-end gap-2 pt-4 mt-4 border-t border-white/[0.05]">
              <div className="flex justify-between w-full sm:w-[300px] text-sm text-muted-foreground">
                <span>Subtotal:</span>
                <span className="font-mono text-foreground">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(subtotal)}
                </span>
              </div>
              {discountVal > 0 && (
                <div className="flex justify-between w-full sm:w-[300px] text-sm text-muted-foreground">
                  <span>Discount ({formData.discountType === 'percentage' ? `${formData.discountAmount}%` : 'Flat'}):</span>
                  <span className="font-mono text-emerald-400">
                    -{new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(discountVal)}
                  </span>
                </div>
              )}
              {taxVal > 0 && (
                <div className="flex justify-between w-full sm:w-[300px] text-sm text-muted-foreground">
                  <span>{formData.taxLabel} ({formData.taxRate}%):</span>
                  <span className="font-mono text-foreground">
                    +{new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(taxVal)}
                  </span>
                </div>
              )}
              <div className="flex justify-between w-full sm:w-[300px] pt-2 border-t border-white/[0.08] text-base font-semibold text-white">
                <span>Total Due:</span>
                <span className="font-mono text-lg tracking-tight">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PAYMENT INFO Section */}
        <div className={cardStyles}>
          <div className="pb-4">
            <h3 className="text-sm text-muted-foreground font-medium tracking-wide uppercase">Payment Info & Notes</h3>
          </div>
          <div className="space-y-5">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Payment Link (Optional)</Label>
              <Input 
                value={formData.paymentLink} 
                onChange={(e) => setFormData({...formData, paymentLink: e.target.value})} 
                placeholder="https://buy.stripe.com/..."
                className={inputStyles} 
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Notes for Client</Label>
              <Textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                placeholder="Thank you for your business!"
                className={`${inputStyles} resize-none`} 
                rows={3}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Right Pane - Live Preview */}
      <div className="w-full lg:w-1/2 lg:sticky lg:top-4 h-[600px] lg:h-[calc(100vh-2rem)]">
        <div className="bg-background/40 backdrop-blur-md rounded-xl border border-white/[0.05] overflow-hidden h-full flex flex-col shadow-2xl">
          <div className="px-5 py-4 bg-card/50 border-b border-white/[0.05] flex items-center justify-between">
            <h3 className="text-sm font-medium tracking-wide text-foreground">Live PDF Preview</h3>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          </div>
          <div className="flex-1 overflow-y-auto scroll-smooth bg-secondary/20">
            <LivePdfPreview 
              invoice={previewInvoice}
              client={{
                client_name: localClient?.client_name || 'Unnamed Client',
                email: localClient?.email || null,
                company_name: localClient?.company_name || null
              }}
              profile={{
                full_name: localProfile?.full_name || null,
                email: localProfile?.email || null,
                company_name: localProfile?.company_name || null,
                company_address: localProfile?.company_address || null,
                company_website: localProfile?.company_website || null,
                tax_id: localProfile?.tax_id || null,
                logo_url: localProfile?.logo_url || null,
                bank_details: localProfile?.bank_details || null,
                global_rules: localProfile?.global_rules ? (localProfile.global_rules as Record<string, string>) : null
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
