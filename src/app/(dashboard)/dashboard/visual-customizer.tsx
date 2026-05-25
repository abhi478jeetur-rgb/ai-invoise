'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { QuickStartBanner } from '@/components/dashboard/QuickStartBanner'
import { UnbilledScratchpad } from '@/components/dashboard/UnbilledScratchpad'

interface DashboardData {
  stats: {
    totalOutstanding: number
    totalOverdue: number
    totalPaid: number
    activeInvoicesCount: number
    overdueCount: number
    paidCount: number
    clientsToChaseCount: number
    totalInvoiceCount: number
  }
  chaseList: any[]
  recentActivities: any[]
  recentInvoices: any[]
}

interface CustomizerProps {
  initialData: DashboardData
  setupPreference?: string
}

const THEME_PRESETS = [
  {
    name: 'Midnight Dark',
    bg: '#050505',
    cardBg: '#0a0a0a',
    border: '#151515',
    text: '#a3a3a3',
    titleText: '#f5f5f5',
    radius: 12,
    fontScale: 1.0,
    accent: '#10b981',
  },
  {
    name: 'Charcoal Slate',
    bg: '#171717',
    cardBg: '#262626',
    border: '#404040',
    text: '#d4d4d4',
    titleText: '#ffffff',
    radius: 16,
    fontScale: 1.0,
    accent: '#3b82f6',
  },
  {
    name: 'Nordic Light',
    bg: '#f8fafc',
    cardBg: '#ffffff',
    border: '#e2e8f0',
    text: '#475569',
    titleText: '#0f172a',
    radius: 10,
    fontScale: 1.0,
    accent: '#6366f1',
  },
  {
    name: 'Retro Amber',
    bg: '#0c0a09',
    cardBg: '#1c1917',
    border: '#292524',
    text: '#d6d3d1',
    titleText: '#f5f5f4',
    radius: 6,
    fontScale: 1.05,
    accent: '#f59e0b',
  }
]

export default function DashboardVisualCustomizer({ initialData, setupPreference }: CustomizerProps) {
  const { stats, chaseList, recentActivities, recentInvoices } = initialData

  // Load styling configuration with a hydration-safe pattern
  const [config, setConfig] = useState(THEME_PRESETS[0])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('chasefree-ui-config')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed) {
          setConfig({
            ...parsed,
            accent: '#10b981' // Force brand emerald green
          })
        }
      } catch (e) {
        // ignore error
      }
    }
  }, [])

  const [isOpen, setIsOpen] = useState(false)

  // Persist settings once mounted
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('chasefree-ui-config', JSON.stringify(config))
    }
  }, [config, mounted])

  const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
    setConfig(preset)
  }

  const resetToDefault = () => {
    setConfig({ ...THEME_PRESETS[0] })
  }

  // Create style variable payload
  const styleVariables = {
    '--user-bg': config.bg,
    '--user-card': config.cardBg,
    '--user-border': config.border,
    '--user-text': config.text,
    '--user-title': config.titleText,
    '--user-radius': `${config.radius}px`,
    '--user-font-scale': `${config.fontScale}`,
    '--user-accent': config.accent,
  } as React.CSSProperties

  const formatCurrencyWithCode = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatCurrency = (amount: number) => {
    return formatCurrencyWithCode(amount, 'USD')
  }

  function getUrgencyInfo(dueDateStr: string, status: string) {
    if (!dueDateStr) return { text: 'No due date', color: 'text-neutral-500 bg-neutral-900/40 border-neutral-900/60' };
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const parseStr = (dueDateStr.includes('T') || dueDateStr.includes(' ')) ? dueDateStr : dueDateStr + 'T00:00:00';
    const due = new Date(parseStr); due.setHours(0, 0, 0, 0);
    if (isNaN(due.getTime())) return { text: 'Invalid Date', color: 'text-neutral-500 bg-neutral-900/40 border-neutral-900/60' };
    
    const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (status === 'overdue' || diffDays < 0) {
      const days = Math.abs(diffDays);
      return { text: days === 0 ? 'Overdue today' : `Overdue by ${days} days`, color: 'text-red-400 bg-red-950/30 border-red-900/40' };
    }
    if (diffDays === 0) return { text: 'Due today', color: 'text-yellow-400 bg-yellow-950/30 border-yellow-900/40' };
    if (diffDays === 1) return { text: 'Due tomorrow', color: 'text-neutral-400 bg-neutral-900 border-neutral-800' };
    return { text: `Due in ${diffDays} days`, color: 'text-neutral-500 bg-neutral-900/40 border-neutral-900/60' };
  }

  function getLastRemindedText(lastRemindedAtStr: string | null) {
    if (!lastRemindedAtStr) return 'No reminder sent yet';
    const diffMins = Math.floor((new Date().getTime() - new Date(lastRemindedAtStr).getTime()) / 60000);
    if (diffMins < 60) return `Last reminded ${diffMins === 0 ? 'just now' : `${diffMins}m ago`}`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Last reminded ${diffHours}h ago`;
    return `Last reminded ${Math.floor(diffHours / 24)} days ago`;
  }

  // Due this week calculation
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const dueThisWeekInvoices = chaseList.filter((inv: any) => {
    if (!inv.due_date) return false
    const parseStr = (inv.due_date.includes('T') || inv.due_date.includes(' ')) ? inv.due_date : inv.due_date + 'T00:00:00'
    const due = new Date(parseStr)
    return due >= now && due <= weekFromNow && inv.status !== 'overdue'
  })

  const formatDueThisWeekAmount = () => {
    const map: Record<string, number> = {}
    dueThisWeekInvoices.forEach((inv: any) => {
      const cur = inv.currency || 'USD'
      map[cur] = (map[cur] || 0) + Number(inv.amount)
    })
    const currencies = Object.keys(map).filter(c => map[c] > 0)
    if (currencies.length === 0) return '$0'
    return currencies.map(cur => formatCurrencyWithCode(map[cur], cur)).join(' + ')
  }
  const dueThisWeekAmount = dueThisWeekInvoices.reduce((sum: number, inv: any) => sum + Number(inv.amount), 0)

  // chaseList is already pre-filtered and sorted by the server action
  // (only overdue or due within 3 days, excluding paid/archived)
  const displayChaseList = chaseList

  // Tone badge styles
  const toneStyles: Record<string, string> = {
    friendly: 'text-green-400 bg-green-950/30 border-green-900/40',
    professional: 'text-blue-400 bg-blue-950/30 border-blue-900/40',
    firm: 'text-yellow-400 bg-yellow-950/30 border-yellow-900/40',
    final_notice: 'text-red-400 bg-red-950/30 border-red-900/40',
  }

  const STATUS_STYLES: Record<string, string> = {
    draft: 'bg-neutral-800 text-neutral-400 border-neutral-700',
    sent: 'bg-blue-950/40 text-blue-400 border-blue-900/50',
    due_soon: 'bg-yellow-950/40 text-yellow-400 border-yellow-900/50',
    overdue: 'bg-red-950/40 text-red-400 border-red-900/50',
    paid: 'bg-green-950/40 text-green-400 border-green-900/50',
    archived: 'bg-neutral-800/50 text-neutral-500 border-neutral-700/50',
  }

  const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    sent: 'Sent',
    due_soon: 'Due Soon',
    overdue: 'Overdue',
    paid: 'Paid',
    archived: 'Archived',
  }

  function formatRelativeTime(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHr / 24)
    if (diffMin < 60) return diffMin <= 1 ? 'Just now' : `${diffMin}m ago`
    if (diffHr < 24) return `${diffHr}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div style={styleVariables} className="min-h-screen transition-colors duration-300 relative select-none">

      {/* Dynamic Background Injector wrapper */}
      <style jsx global>{`
        body {
          background-color: var(--user-bg) !important;
          transition: background-color 0.3s ease;
        }
      `}</style>

      {/* Main Dashboard layout */}
      <div className="space-y-10 max-w-6xl mx-auto pb-20">

        {/* 1. Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--user-title)', fontSize: 'calc(1.5rem * var(--user-font-scale))' }}>
              Dashboard
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--user-text)', opacity: 0.7 }}>
              Track unpaid invoices and know who to follow up with today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/invoices"
              className="px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border)', color: 'var(--user-text)' }}
            >
              View Invoices
            </Link>
            <Link
              href="/invoices?new=true"
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--user-accent)', color: '#000' }}
            >
              + Add Invoice
            </Link>
          </div>
        </div>

        {/* 2. Quick Start Banner (empty state) or Summary Cards */}
        <div>
          {setupPreference !== 'completed' && <QuickStartBanner />}
        </div>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

          {/* Unpaid */}
          <div
            className="border p-5 transition-all"
            style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border)', borderRadius: 'var(--user-radius)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--user-text)', opacity: 0.6 }}>Unpaid</p>
            <p className="text-xl font-semibold tracking-tight mt-2 font-mono" style={{ color: 'var(--user-title)' }}>
              {(stats as any).totalOutstandingFormatted || formatCurrency(stats.totalOutstanding)}
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--user-text)', opacity: 0.5 }}>
              {stats.activeInvoicesCount} unpaid invoices
            </p>
          </div>

          {/* Overdue */}
          <div
            className="border p-5 transition-all"
            style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border)', borderRadius: 'var(--user-radius)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--user-text)', opacity: 0.6 }}>Overdue</p>
            <p className="text-xl font-semibold tracking-tight mt-2 text-rose-500 font-mono">
              {(stats as any).totalOverdueFormatted || formatCurrency(stats.totalOverdue)}
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--user-text)', opacity: 0.5 }}>
              {stats.overdueCount} overdue invoices
            </p>
          </div>

          {/* Due This Week */}
          <div
            className="border p-5 transition-all"
            style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border)', borderRadius: 'var(--user-radius)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--user-text)', opacity: 0.6 }}>Due This Week</p>
            <p className="text-xl font-semibold tracking-tight mt-2 font-mono" style={{ color: 'var(--user-title)' }}>
              {formatDueThisWeekAmount()}
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--user-text)', opacity: 0.5 }}>
              {dueThisWeekInvoices.length} due in 7 days
            </p>
          </div>

          {/* Clients to Chase */}
          <div
            className="border p-5 transition-all"
            style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border)', borderRadius: 'var(--user-radius)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--user-text)', opacity: 0.6 }}>Clients to Chase</p>
            <p className="text-2xl font-semibold tracking-tight mt-2" style={{ color: 'var(--user-title)' }}>
              {stats.clientsToChaseCount}
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--user-text)', opacity: 0.5 }}>
              {stats.clientsToChaseCount} follow-ups recommended
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <UnbilledScratchpad />
                
                {/* 3. Who to Chase Today */}
                <div
                  className="border p-6"
          style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border)', borderRadius: 'var(--user-radius)' }}
        >
          <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--user-border)' }}>
            <h3 className="tracking-wider font-semibold text-[10px] text-neutral-500 uppercase">
              Who to Chase Today
            </h3>
            {displayChaseList.length > 0 && (
              <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--user-text)', opacity: 0.6 }}>
                {displayChaseList.length} invoice{displayChaseList.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="mt-4">
            {displayChaseList.length === 0 ? (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg border mb-4" style={{ backgroundColor: 'var(--user-bg)', borderColor: 'var(--user-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--user-accent)' }}>&#10003;</span>
                </div>
                <h4 className="text-xs font-semibold mb-1" style={{ color: 'var(--user-title)' }}>All clear</h4>
                <p className="text-[11px] max-w-xs mx-auto" style={{ color: 'var(--user-text)', opacity: 0.7 }}>
                  No invoices need chasing right now. When invoices become due soon or overdue, they&apos;ll appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayChaseList.map((invoice: any) => {
                  const urgency = getUrgencyInfo(invoice.due_date, invoice.status)
                  return (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 rounded-lg border transition-colors hover:opacity-90"
                      style={{ borderColor: 'var(--user-border)', backgroundColor: 'var(--user-bg)' }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-1.5 h-10 rounded-full shrink-0"
                          style={{
                            backgroundColor: invoice.status === 'overdue' ? '#ef4444' :
                              invoice.status === 'due_soon' ? '#eab308' :
                                'var(--user-accent)',
                          }}
                        />
                        <div className="min-w-0 space-y-1.5">
                          {/* Top row: Client name + Invoice number chip */}
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--user-title)' }}>
                              {invoice.client_name}
                            </p>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono shrink-0" style={{ color: 'var(--user-text)', opacity: 0.6 }}>
                              {invoice.invoice_number}
                            </span>
                          </div>
                          {/* Bottom row: Urgency badge + Due date + Last reminded */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border ${urgency.color}`}>
                              {urgency.text}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-neutral-900/60 border border-neutral-800/60 text-[10px] font-mono" style={{ color: 'var(--user-text)', opacity: 0.6 }}>
                              {new Date(invoice.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-neutral-900/40 border border-neutral-800/40 text-[10px]" style={{ color: 'var(--user-text)', opacity: 0.5 }}>
                              {getLastRemindedText(invoice.last_reminder_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <p className="text-base font-bold font-mono" style={{ color: 'var(--user-title)' }}>
                          {formatCurrencyWithCode(invoice.amount, invoice.currency)}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/invoices/${invoice.id}?reminder=true`}
                            className="px-2.5 py-1.5 rounded-md text-[10px] font-semibold transition-all hover:opacity-80"
                            style={{ backgroundColor: 'var(--user-accent)', color: '#000' }}
                          >
                            Generate Reminder
                          </Link>
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="px-2.5 py-1.5 rounded-md border text-[10px] font-medium transition-all hover:opacity-80"
                            style={{ borderColor: 'var(--user-border)', color: 'var(--user-text)' }}
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 4. Recent Invoices Table */}
        <div
          className="border p-6"
          style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border)', borderRadius: 'var(--user-radius)' }}
        >
          <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--user-border)' }}>
            <h3 className="tracking-wider font-semibold text-[10px] text-neutral-500 uppercase">
              Recent Invoices
            </h3>
            <Link href="/invoices" className="text-[10px] hover:underline" style={{ color: 'var(--user-accent)' }}>
              View all
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            {recentInvoices.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[11px]" style={{ color: 'var(--user-text)', opacity: 0.5 }}>
                  No invoices created yet.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--user-border)' }}>
                    <th className="py-2 pr-4 font-semibold text-[10px] uppercase tracking-wider" style={{ color: 'var(--user-text)', opacity: 0.6 }}>Client</th>
                    <th className="py-2 pr-4 font-semibold text-[10px] uppercase tracking-wider text-right" style={{ color: 'var(--user-text)', opacity: 0.6 }}>Amount</th>
                    <th className="py-2 pr-4 font-semibold text-[10px] uppercase tracking-wider" style={{ color: 'var(--user-text)', opacity: 0.6 }}>Due Date</th>
                    <th className="py-2 pr-4 font-semibold text-[10px] uppercase tracking-wider" style={{ color: 'var(--user-text)', opacity: 0.6 }}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--user-border)', opacity: 0.8 }}>
                  {recentInvoices.map((inv: any) => (
                    <tr key={inv.id} className="transition-colors hover:opacity-80">
                      <td className="py-2.5 pr-4 text-[11px]" style={{ color: 'var(--user-text)' }}>{inv.client_name}</td>
                      <td className="py-2.5 pr-4 text-[11px] font-medium font-mono text-right" style={{ color: 'var(--user-title)' }}>{formatCurrencyWithCode(inv.amount, inv.currency)}</td>
                      <td className="py-2.5 pr-4 text-[11px] font-mono" style={{ color: 'var(--user-text)' }}>
                        {new Date(inv.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-medium rounded border ${STATUS_STYLES[inv.status] ?? ''}`}>
                          {STATUS_LABELS[inv.status] ?? inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 5. Recent Reminder Activity */}
        <div
          className="border p-6 mt-8"
          style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border)', borderRadius: 'var(--user-radius)' }}
        >
          <h3 className="tracking-wider font-semibold text-[10px] text-neutral-500 uppercase pb-4 border-b" style={{ borderColor: 'var(--user-border)' }}>
            Recent Reminder Activity
          </h3>

          <div className="mt-4">
            {recentActivities.length === 0 ? (
              <div className="py-10 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg border mb-3" style={{ backgroundColor: 'var(--user-bg)', borderColor: 'var(--user-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--user-text)', opacity: 0.4 }}>&#9993;</span>
                </div>
                <p className="text-[11px]" style={{ color: 'var(--user-text)', opacity: 0.5 }}>
                  No reminder activity yet. Generate a draft to see it here.
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {recentActivities.map((activity: any, idx: number) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-6 h-6 rounded-full border flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'var(--user-bg)', borderColor: 'var(--user-border)' }}
                      >
                        <span className="text-[8px] font-bold" style={{ color: 'var(--user-accent)' }}>
                          {activity.event_type === 'draft_generated' ? 'AI' :
                            activity.event_type === 'draft_copied' ? 'C' :
                              activity.event_type === 'marked_sent' ? 'S' :
                                activity.event_type === 'status_changed' ? '~' : '?'}
                        </span>
                      </div>
                      {idx < recentActivities.length - 1 && (
                        <div className="w-px flex-1 my-1" style={{ backgroundColor: 'var(--user-border)' }} />
                      )}
                    </div>
                    <div className="pb-4 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--user-text)' }}>
                          {activity.description || activity.event_type}
                        </p>
                        {activity.invoice_number && (
                          <span className="text-[10px] font-mono" style={{ color: 'var(--user-text)', opacity: 0.4 }}>
                            #{activity.invoice_number}
                          </span>
                        )}
                        {activity.tone && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded border capitalize ${toneStyles[activity.tone] ?? ''}`}>
                            {activity.tone.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] mt-0.5 font-mono" style={{ color: 'var(--user-text)', opacity: 0.4 }}>
                        {formatRelativeTime(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
    </div>
  )
}
