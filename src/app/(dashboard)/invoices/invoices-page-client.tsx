'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InvoiceForm } from '@/components/invoices/invoice-form'
import { deleteInvoiceAction } from '@/lib/invoices/actions'

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
}

const STATUS_FILTERS = ['all', 'draft', 'sent', 'due_soon', 'overdue', 'paid', 'archived'] as const
const STATUS_LABELS: Record<string, string> = {
  all: 'All',
  draft: 'Draft',
  sent: 'Sent',
  due_soon: 'Due Soon',
  overdue: 'Overdue',
  paid: 'Paid',
  archived: 'Archived',
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-neutral-800 text-neutral-400 border-neutral-700',
    sent: 'bg-blue-950/40 text-blue-400 border-blue-900/50',
    due_soon: 'bg-yellow-950/40 text-yellow-400 border-yellow-900/50',
    overdue: 'bg-red-950/40 text-red-400 border-red-900/50',
    paid: 'bg-green-950/40 text-green-400 border-green-900/50',
    archived: 'bg-neutral-800/50 text-neutral-500 border-neutral-700/50',
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
  if (!dueDate) return { text: 'No due date', className: 'text-neutral-500' }
  if (status === 'paid') return { text: 'Paid', className: 'text-green-400' }
  
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const parseStr = (dueDate.includes('T') || dueDate.includes(' ')) ? dueDate : dueDate + 'T00:00:00'
  const due = new Date(parseStr); due.setHours(0, 0, 0, 0)
  
  if (isNaN(due.getTime())) return { text: 'Invalid Date', className: 'text-neutral-500' }
  const diff = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (status === 'overdue' || diff < 0) {
    const days = Math.abs(diff)
    return { text: days === 0 ? 'Due today' : `${days}d overdue`, className: 'text-red-400' }
  }
  if (diff === 0) return { text: 'Due today', className: 'text-yellow-400' }
  if (diff === 1) return { text: 'Due tomorrow', className: 'text-yellow-400' }
  return { text: `Due in ${diff}d`, className: 'text-neutral-500' }
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

export function InvoicesPageClient({ invoices, clients }: InvoicesPageClientProps) {
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
    const result = await deleteInvoiceAction(invoiceId)
    if (result.success) {
      router.refresh()
    }
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open)
    if (!open) {
      setEditingInvoice(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100 tracking-tight">Invoices</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Track payments and follow up on outstanding invoices.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingInvoice(null)
            setFormOpen(true)
          }}
          disabled={clients.length === 0}
          className="bg-white text-black hover:bg-neutral-200 font-medium text-sm cursor-pointer w-fit disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 placeholder:text-neutral-600 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === status
                    ? 'bg-neutral-800 text-neutral-200'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'
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
        <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl max-w-lg">
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 mb-4">
              <span className="text-lg text-neutral-500">$</span>
            </div>
            <h3 className="text-base font-medium text-neutral-300 mb-1">No invoices yet</h3>
            <p className="text-sm text-neutral-500 mb-6 max-w-xs mx-auto">
              {clients.length === 0
                ? 'Add a client first, then create your first invoice to start tracking payments.'
                : 'Create your first invoice to track payments and generate AI-powered reminders.'}
            </p>
            {clients.length === 0 ? (
              <Link href="/clients">
                <Button className="bg-white text-black hover:bg-neutral-200 font-medium text-sm cursor-pointer">
                  Go to Clients
                </Button>
              </Link>
            ) : (
              <Button
                onClick={() => {
                  setEditingInvoice(null)
                  setFormOpen(true)
                }}
                className="bg-white text-black hover:bg-neutral-200 font-medium text-sm cursor-pointer"
              >
                + Create Your First Invoice
              </Button>
            )}
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-neutral-500">No invoices match your filters.</p>
        </div>
      ) : (
        /* Invoice List */
        <div className="grid gap-2">
          {filtered.map((invoice) => {
            const due = getDueLabel(invoice.due_date, invoice.status)
            return (
              <Card
                key={invoice.id}
                className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl hover:bg-neutral-900/60 transition-colors"
              >
                <CardContent className="py-3.5 px-5">
                  <div className="flex items-center justify-between gap-4">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="flex-1 min-w-0 group"
                    >
                      <div className="flex items-center gap-4">
                        {/* Status bar */}
                        {(() => {
                          const effectiveStatus = getInvoiceEffectiveStatus(invoice)
                          return (
                            <>
                              <div className={`w-1 h-8 rounded-full shrink-0 ${
                                effectiveStatus === 'overdue' ? 'bg-red-500' :
                                effectiveStatus === 'due_soon' ? 'bg-yellow-500' :
                                effectiveStatus === 'paid' ? 'bg-green-500' :
                                effectiveStatus === 'sent' ? 'bg-blue-500' :
                                'bg-neutral-700'
                              }`} />

                              {/* Title + Client */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-neutral-200 truncate group-hover:text-white transition-colors capitalize">
                                    {invoice.title || invoice.clients?.client_name || 'Untitled'}
                                  </p>
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[9px] font-mono text-neutral-500 shrink-0">
                                    {invoice.invoice_number}
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-500 truncate mt-0.5">
                                  {invoice.clients?.client_name}
                                  {invoice.clients?.company_name && (
                                    <span className="text-neutral-600"> &middot; {invoice.clients.company_name}</span>
                                  )}
                                </p>
                              </div>

                              {/* Amount */}
                              <div className="shrink-0 text-right hidden sm:block">
                                <p className="text-sm font-bold text-neutral-100">
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
                    <div className="shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 cursor-pointer"
                          >
                            <span className="text-lg leading-none">...</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="border-neutral-800 bg-neutral-950/95 backdrop-blur-xl"
                        >
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="text-neutral-300 focus:bg-neutral-800 focus:text-neutral-100 cursor-pointer"
                            >
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEdit(invoice)}
                            className="text-neutral-300 focus:bg-neutral-800 focus:text-neutral-100 cursor-pointer"
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(invoice.id)}
                            className="text-red-400 focus:bg-red-950/50 focus:text-red-300 cursor-pointer"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Mobile amount row */}
                  <div className="flex items-center justify-between mt-2 sm:hidden">
                    <p className={`text-xs ${due.className}`}>{due.text}</p>
                    <p className="text-sm font-bold text-neutral-100">
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
      />
    </div>
  )
}
