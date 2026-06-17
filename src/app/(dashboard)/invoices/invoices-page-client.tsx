'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AIHelperCharacter } from '@/components/ui/AIHelperCharacter'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { deleteInvoiceAction } from '@/lib/invoices/actions'
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
  amount_paid: number
  currency: string
  status: string
  due_date: string
  paid_date: string | null
  notes: string | null
  payment_link: string | null
  created_at: string
  clients: {
    client_name: string
    email: string | null
    company_name: string | null
  } | null
}

interface InvoicesPageClientProps {
  invoices: Invoice[]
  clients: Client[]
  defaultProfile?: {
    default_currency?: string
    payment_link_default?: string
    default_payment_terms?: string
  }
}

const STATUS_FILTERS = ['all', 'draft', 'sent', 'due_soon', 'overdue', 'promised', 'paused', 'partial', 'paid', 'archived'] as const
const STATUS_LABELS: Record<string, string> = {
  all: 'All',
  draft: 'Draft',
  sent: 'Sent',
  due_soon: 'Due Soon',
  overdue: 'Overdue',
  promised: 'Promised',
  paused: 'Paused',
  partial: 'Partial',
  paid: 'Paid',
  archived: 'Archived',
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground border-border',
    sent: 'bg-blue-600 text-white border-blue-700 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50',
    due_soon: 'bg-amber-500 text-white border-amber-600 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900/50',
    overdue: 'bg-red-600 text-white border-red-700 dark:bg-red-500/[0.1] dark:text-red-400 dark:border-red-500/[0.2]',
    paid: 'bg-emerald-600 text-white border-emerald-700 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/50',
    archived: 'bg-muted/50 text-muted-foreground border-border/50',
    promised: 'bg-indigo-600 text-white border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50',
    paused: 'bg-slate-600 text-white border-slate-700 dark:bg-slate-950/40 dark:text-slate-400 dark:border-slate-900/50',
    partial: 'bg-amber-500 text-white border-amber-600 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50',
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md border ${styles[status] ?? styles.draft}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
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

function getDueLabel(dueDate: string, status: string): { text: string; className: string } {
  if (!dueDate) return { text: 'No due date', className: 'text-muted-foreground' }
  if (status === 'paid') return { text: 'Paid', className: 'text-green-400' }
  
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const parseStr = (dueDate.includes('T') || dueDate.includes(' ')) ? dueDate : dueDate + 'T00:00:00'
  const due = new Date(parseStr); due.setHours(0, 0, 0, 0)
  
  if (isNaN(due.getTime())) return { text: 'Invalid Date', className: 'text-muted-foreground' }
  const diff = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (status === 'overdue' || diff < 0) {
    const days = Math.abs(diff)
    return { text: days === 0 ? 'Due today' : `${days}d overdue`, className: 'text-red-400' }
  }
  if (diff === 0) return { text: 'Due today', className: 'text-yellow-400' }
  if (diff === 1) return { text: 'Due tomorrow', className: 'text-yellow-400' }
  return { text: `Due in ${diff}d`, className: 'text-muted-foreground' }
}

function getInvoiceEffectiveStatus(inv: { status: string; due_date: string }): string {
  if (inv.status === 'paid' || inv.status === 'archived' || inv.status === 'draft') {
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

export function InvoicesPageClient({ invoices, clients, defaultProfile }: InvoicesPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const autoNew = searchParams?.get('new') === 'true'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    if (autoNew) {
      setEditingInvoice(null)
      setFormOpen(true)
    }
  }, [autoNew])

  const filtered = useMemo(() => {
    let result = invoices

    if (statusFilter !== 'all') {
      result = result.filter((inv) => getInvoiceEffectiveStatus(inv) === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(q) ||
          (inv.title?.toLowerCase().includes(q) ?? false) ||
          (inv.clients?.client_name.toLowerCase().includes(q) ?? false)
      )
    }

    return result
  }, [invoices, statusFilter, search])

  function handleEdit(invoice: Invoice) {
    setEditingInvoice(invoice)
    setFormOpen(true)
  }

  async function handleDelete(invoiceId: string) {
    try {
      const result = await deleteInvoiceAction(invoiceId)
      if (result.success) {
        toast.success('Invoice moved to trash!')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to delete invoice')
      }
    } catch {
      toast.error('Network Error. Failed to delete invoice.')
    }
  }

  const exportToCSV = () => {
    if (invoices.length === 0) {
      toast.error('No invoices to export.')
      return
    }
    const headers = ['Invoice Number', 'Client', 'Title', 'Amount', 'Currency', 'Status', 'Due Date', 'Created At']
    const rows = invoices.map(inv => [
      inv.invoice_number,
      inv.clients?.client_name || '',
      inv.title || '',
      inv.amount,
      inv.currency,
      inv.status,
      inv.due_date,
      new Date(inv.created_at).toLocaleDateString()
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const str = String(val ?? '')
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Invoices exported to CSV successfully!')
  }

  const exportToExcel = () => {
    if (invoices.length === 0) {
      toast.error('No invoices to export.')
      return
    }
    const headers = ['Invoice Number', 'Client', 'Title', 'Amount', 'Currency', 'Status', 'Due Date', 'Created At']
    const rows = invoices.map(inv => [
      inv.invoice_number,
      inv.clients?.client_name || '',
      inv.title || '',
      inv.amount,
      inv.currency,
      inv.status,
      inv.due_date,
      new Date(inv.created_at).toLocaleDateString()
    ])

    let xml = 'xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
              'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ' +
              'xmlns:html="http://www.w3.org/TR/REC-html40">\n' +
              '  <Worksheet ss:Name="Invoices">\n' +
              '    <Table>\n'
    
    xml += '      <Row>\n'
    headers.forEach(h => {
      xml += `        <Cell><Data ss:Type="String">${h}</Data></Cell>\n`
    })
    xml += '      </Row>\n'

    rows.forEach(row => {
      xml += '      <Row>\n'
      row.forEach(val => {
        const type = typeof val === 'number' ? 'Number' : 'String'
        xml += `        <Cell><Data ss:Type="${type}">${val}</Data></Cell>\n`
      })
      xml += '      </Row>\n'
    })

    xml += '    </Table>\n  </Worksheet>\n</Workbook>'
    
    const content = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n ' + xml
    const blob = new Blob([content], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices_export_${new Date().toISOString().split('T')[0]}.xls`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Invoices exported to Excel successfully!')
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open)
    if (!open) {
      setEditingInvoice(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3">
        {invoices.length > 0 && (
          <>
            <Button
              variant="outline"
              onClick={exportToCSV}
              className="border-border bg-card hover:bg-accent hover:text-accent-foreground text-foreground font-medium text-sm cursor-pointer w-fit"
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={exportToExcel}
              className="border-border bg-card hover:bg-accent hover:text-accent-foreground text-foreground font-medium text-sm cursor-pointer w-fit"
            >
              Export Excel
            </Button>
          </>
        )}
        <Link href="/invoices/import">
          <Button
            variant="outline"
            className="border-border bg-card hover:bg-accent hover:text-accent-foreground text-foreground font-medium text-sm cursor-pointer w-fit"
          >
            Import CSV
          </Button>
        </Link>
        <Button
          onClick={() => {
            setEditingInvoice(null)
            setFormOpen(true)
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm cursor-pointer w-fit"
        >
          + New Invoice
        </Button>
      </div>

      {/* Filters */}
      {invoices.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="max-w-sm">
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === status
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {invoices.length === 0 ? (
        <Card className="border-border bg-card/40 backdrop-blur-xl max-w-lg">
          <CardContent className="py-12 text-center">
            <AIHelperCharacter variant="invoices" />
            <h3 className="text-base font-medium text-foreground/80 mb-1">No invoices yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              {clients.length === 0
                ? 'Create your first invoice and add a client inline to start tracking payments.'
                : 'Create your first invoice to track payments and generate AI-powered reminders.'}
            </p>
            <Button
              onClick={() => {
                setEditingInvoice(null)
                setFormOpen(true)
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm cursor-pointer"
            >
              + Create Your First Invoice
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No invoices match your filters.</p>
        </div>
      ) : (
        /* Invoice List */
        <div className="grid gap-2">
          {filtered.map((invoice) => {
            const due = getDueLabel(invoice.due_date, invoice.status)
            return (
              <Card
                key={invoice.id}
                className="relative border-border bg-card/40 backdrop-blur-xl hover:bg-accent/50 transition-colors shadow-none overflow-hidden py-0"
              >
                <CardContent className="py-2 px-3">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="flex-1 min-w-0 group"
                    >
                      <span className="absolute inset-0 z-0" aria-hidden="true" />
                      <div className="flex items-center gap-4 relative z-10">
                        {/* Status bar */}
                        {(() => {
                          const effectiveStatus = getInvoiceEffectiveStatus(invoice)
                          return (
                            <>
                              <div className={`w-1 h-6 rounded-full shrink-0 ${
                                effectiveStatus === 'overdue' ? 'bg-red-500' :
                                effectiveStatus === 'due_soon' ? 'bg-yellow-500' :
                                effectiveStatus === 'paid' ? 'bg-green-500' :
                                effectiveStatus === 'sent' ? 'bg-blue-500' :
                                'bg-muted-foreground/50'
                              }`} />

                              {/* Title + Client */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-foreground transition-colors capitalize">
                                    {invoice.title || invoice.clients?.client_name || 'Untitled'}
                                  </p>
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-mono text-muted-foreground shrink-0">
                                    {invoice.invoice_number}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {invoice.clients?.client_name}
                                  {invoice.clients?.company_name && (
                                    <span className="text-muted-foreground/60"> &middot; {invoice.clients.company_name}</span>
                                  )}
                                </p>
                              </div>

                              {/* Amount */}
                              <div className="shrink-0 text-right hidden sm:block">
                                <p className="text-sm font-bold text-foreground font-mono">
                                  {formatCurrency(invoice.amount, invoice.currency)}
                                </p>
                                <p className={`text-[11px] mt-0.5 ${due.className}`}>
                                  {due.text}
                                </p>
                              </div>

                              {/* Status */}
                              <div className="shrink-0">
                                <StatusBadge status={effectiveStatus} />
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    </Link>

                    {/* Actions */}
                    <div className="shrink-0 relative z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                            >
                              <span className="text-lg leading-none">...</span>
                            </Button>
                          }
                        />
                        <DropdownMenuContent
                          align="end"
                          className="border-border bg-popover/95 backdrop-blur-xl"
                        >
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="text-foreground/80 focus:bg-accent focus:text-foreground cursor-pointer"
                            >
                              View Details
                            </Link>
                          </DropdownMenuItem>
                           <DropdownMenuItem asChild>
                            <a
                              href={`/api/invoices/${invoice.id}/pdf`}
                              download
                              onClick={() => {
                                toast.info("Preparing PDF download...", {
                                  description: `Downloading invoice #${invoice.invoice_number} as PDF.`,
                                  duration: 3000,
                                });
                              }}
                              className="text-foreground/80 focus:bg-accent focus:text-foreground cursor-pointer w-full text-left"
                            >
                              Download PDF
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(invoice)}
                            className="text-foreground/80 focus:bg-accent focus:text-foreground cursor-pointer"
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(invoice.id)}
                            className="text-red-400 focus:bg-red-950/50 focus:text-red-300 cursor-pointer"
                          >
                            Move to Trash
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Mobile amount row */}
                  <div className="flex items-center justify-between mt-2 sm:hidden">
                    <p className={`text-xs ${due.className}`}>{due.text}</p>
                    <p className="text-sm font-bold text-foreground font-mono">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Invoice Form Dialog */}
      <InvoiceForm
        open={formOpen}
        onOpenChange={handleFormClose}
        clients={clients}
        invoice={editingInvoice}
        onSaved={() => router.refresh()}
        defaultProfile={defaultProfile}
      />
    </div>
  )
}
