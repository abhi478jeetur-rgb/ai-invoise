'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Trash2, Save, ArrowLeft } from 'lucide-react'
import { updateInvoiceAction } from '@/lib/invoices/actions'
import { LivePdfPreview } from '@/components/invoices/live-pdf-preview'

export default function SmartBuilderClient({ invoice, client, profile, allClients }: any) {
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
    lineItems: invoice.line_items && invoice.line_items.length > 0 ? invoice.line_items : [
      { name: invoice.title || '', description: invoice.description || '', quantity: 1, rate: invoice.amount || 0, total: invoice.amount || 0 }
    ]
  })

  // We still need to pass client and profile data to the PDF.
  // Profile is mostly static but let's allow passing it cleanly.
  const [localProfile] = useState(profile)
  const [localClient, setLocalClient] = useState(client)

  const handleClientChange = (clientId: string) => {
    const selected = allClients.find((c: any) => c.id === clientId)
    if (selected) {
      setLocalClient(selected)
      setFormData(prev => ({ ...prev, clientId }))
    }
  }

  const updateLineItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.lineItems]
    newItems[index] = { ...newItems[index], [field]: value }
    // Recalculate total if quantity or rate changes
    if (field === 'quantity' || field === 'rate') {
      const qty = parseFloat(newItems[index].quantity) || 0
      const rate = parseFloat(newItems[index].rate) || 0
      newItems[index].total = qty * rate
    }
    setFormData({ ...formData, lineItems: newItems })
  }

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { name: '', description: '', quantity: 1, rate: 0, total: 0 }]
    })
  }

  const removeLineItem = (index: number) => {
    const newItems = formData.lineItems.filter((_: any, i: number) => i !== index)
    setFormData({ ...formData, lineItems: newItems })
  }

  const totalAmount = useMemo(() => {
    return formData.lineItems.reduce((sum: number, item: any) => sum + (parseFloat(item.total) || 0), 0)
  }, [formData.lineItems])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const form = new FormData()
      form.append('clientId', formData.clientId)
      form.append('invoiceNumber', formData.invoiceNumber)
      form.append('title', formData.title)
      form.append('description', formData.description)
      form.append('amount', totalAmount.toString())
      form.append('currency', formData.currency)
      form.append('dueDate', formData.dueDate)
      form.append('notes', formData.notes)
      form.append('paymentLink', formData.paymentLink)
      form.append('poNumber', formData.poNumber)
      form.append('lineItems', JSON.stringify(formData.lineItems))

      const result = await updateInvoiceAction(invoice.id, form)
      
      if (result.error) {
        alert(result.error)
      } else {
        alert('Invoice saved successfully!')
        router.push(`/invoices/${invoice.id}`)
      }
    } catch (e) {
      alert('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  // Construct mocked invoice for PDF preview
  const previewInvoice = {
    ...invoice,
    ...formData,
    amount: totalAmount,
    line_items: formData.lineItems
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[calc(100vh-8rem)]">
      
      {/* Left Pane - Form Builder */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6 overflow-y-auto pb-20 scrollbar-hide">
        
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/invoices/${invoice.id}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Details
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Invoice
          </Button>
        </div>

        {/* FROM Section */}
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-neutral-400 font-medium tracking-wide uppercase">From (Your Details)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-neutral-500 mb-2">These details are pulled from your profile settings.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Company Name</Label>
                <Input value={localProfile.company_name || localProfile.full_name || ''} disabled className="bg-neutral-900/30 mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={localProfile.email || ''} disabled className="bg-neutral-900/30 mt-1" />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input value={localProfile.company_address || ''} disabled className="bg-neutral-900/30 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TO Section */}
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-neutral-400 font-medium tracking-wide uppercase">To (Client Details)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Client</Label>
              <Select value={formData.clientId} onValueChange={handleClientChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {allClients.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_name ? `${c.company_name} (${c.client_name})` : c.client_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {localClient && (
              <div className="p-3 bg-neutral-900/30 rounded-md border border-neutral-800 text-sm text-neutral-400 space-y-1">
                <p><span className="text-neutral-500">Name:</span> {localClient.client_name}</p>
                {localClient.email && <p><span className="text-neutral-500">Email:</span> {localClient.email}</p>}
                {localClient.company_name && <p><span className="text-neutral-500">Company:</span> {localClient.company_name}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* INVOICE DETAILS Section */}
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-neutral-400 font-medium tracking-wide uppercase">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Invoice Number</Label>
                <Input 
                  value={formData.invoiceNumber} 
                  onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})} 
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>PO Number (Optional)</Label>
                <Input 
                  value={formData.poNumber} 
                  onChange={(e) => setFormData({...formData, poNumber: e.target.value})} 
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input 
                  type="date"
                  value={formData.dueDate} 
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})} 
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Input 
                  value={formData.currency} 
                  onChange={(e) => setFormData({...formData, currency: e.target.value})} 
                  className="mt-1" 
                />
              </div>
            </div>
            <div>
              <Label>Main Title (Optional)</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g. Website Redesign"
                className="mt-1" 
              />
            </div>
          </CardContent>
        </Card>

        {/* LINE ITEMS Section */}
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-neutral-400 font-medium tracking-wide uppercase">Line Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.lineItems.map((item: any, idx: number) => (
              <div key={idx} className="p-4 bg-neutral-900/30 rounded-lg border border-neutral-800 relative group">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-neutral-800 text-neutral-400 hover:text-red-400 hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeLineItem(idx)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12 sm:col-span-6">
                    <Label className="text-xs">Item Name</Label>
                    <Input value={item.name} onChange={(e) => updateLineItem(idx, 'name', e.target.value)} className="h-8 mt-1" />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="text-xs">Qty</Label>
                    <Input type="number" value={item.quantity} onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)} className="h-8 mt-1" />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="text-xs">Rate</Label>
                    <Input type="number" value={item.rate} onChange={(e) => updateLineItem(idx, 'rate', e.target.value)} className="h-8 mt-1" />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="text-xs">Total</Label>
                    <div className="h-8 mt-1 flex items-center px-3 bg-neutral-900/50 border border-neutral-800 rounded-md text-sm font-medium">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(item.total)}
                    </div>
                  </div>
                  <div className="col-span-12">
                    <Input 
                      placeholder="Optional description" 
                      value={item.description} 
                      onChange={(e) => updateLineItem(idx, 'description', e.target.value)} 
                      className="h-8 text-xs bg-transparent border-dashed" 
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full border-dashed border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 text-neutral-400" onClick={addLineItem}>
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
            
            <div className="flex justify-end pt-4 border-t border-neutral-800">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-neutral-400">Total Due:</span>
                <span className="text-xl font-bold text-neutral-100">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: formData.currency }).format(totalAmount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PAYMENT INFO Section */}
        <Card className="border-neutral-800 bg-neutral-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-neutral-400 font-medium tracking-wide uppercase">Payment Info & Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Payment Link (Optional)</Label>
              <Input 
                value={formData.paymentLink} 
                onChange={(e) => setFormData({...formData, paymentLink: e.target.value})} 
                placeholder="https://buy.stripe.com/..."
                className="mt-1" 
              />
            </div>
            <div>
              <Label>Notes for Client</Label>
              <Textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                placeholder="Thank you for your business!"
                className="mt-1 resize-none" 
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Right Pane - Live Preview */}
      <div className="w-full lg:w-1/2 lg:sticky lg:top-4 h-[600px] lg:h-[calc(100vh-8rem)]">
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden h-full flex flex-col">
          <div className="px-4 py-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="text-sm font-medium tracking-wide text-neutral-300">Live PDF Preview</h3>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="flex-1 overflow-hidden bg-neutral-800/20">
            <LivePdfPreview 
              invoice={previewInvoice as any}
              client={localClient}
              profile={localProfile}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
