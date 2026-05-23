'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { RefreshCcw, Trash2, AlertCircle } from 'lucide-react'
import { restoreInvoiceAction, hardDeleteInvoiceAction } from '@/lib/invoices/actions'
import { restoreClientAction, hardDeleteClientAction } from '@/lib/clients/actions'

export function TrashPageClient({
  invoices: initialInvoices,
  clients: initialClients
}: {
  invoices: any[]
  clients: any[]
}) {
  const router = useRouter()
  const [invoices, setInvoices] = useState<any[]>(initialInvoices)
  const [clients, setClients] = useState<any[]>(initialClients)
  const [isRestoring, setIsRestoring] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleRestoreInvoice = async (id: string) => {
    setIsRestoring(id)
    setMessage(null)
    try {
      const result = await restoreInvoiceAction(id)
      if (result.error) throw new Error(result.error)
      setMessage({ type: 'success', text: 'Invoice restored successfully.' })
      router.refresh()
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to restore invoice.' })
    } finally {
      setIsRestoring(null)
    }
  }

  const handleHardDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure? This action cannot be undone.')) return
    setIsDeleting(id)
    setMessage(null)
    try {
      const result = await hardDeleteInvoiceAction(id)
      if (result.error) throw new Error(result.error)
      setMessage({ type: 'success', text: 'Invoice permanently deleted.' })
      router.refresh()
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to delete invoice.' })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleRestoreClient = async (id: string) => {
    setIsRestoring(id)
    setMessage(null)
    try {
      const result = await restoreClientAction(id)
      if (result.error) throw new Error(result.error)
      setMessage({ type: 'success', text: 'Client and associated invoices restored successfully.' })
      router.refresh()
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to restore client.' })
    } finally {
      setIsRestoring(null)
    }
  }

  const handleHardDeleteClient = async (id: string) => {
    if (!confirm('Are you sure? This will permanently delete the client and any remaining soft-deleted invoices for this client.')) return
    setIsDeleting(id)
    setMessage(null)
    try {
      const result = await hardDeleteClientAction(id)
      if (result.error) throw new Error(result.error)
      setMessage({ type: 'success', text: 'Client permanently deleted.' })
      router.refresh()
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to delete client.' })
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Recycle Bin</h1>
        <p className="text-zinc-400">Restore deleted items or permanently remove them.</p>
      </div>

      {message && (
        <div className={`p-3 text-sm font-medium rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-950/30 border-green-900/50 text-green-400' 
            : 'bg-red-950/30 border-red-900/50 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="bg-zinc-800/50 border border-zinc-700/50 mb-6">
          <TabsTrigger value="invoices" className="data-[state=active]:bg-brand-500 data-[state=active]:text-white">
            Invoices ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="clients" className="data-[state=active]:bg-brand-500 data-[state=active]:text-white">
            Clients ({clients.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Deleted Invoices</CardTitle>
              <CardDescription className="text-zinc-400">
                Invoices that have been moved to the trash.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                  <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>No deleted invoices found.</p>
                </div>
              ) : (
                <div className="rounded-md border border-zinc-800">
                  <div className="grid grid-cols-12 p-4 text-sm font-medium text-zinc-400 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="col-span-3">Invoice Number</div>
                    <div className="col-span-3">Client</div>
                    <div className="col-span-2">Amount</div>
                    <div className="col-span-4 text-right">Actions</div>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="grid grid-cols-12 p-4 text-sm text-zinc-300 items-center hover:bg-white/[0.02] transition-colors">
                        <div className="col-span-3 font-medium">{invoice.invoice_number}</div>
                        <div className="col-span-3">{(invoice.clients as any)?.client_name || 'Unknown Client'}</div>
                        <div className="col-span-2">{formatCurrency(invoice.amount, invoice.currency)}</div>
                        <div className="col-span-4 flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:text-white"
                            onClick={() => handleRestoreInvoice(invoice.id)}
                            disabled={isRestoring === invoice.id || isDeleting === invoice.id}
                          >
                            {isRestoring === invoice.id ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                            Restore
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleHardDeleteInvoice(invoice.id)}
                            disabled={isRestoring === invoice.id || isDeleting === invoice.id}
                          >
                            {isDeleting === invoice.id ? <Trash2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Delete Forever
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Deleted Clients</CardTitle>
              <CardDescription className="text-zinc-400">
                Clients that have been moved to the trash. Restoring a client will also restore their invoices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                  <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>No deleted clients found.</p>
                </div>
              ) : (
                <div className="rounded-md border border-zinc-800">
                  <div className="grid grid-cols-12 p-4 text-sm font-medium text-zinc-400 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="col-span-4">Client Name</div>
                    <div className="col-span-4">Email</div>
                    <div className="col-span-4 text-right">Actions</div>
                  </div>
                  <div className="divide-y divide-zinc-800">
                    {clients.map((client) => (
                      <div key={client.id} className="grid grid-cols-12 p-4 text-sm text-zinc-300 items-center hover:bg-white/[0.02] transition-colors">
                        <div className="col-span-4 font-medium">{client.client_name}</div>
                        <div className="col-span-4">{client.email || '—'}</div>
                        <div className="col-span-4 flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:text-white"
                            onClick={() => handleRestoreClient(client.id)}
                            disabled={isRestoring === client.id || isDeleting === client.id}
                          >
                            {isRestoring === client.id ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                            Restore
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleHardDeleteClient(client.id)}
                            disabled={isRestoring === client.id || isDeleting === client.id}
                          >
                            {isDeleting === client.id ? <Trash2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Delete Forever
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
