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
    .is('deleted_at', null)
    .order('due_date', { ascending: false })

  const invoices = invoicesData ?? []

  // Group finances by currency
  const financialSummaries: Record<string, { billed: number; paid: number; outstanding: number }> = {}

  invoices.forEach((inv) => {
    if (inv.status === 'archived') return
    const cur = inv.currency || 'USD'
    if (!financialSummaries[cur]) {
      financialSummaries[cur] = { billed: 0, paid: 0, outstanding: 0 }
    }

    const amt = inv.amount || 0
    if (inv.status !== 'draft') {
      financialSummaries[cur].billed += amt
    }
    if (inv.status === 'paid') {
      financialSummaries[cur].paid += amt
    } else if (inv.status !== 'draft') {
      financialSummaries[cur].outstanding += amt
    }
  })

  // If no invoices exist or no active currency, add default USD summary to avoid empty layout
  if (Object.keys(financialSummaries).length === 0) {
    financialSummaries['USD'] = { billed: 0, paid: 0, outstanding: 0 }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/clients"
              className="text-xs text-muted-foreground hover:text-foreground/80 transition-colors"
            >
              Clients
            </Link>
            <span className="text-xs text-muted-foreground/40">/</span>
            <span className="text-xs text-muted-foreground">{client.client_name}</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            {client.client_name}
          </h1>
          {client.company_name && (
            <p className="text-sm text-muted-foreground mt-1">{client.company_name}</p>
          )}
        </div>
        <ClientDetailActions client={client} />
      </div>

      {/* Financial Summary Widget */}
      <div className="space-y-4">
        {Object.entries(financialSummaries).map(([cur, summary]) => (
          <div key={cur} className="space-y-2">
            {Object.keys(financialSummaries).length > 1 && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono px-1">
                {cur} Balance Summary
              </h3>
            )}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              {/* Billed */}
              <Card className="border-border bg-card/40 backdrop-blur-xl relative overflow-hidden">
                <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Billed
                  </CardTitle>
                  <span className="text-[9px] font-mono bg-accent text-muted-foreground px-1.5 py-0.5 rounded border border-border">
                    {cur}
                  </span>
                </CardHeader>
                <CardContent className="pb-4 px-4">
                  <p className="text-2xl font-bold tracking-tight text-foreground font-mono">
                    {formatCurrency(summary.billed, cur)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Excludes drafts & archives
                  </p>
                </CardContent>
              </Card>

              {/* Paid */}
              <Card className="border-border bg-card/40 backdrop-blur-xl relative overflow-hidden">
                <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Paid
                  </CardTitle>
                  <span className="text-[9px] font-mono bg-emerald-600 text-white dark:bg-emerald-950/30 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-700 dark:border-emerald-900/50">
                    Received
                  </span>
                </CardHeader>
                <CardContent className="pb-4 px-4">
                  <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatCurrency(summary.paid, cur)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Settled transactions
                  </p>
                </CardContent>
              </Card>

              {/* Outstanding */}
              <Card className="border-border bg-card/40 backdrop-blur-xl relative overflow-hidden">
                <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Outstanding
                  </CardTitle>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    summary.outstanding > 0 
                      ? 'bg-rose-600 text-white border-rose-700 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50' 
                      : 'bg-accent text-muted-foreground border-border'
                  }`}>
                    Pending
                  </span>
                </CardHeader>
                <CardContent className="pb-4 px-4">
                  <p className={`text-2xl font-bold tracking-tight font-mono ${
                    summary.outstanding > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                  }`}>
                    {formatCurrency(summary.outstanding, cur)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Sent & unpaid invoices
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>

      {/* Client Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Contact Info */}
        <Card className="border-border bg-card/40 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground/80">Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-xs text-muted-foreground">Contact Name</span>
                <span className="text-sm text-foreground/80">{client.contact_name || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-xs text-muted-foreground">Email</span>
                <span className="text-sm text-foreground/80">{client.email || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-muted-foreground">Phone</span>
                <span className="text-sm text-foreground/80">{client.phone || '—'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="border-border bg-card/40 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground/80">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {client.notes ? (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {client.notes}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/60 italic">No notes added yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <Card className="border-border bg-card/40 backdrop-blur-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-foreground/80">Invoices</CardTitle>
            <span className="text-xs text-muted-foreground">
              {invoices.length} total invoice{invoices.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No invoices found for this client.
              </p>
              <Link href={`/invoices?new=true`}>
                <Button size="sm" className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
                  + Create First Invoice
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
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
                    <tr key={inv.id} className="hover:bg-accent/50 transition-colors">
                      <td className="py-4 font-mono text-xs text-muted-foreground">{inv.invoice_number}</td>
                      <td className="py-4 text-xs text-foreground truncate max-w-[200px]">{inv.title || 'Untitled'}</td>
                      <td className="py-4 text-xs font-semibold text-right text-foreground">{formatCurrency(inv.amount, inv.currency)}</td>
                      <td className="py-4 text-xs text-muted-foreground">{formatDate(inv.due_date)}</td>
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
  draft: 'bg-accent text-muted-foreground border-border',
  sent: 'bg-blue-600 text-white border-blue-700 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50',
  due_soon: 'bg-amber-500 text-white border-amber-600 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900/50',
  overdue: 'bg-red-600 text-white border-red-700 dark:bg-red-500/[0.1] dark:text-red-400 dark:border-red-500/[0.2]',
  paid: 'bg-emerald-600 text-white border-emerald-700 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/50',
  archived: 'bg-accent/50 text-muted-foreground border-border',
  promised: 'bg-indigo-600 text-white border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50',
  paused: 'bg-slate-600 text-white border-slate-700 dark:bg-slate-950/40 dark:text-slate-400 dark:border-slate-900/50',
  partial: 'bg-amber-500 text-white border-amber-600 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50',
}

