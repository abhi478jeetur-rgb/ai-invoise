import { createClient } from '@/lib/db/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClientDetailActions } from './client-detail-actions'

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .eq('user_id', user.id)
    .single()

  if (error || !client) {
    notFound()
  }

  const { data: invoicesData } = await supabase
    .from('invoices')
    .select('id, invoice_number, title, amount, currency, status, due_date, paid_date')
    .eq('client_id', clientId)
    .eq('user_id', user.id)
    .order('due_date', { ascending: false })

  const invoices = invoicesData ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/clients"
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Clients
            </Link>
            <span className="text-xs text-neutral-700">/</span>
            <span className="text-xs text-neutral-400">{client.client_name}</span>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-100 tracking-tight">
            {client.client_name}
          </h1>
          {client.company_name && (
            <p className="text-sm text-neutral-500 mt-1">{client.company_name}</p>
          )}
        </div>
        <ClientDetailActions client={client} />
      </div>

      {/* Client Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Contact Info */}
        <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300">Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/50">
                <span className="text-xs text-neutral-500">Contact Name</span>
                <span className="text-sm text-neutral-300">{client.contact_name || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-neutral-800/50">
                <span className="text-xs text-neutral-500">Email</span>
                <span className="text-sm text-neutral-300">{client.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-neutral-500">Phone</span>
                <span className="text-sm text-neutral-300">{client.phone || '—'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {client.notes ? (
              <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap">
                {client.notes}
              </p>
            ) : (
              <p className="text-sm text-neutral-600 italic">No notes added yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-neutral-300">Invoices</CardTitle>
            <span className="text-xs text-neutral-500">
              {invoices.length} total invoice{invoices.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-neutral-500">
                No invoices found for this client.
              </p>
              <Link href={`/invoices?new=true`}>
                <Button size="sm" className="mt-4 bg-white text-black hover:bg-neutral-200">
                  + Create First Invoice
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-neutral-500">
                    <th className="pb-2 font-medium">Invoice Number</th>
                    <th className="pb-2 font-medium">Title</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                    <th className="pb-2 font-medium">Due Date</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 font-mono text-xs text-neutral-400">{inv.invoice_number}</td>
                      <td className="py-4 text-xs text-neutral-200 truncate max-w-[200px]">{inv.title || 'Untitled'}</td>
                      <td className="py-4 text-xs font-semibold text-right text-neutral-200">{formatCurrency(inv.amount, inv.currency)}</td>
                      <td className="py-4 text-xs text-neutral-400">{formatDate(inv.due_date)}</td>
                      <td className="py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-medium rounded border ${STATUS_STYLES[inv.status] ?? ''}`}>
                          {STATUS_LABELS[inv.status] ?? inv.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <Link href={`/invoices/${inv.id}`} className="text-xs text-emerald-500 hover:underline">
                          View details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const dateObj = (dateStr.includes('T') || dateStr.includes(' ')) 
    ? new Date(dateStr) 
    : new Date(dateStr + 'T00:00:00')
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date'
  
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  due_soon: 'Due Soon',
  overdue: 'Overdue',
  paid: 'Paid',
  archived: 'Archived',
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  sent: 'bg-blue-950/40 text-blue-400 border-blue-900/50',
  due_soon: 'bg-yellow-950/40 text-yellow-400 border-yellow-900/50',
  overdue: 'bg-red-500/[0.1] text-red-400 border-red-500/[0.2]',
  paid: 'bg-green-950/40 text-green-400 border-green-900/50',
  archived: 'bg-neutral-800/50 text-neutral-500 border-neutral-700/50',
}
