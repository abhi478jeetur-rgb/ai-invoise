import { createClient } from '@/lib/db/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getInvoiceDetailAction } from '@/lib/invoices/actions'
import { sanitizeHref } from '@/lib/utils/security'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InvoiceDetailActions } from './invoice-detail-actions'
import { InvoiceReminderSection } from './invoice-reminder-section'
import { LivePdfPreview } from '@/components/invoices/live-pdf-preview'

interface InvoiceDetailPageProps {
  params: Promise<{ invoiceId: string }>
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  due_soon: 'Due Soon',
  overdue: 'Overdue',
  paid: 'Paid',
  archived: 'Archived',
  promised: 'Promised',
  paused: 'Paused',
  partial: 'Partial',
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-neutral-800 text-neutral-400 border-neutral-700',
  sent: 'bg-blue-950/40 text-blue-400 border-blue-900/50',
  due_soon: 'bg-yellow-950/40 text-yellow-400 border-yellow-900/50',
  overdue: 'bg-red-500/[0.1] text-red-400 border-red-500/[0.2]',
  paid: 'bg-green-950/40 text-green-400 border-green-900/50',
  archived: 'bg-neutral-800/50 text-neutral-500 border-neutral-700/50',
  promised: 'bg-indigo-950/40 text-indigo-400 border-indigo-900/50',
  paused: 'bg-slate-950/40 text-slate-400 border-slate-900/50',
  partial: 'bg-amber-950/40 text-amber-400 border-amber-900/50',
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
  if (!dateStr) return 'N/A'
  const dateObj = (dateStr.includes('T') || dateStr.includes(' ')) 
    ? new Date(dateStr) 
    : new Date(dateStr + 'T00:00:00')
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date'
  
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getInvoiceEffectiveStatus(inv: { status: string; due_date: string }): string {
  if (['paid', 'archived', 'draft', 'promised', 'paused', 'partial'].includes(inv.status)) {
    return inv.status
  }
  
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const parseStr = (inv.due_date.includes('T') || inv.due_date.includes(' ')) ? inv.due_date : inv.due_date + 'T00:00:00'
  const due = new Date(parseStr); due.setHours(0, 0, 0, 0)
  
  if (due < now) {
    return 'overdue'
  }
  
  const threeDaysLater = new Date(now)
  threeDaysLater.setDate(now.getDate() + 3)
  threeDaysLater.setHours(23, 59, 59, 999)
  
  if (due <= threeDaysLater) {
    return 'due_soon'
  }
  
  return 'sent'
}

function getDueInterpretation(dueDate: string, status: string): { text: string; className: string } {
  if (status === 'paid') return { text: 'Paid', className: 'text-green-400' }
  if (status === 'promised') return { text: 'Promised', className: 'text-indigo-400' }
  if (status === 'paused') return { text: 'Paused', className: 'text-slate-400' }
  if (status === 'partial') return { text: 'Partial', className: 'text-amber-400' }
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00'); due.setHours(0, 0, 0, 0)
  const diff = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (status === 'overdue' || diff < 0) {
    const days = Math.abs(diff)
    if (days === 0) return { text: 'Due today', className: 'text-yellow-400' }
    return { text: `Overdue by ${days} day${days === 1 ? '' : 's'}`, className: 'text-red-400' }
  }
  if (diff === 0) return { text: 'Due today', className: 'text-yellow-400' }
  if (diff === 1) return { text: 'Due tomorrow', className: 'text-yellow-400' }
  return { text: `Due in ${diff} days`, className: 'text-neutral-400' }
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { invoiceId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const result = await getInvoiceDetailAction(invoiceId)

  if (!result.success || !result.data) {
    return (
      <div className="p-8 text-white bg-red-900 rounded-md">
        <h2>DEBUG 404 ERROR</h2>
        <pre>{JSON.stringify({ invoiceId, result }, null, 2)}</pre>
      </div>
    )
  }

  const invoice = result.data
  const client = invoice.clients
  const effectiveStatus = getInvoiceEffectiveStatus(invoice)
  const dueInfo = getDueInterpretation(invoice.due_date, effectiveStatus)

  // Fetch profile for PDF preview
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, company_name, company_address, company_website, tax_id, logo_url, bank_details, global_rules')
    .eq('id', user.id)
    .single()

  // Fetch activity events
  const { data: events } = await supabase
    .from('reminder_events')
    .select('id, event_type, description, created_at, invoice_id, invoices (invoice_number, title)')
    .eq('invoice_id', invoiceId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const activities = (events ?? []).map((ev) => {
    const invoicesData = ev.invoices as any
    const inv = Array.isArray(invoicesData) ? invoicesData[0] : invoicesData
    return {
      id: ev.id,
      event_type: ev.event_type,
      description: ev.description,
      created_at: ev.created_at,
      invoice_number: inv?.invoice_number ?? null,
      invoice_title: inv?.title ?? null,
    }
  })

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/invoices" className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
          Invoices
        </Link>
        <span className="text-xs text-neutral-700">/</span>
        <span className="text-xs text-neutral-400">{invoice.invoice_number}</span>
      </div>

      {/* Hero: Invoice Identity + Primary CTA */}
      <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl">
        <CardContent className="py-6 px-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-semibold text-neutral-100 tracking-tight capitalize">
                  {invoice.title || invoice.invoice_number}
                </h1>
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border ${STATUS_STYLES[effectiveStatus] ?? STATUS_STYLES.draft}`}>
                  {STATUS_LABELS[effectiveStatus] ?? effectiveStatus}
                </span>
              </div>
              {invoice.title && (
                <p className="text-xs font-mono text-neutral-500">{invoice.invoice_number}</p>
              )}
              <div className="flex items-center gap-4 flex-wrap">
                <p className="text-2xl font-bold text-neutral-100 font-mono">
                  {formatCurrency(invoice.amount, invoice.currency)}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-medium ${dueInfo.className}`}>{dueInfo.text}</span>
                  <span className="text-neutral-700">&middot;</span>
                  <span className="text-sm text-neutral-500 font-mono">{formatDate(invoice.due_date)}</span>
                </div>
              </div>
              {invoice.reminder_count > 0 && (
                <p className="text-xs text-neutral-500">
                  {invoice.reminder_count} reminder{invoice.reminder_count !== 1 ? 's' : ''} sent
                  {invoice.last_reminder_at && (
                    <> &middot; Last: {new Date(invoice.last_reminder_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                  )}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <InvoiceDetailActions invoice={invoice} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left: Invoice Particulars + Activity */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="bg-neutral-900/60 border border-neutral-800 p-1 flex-wrap h-auto gap-1 mb-4">
              <TabsTrigger value="details" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-100 text-neutral-500 text-xs cursor-pointer">
                Overview & Activity
              </TabsTrigger>
              <TabsTrigger value="preview" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-neutral-100 text-neutral-500 text-xs cursor-pointer">
                Live PDF Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 m-0 focus-visible:outline-none">
              {/* Invoice Details */}
              <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Amount</p>
                  <p className="text-lg font-semibold text-neutral-100 font-mono">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Status</p>
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border ${STATUS_STYLES[effectiveStatus] ?? ''}`}>
                    {STATUS_LABELS[effectiveStatus] ?? effectiveStatus}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Invoice Number</p>
                  <p className="text-sm text-neutral-300 font-mono">{invoice.invoice_number}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Due Date</p>
                  <p className="text-sm text-neutral-300 font-mono">{formatDate(invoice.due_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Created</p>
                  <p className="text-sm text-neutral-300 font-mono">{formatDate(invoice.created_at)}</p>
                </div>
                {invoice.paid_date && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Paid Date</p>
                    <p className="text-sm text-green-400 font-mono">{formatDate(invoice.paid_date)}</p>
                  </div>
                )}
              </div>

              {invoice.description && (
                <div className="mt-4 pt-4 border-t border-neutral-800/50">
                  <p className="text-xs text-neutral-500 mb-1">Description</p>
                  <p className="text-sm text-neutral-400 leading-relaxed">{invoice.description}</p>
                </div>
              )}

              {invoice.notes && (
                <div className="mt-4 pt-4 border-t border-neutral-800/50">
                  <p className="text-xs text-neutral-500 mb-1">Notes</p>
                  <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}

              {invoice.payment_link && (
                <div className="mt-4 pt-4 border-t border-neutral-800/50">
                  <p className="text-xs text-neutral-500 mb-1">Payment Link</p>
                  <a
                    href={sanitizeHref(invoice.payment_link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors break-all"
                  >
                    {invoice.payment_link}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300">Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <InvoiceReminderSection
                  invoiceId={invoiceId}
                  invoiceNumber={invoice.invoice_number}
                  initialEvents={activities}
                  clientEmail={client?.email}
                  amount={invoice.amount}
                  currency={invoice.currency}
                />
              </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="preview" className="m-0 focus-visible:outline-none">
              <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl overflow-hidden">
                <CardContent className="p-0">
                  {profile && client && (
                    <LivePdfPreview 
                      invoice={{
                        ...invoice,
                        po_number: invoice.po_number || null,
                      }} 
                      client={{
                        client_name: client.client_name,
                        email: client.email,
                        company_name: client.company_name
                      }} 
                      profile={{
                        full_name: profile.full_name,
                        email: profile.email,
                        company_name: profile.company_name,
                        company_address: profile.company_address,
                        company_website: profile.company_website,
                        tax_id: profile.tax_id,
                        logo_url: profile.logo_url,
                        bank_details: profile.bank_details,
                        global_rules: profile.global_rules
                      }} 
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Client + Generate Reminder CTA */}
        <div className="space-y-4">
          {/* Client Card */}
          <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300">Client</CardTitle>
            </CardHeader>
            <CardContent>
              {client ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-800/80 border border-neutral-700/50 shrink-0">
                      <span className="text-xs font-medium text-neutral-400">
                        {client.client_name[0]?.toUpperCase() ?? '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <Link href={`/clients/${client.id}`} className="text-sm font-medium text-neutral-200 hover:text-white transition-colors">
                        {client.client_name}
                      </Link>
                      {client.company_name && <p className="text-xs text-neutral-500 truncate">{client.company_name}</p>}
                    </div>
                  </div>
                  <div className="pt-2 space-y-2 border-t border-neutral-800/50">
                    {client.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Email</span>
                        <span className="text-xs text-neutral-300 truncate max-w-[160px]">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Phone</span>
                        <span className="text-xs text-neutral-300">{client.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">Client information not available.</p>
              )}
            </CardContent>
          </Card>

          {/* Generate Reminder CTA */}
          <InvoiceReminderSection
            invoiceId={invoiceId}
            invoiceNumber={invoice.invoice_number}
            initialEvents={activities}
            variant="cta"
            clientEmail={client?.email}
            amount={invoice.amount}
            currency={invoice.currency}
          />
        </div>
      </div>
    </div>
  )
}
