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
import { toast } from 'sonner'

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

  const handleRestoreInvoice = async (id: string) => {
    setIsRestoring(id)
    try {
      const result = await restoreInvoiceAction(id)
      if (result.error) throw new Error(result.error)
      toast.success('Invoice restored successfully.')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to restore invoice.')
    } finally {
      setIsRestoring(null)
    }
  }

  const handleHardDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure? This action cannot be undone.')) return
    setIsDeleting(id)
    try {
      const result = await hardDeleteInvoiceAction(id)
      if (result.error) throw new Error(result.error)
      toast.success('Invoice permanently deleted.')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete invoice.')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleRestoreClient = async (id: string) => {
    setIsRestoring(id)
    try {
      const result = await restoreClientAction(id)
      if (result.error) throw new Error(result.error)
      toast.success('Client and associated invoices restored successfully.')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to restore client.')
    } finally {
      setIsRestoring(null)
    }
  }

  const handleHardDeleteClient = async (id: string) => {
    if (!confirm('Are you sure? This will permanently delete the client and any remaining soft-deleted invoices for this client.')) return
    setIsDeleting(id)
    try {
      const result = await hardDeleteClientAction(id)
      if (result.error) throw new Error(result.error)
      toast.success('Client permanently deleted.')
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete client.')
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Recycle Bin</h1>
        <p className="text-muted-foreground">Restore deleted items or permanently remove them.</p>
      </div>

      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="bg-secondary/50 border border-border mb-6">
          <TabsTrigger value="invoices" className="text-muted-foreground data-[state=active]:bg-brand-500 data-[state=active]:text-white hover:bg-accent hover:text-foreground transition-colors cursor-pointer">
            Invoices ({invoices.length})
          </TabsTrigger>
          <TabsTrigger value="clients" className="text-muted-foreground data-[state=active]:bg-brand-500 data-[state=active]:text-white hover:bg-accent hover:text-foreground transition-colors cursor-pointer">
            Clients ({clients.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card className="border-border bg-card/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-foreground">Deleted Invoices</CardTitle>
              <CardDescription className="text-muted-foreground">
                Invoices that have been moved to the trash.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                  <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>No deleted invoices found.</p>
                </div>
              ) : (
                <div className="rounded-md border border-border">
                  <div className="grid grid-cols-12 p-4 text-sm font-medium text-muted-foreground border-b border-border bg-muted/50">
                    <div className="col-span-3">Invoice Number</div>
                    <div className="col-span-3">Client</div>
                    <div className="col-span-2">Amount</div>
                    <div className="col-span-4 text-right">Actions</div>
                  </div>
                  <div className="divide-y divide-border">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="grid grid-cols-12 p-4 text-sm text-foreground/80 items-center hover:bg-accent/50 transition-colors">
                        <div className="col-span-3 font-medium">{invoice.invoice_number}</div>
                        <div className="col-span-3">{(invoice.clients as any)?.client_name || 'Unknown Client'}</div>
                        <div className="col-span-2">{formatCurrency(invoice.amount, invoice.currency)}</div>
                        <div className="col-span-4 flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-secondary border-border hover:bg-accent hover:text-foreground"
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
          <Card className="border-border bg-card/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-foreground">Deleted Clients</CardTitle>
              <CardDescription className="text-muted-foreground">
                Clients that have been moved to the trash. Restoring a client will also restore their invoices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                  <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>No deleted clients found.</p>
                </div>
              ) : (
                <div className="rounded-md border border-border">
                  <div className="grid grid-cols-12 p-4 text-sm font-medium text-muted-foreground border-b border-border bg-muted/50">
                    <div className="col-span-4">Client Name</div>
                    <div className="col-span-4">Email</div>
                    <div className="col-span-4 text-right">Actions</div>
                  </div>
                  <div className="divide-y divide-border">
                    {clients.map((client) => (
                      <div key={client.id} className="grid grid-cols-12 p-4 text-sm text-foreground/80 items-center hover:bg-accent/50 transition-colors">
                        <div className="col-span-4 font-medium">{client.client_name}</div>
                        <div className="col-span-4">{client.email || '—'}</div>
                        <div className="col-span-4 flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-secondary border-border hover:bg-accent hover:text-foreground"
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
