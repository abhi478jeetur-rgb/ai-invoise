'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { markInvoicePaidAction } from '@/lib/invoices/actions'

interface ChaseCardProps {
  invoice: {
    id: string
    invoice_number: string
    title: string | null
    amount: number
    status: string
    due_date: string
    client_name: string
    company_name: string | null
  }
}

function getDueLabel(dueDate: string, status: string): { text: string; className: string } {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00')
  due.setHours(0, 0, 0, 0)
  const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (status === 'overdue') {
    const days = Math.abs(diffDays)
    return {
      text: days === 1 ? '1 day overdue' : `${days} days overdue`,
      className: 'text-red-400',
    }
  }
  if (diffDays === 0) return { text: 'Due today', className: 'text-yellow-400' }
  if (diffDays === 1) return { text: 'Due tomorrow', className: 'text-yellow-400' }
  if (diffDays > 0) return { text: `Due in ${diffDays} days`, className: 'text-muted-foreground' }
  return { text: 'Due', className: 'text-muted-foreground' }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
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


export function ChaseCard({ invoice }: ChaseCardProps) {
  const router = useRouter()
  const [markingPaid, setMarkingPaid] = useState(false)
  const due = getDueLabel(invoice.due_date, invoice.status)

  async function handleMarkPaid() {
    setMarkingPaid(true)
    try {
      const result = await markInvoicePaidAction(invoice.id)
      if (result.success) {
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to mark invoice as paid')
        setMarkingPaid(false)
      }
    } catch {
      toast.error('Network error. Failed to update invoice.')
      setMarkingPaid(false)
    }
  }

  return (
    <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/60 bg-secondary/30 hover:bg-card/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-1.5 h-8 rounded-full shrink-0 ${
          invoice.status === 'overdue' ? 'bg-red-500' :
          invoice.status === 'due_soon' ? 'bg-yellow-500' :
          'bg-blue-500'
        }`} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">
              {invoice.client_name}
            </p>
            <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${STATUS_STYLES[invoice.status] ?? 'bg-accent text-muted-foreground border-border'}`}>
              {invoice.status === 'due_soon' ? 'Due Soon' : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground font-mono">{invoice.invoice_number}</span>
            <span className="text-xs text-muted-foreground/60">&middot;</span>
            <span className="text-xs font-medium text-foreground/80">{formatCurrency(invoice.amount)}</span>
            <span className="text-xs text-muted-foreground/60">&middot;</span>
            <span className={`text-xs ${due.className}`}>{due.text}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleMarkPaid}
          disabled={markingPaid}
          className="h-7 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-green-950/30 cursor-pointer disabled:opacity-50"
        >
          {markingPaid ? '...' : 'Paid'}
        </Button>
        <Link href={`/invoices/${invoice.id}`}>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
          >
            Chase
          </Button>
        </Link>
      </div>
    </div>
  )
}
