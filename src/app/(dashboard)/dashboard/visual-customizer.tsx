'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { QuickStartBanner } from '@/components/dashboard/QuickStartBanner'
import { useTheme } from 'next-themes'


import { DashboardData, RecentActivity, ChaseItem, RecentInvoice } from '@/types/dashboard'

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
    name: 'Nordic Light',
    bg: '#ffffff',
    cardBg: '#ffffff',
    border: '#f3f4f6',
    text: '#4b5563',
    titleText: '#111827',
    radius: 12,
    fontScale: 1.0,
    accent: '#10b981',
  }
]

export default function DashboardVisualCustomizer({ initialData, setupPreference }: CustomizerProps) {
  const { stats, chaseList, recentActivities, recentInvoices, agingReport = {} } = initialData
  const [selectedActivity, setSelectedActivity] = useState<RecentActivity | null>(null)

  const { resolvedTheme } = useTheme()
  const isLight = resolvedTheme === 'light'

  // Load styling configuration with a hydration-safe pattern
  const [config, setConfig] = useState(THEME_PRESETS[0])
  const [mounted, setMounted] = useState(false)

  // L3: Consolidated single useEffect for theme config (prevents localStorage overwrite on theme switch)
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('chasefree-ui-config')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed) {
          const isSavedLight = parsed.bg === '#ffffff' || parsed.bg === '#fafafa' || parsed.bg === '#f8fafc'
          const shouldOverride = isLight !== isSavedLight

          setConfig({
            ...(shouldOverride ? (isLight ? THEME_PRESETS[1] : THEME_PRESETS[0]) : parsed),
            accent: '#10b981'
          })
          return
        }
      } catch (e) {
        // ignore error
      }
    }

    setConfig(isLight ? THEME_PRESETS[1] : THEME_PRESETS[0])
  }, [isLight])

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
    setConfig({ ...THEME_PRESETS[isLight ? 1 : 0] })
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
    if (!dueDateStr) return { text: 'No due date', color: 'text-muted-foreground bg-card/40 border-border/60' };
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const parseStr = (dueDateStr.includes('T') || dueDateStr.includes(' ')) ? dueDateStr : dueDateStr + 'T00:00:00';
    const due = new Date(parseStr); due.setHours(0, 0, 0, 0);
    if (isNaN(due.getTime())) return { text: 'Invalid Date', color: 'text-muted-foreground bg-card/40 border-border/60' };
    
    const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (status === 'overdue' || diffDays < 0) {
      const days = Math.abs(diffDays);
      return { text: days === 0 ? 'Overdue today' : `Overdue by ${days} days`, color: 'text-red-400 bg-red-950/30 border-red-900/40' };
    }
    if (diffDays === 0) return { text: 'Due today', color: 'text-yellow-400 bg-yellow-950/30 border-yellow-900/40' };
    if (diffDays === 1) return { text: 'Due tomorrow', color: 'text-muted-foreground bg-secondary border-border' };
    return { text: `Due in ${diffDays} days`, color: 'text-muted-foreground bg-card/40 border-border/60' };
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
  const dueThisWeekInvoices = chaseList.filter((inv: ChaseItem) => {
    if (!inv.due_date) return false
    const parseStr = (inv.due_date.includes('T') || inv.due_date.includes(' ')) ? inv.due_date : inv.due_date + 'T00:00:00'
    const due = new Date(parseStr)
    return due >= now && due <= weekFromNow && inv.status !== 'overdue'
  })

  const formatDueThisWeekAmount = () => {
    const map: Record<string, number> = {}
    dueThisWeekInvoices.forEach((inv: ChaseItem) => {
      const cur = inv.currency || 'USD'
      map[cur] = (map[cur] || 0) + Number(inv.amount)
    })
    const currencies = Object.keys(map).filter(c => map[c] > 0)
    if (currencies.length === 0) return '$0'
    return currencies.map(cur => formatCurrencyWithCode(map[cur], cur)).join(' + ')
  }
  const dueThisWeekAmount = dueThisWeekInvoices.reduce((sum: number, inv: ChaseItem) => sum + Number(inv.amount), 0)

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
      <div className="space-y-6 max-w-6xl mx-auto pb-10">

        {/* 1. Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-end gap-4">
          <div className="flex items-center gap-2">
            <Link
              href="/invoices"
              className="px-3 py-1.5 rounded-lg border text-sm font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border)', color: 'var(--user-text)' }}
            >
              View Invoices
            </Link>
            <Link
              href="/invoices?new=true"
              className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--user-accent)', color: '#000' }}
            >
              + Add Invoice
            </Link>
          </div>
        </div>

        {/* 2. Quick Start Banner (empty state) or Summary Cards */}
        <div>
          {setupPreference !== 'completed' && stats.totalInvoiceCount === 0 && <QuickStartBanner />}
        </div>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

          {/* Unpaid */}
          <div
            className="border py-2 px-3 transition-all"
            style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border)', borderRadius: 'var(--user-radius)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--user-text)', opacity: 0.6 }}>Unpaid</p>
            <p className="text-xl font-semibold tracking-tight mt-0.5 font-mono" style={{ color: 'var(--user-title)' }}>
              {stats.totalOutstandingFormatted || formatCurrency(stats.totalOutstanding)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--user-text)', opacity: 0.5 }}>
              {stats.activeInvoicesCount} unpaid invoices
            </p>
          </div>

          {/* Overdue */}
          <div
            className="border py-2 px-3 transition-all"
            style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border)', borderRadius: 'var(--user-radius)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--user-text)', opacity: 0.6 }}>Overdue</p>
            <p className="text-xl font-semibold tracking-tight mt-0.5 text-rose-500 font-mono">
              {stats.totalOverdueFormatted || formatCurrency(stats.totalOverdue)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--user-text)', opacity: 0.5 }}>
              {stats.overdueCount} overdue invoices
            </p>
          </div>

          {/* Due This Week */}
          <div
            className="border py-2 px-3 transition-all"
            style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border)', borderRadius: 'var(--user-radius)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--user-text)', opacity: 0.6 }}>Due This Week</p>
            <p className="text-xl font-semibold tracking-tight mt-0.5 font-mono" style={{ color: 'var(--user-title)' }}>
              {formatDueThisWeekAmount()}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--user-text)', opacity: 0.5 }}>
              {dueThisWeekInvoices.length} due in 7 days
            </p>
          </div>

          {/* Clients to Chase */}
          <div
            className="border py-2 px-3 transition-all"
            style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border)', borderRadius: 'var(--user-radius)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--user-text)', opacity: 0.6 }}>Clients to Chase</p>
            <p className="text-xl font-semibold tracking-tight mt-0.5" style={{ color: 'var(--user-title)' }}>
              {stats.clientsToChaseCount}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--user-text)', opacity: 0.5 }}>
              {stats.clientsToChaseCount} follow-ups recommended
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
                
                {/* 3. Who to Chase Today */}
                <div
                  className="border p-4 sm:p-6"
          style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border)', borderRadius: 'var(--user-radius)' }}
        >
          <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--user-border)' }}>
            <h3 className="tracking-wider font-semibold text-xs text-muted-foreground uppercase">
              Who to Chase Today
            </h3>
            {displayChaseList.length > 0 && (
              <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--user-text)', opacity: 0.6 }}>
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
                <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--user-text)', opacity: 0.7 }}>
                  No invoices need chasing right now. When invoices become due soon or overdue, they&apos;ll appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayChaseList.map((invoice: ChaseItem) => {
                  const urgency = getUrgencyInfo(invoice.due_date, invoice.status)
                  return (
                    <div
                      key={invoice.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition-colors hover:opacity-90 gap-4"
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
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary border border-border text-xs font-mono shrink-0" style={{ color: 'var(--user-text)', opacity: 0.6 }}>
                              {invoice.invoice_number}
                            </span>
                          </div>
                          {/* Bottom row: Urgency badge + Due date + Last reminded */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${urgency.color}`}>
                              {urgency.text}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary/60 border border-border/60 text-xs font-mono" style={{ color: 'var(--user-text)', opacity: 0.6 }}>
                              {new Date(invoice.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-card/40 border border-border/40 text-xs" style={{ color: 'var(--user-text)', opacity: 0.5 }}>
                              {getLastRemindedText(invoice.last_reminder_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 sm:ml-4">
                        <p className="text-base font-bold font-mono" style={{ color: 'var(--user-title)' }}>
                          {formatCurrencyWithCode(invoice.amount, invoice.currency)}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/invoices/${invoice.id}?reminder=true`}
                            className="px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all hover:opacity-80"
                            style={{ backgroundColor: 'var(--user-accent)', color: '#000' }}
                          >
                            Generate Reminder
                          </Link>
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all hover:opacity-80"
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
          className="border p-4 sm:p-6"
          style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border)', borderRadius: 'var(--user-radius)' }}
        >
          <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--user-border)' }}>
            <h3 className="tracking-wider font-semibold text-xs text-muted-foreground uppercase">
              Recent Invoices
            </h3>
            <Link href="/invoices" className="text-xs hover:underline" style={{ color: 'var(--user-accent)' }}>
              View all
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            {recentInvoices.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: 'var(--user-text)', opacity: 0.5 }}>
                  No invoices created yet.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--user-border)' }}>
                    <th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--user-text)', opacity: 0.6 }}>Client</th>
                    <th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider text-right" style={{ color: 'var(--user-text)', opacity: 0.6 }}>Amount</th>
                    <th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--user-text)', opacity: 0.6 }}>Due Date</th>
                    <th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--user-text)', opacity: 0.6 }}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--user-border)', opacity: 0.8 }}>
                  {recentInvoices.map((inv: RecentInvoice) => (
                    <tr key={inv.id} className="transition-colors hover:opacity-80">
                      <td className="py-2.5 pr-4 text-sm" style={{ color: 'var(--user-text)' }}>{inv.client_name}</td>
                      <td className="py-2.5 pr-4 text-sm font-medium font-mono text-right" style={{ color: 'var(--user-title)' }}>{formatCurrencyWithCode(inv.amount, inv.currency)}</td>
                      <td className="py-2.5 pr-4 text-sm font-mono" style={{ color: 'var(--user-text)' }}>
                        {new Date(inv.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${STATUS_STYLES[inv.status] ?? ''}`}>
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
          className="border p-4 sm:p-6 mt-8"
          style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border)', borderRadius: 'var(--user-radius)' }}
        >
          <h3 className="tracking-wider font-semibold text-xs text-muted-foreground uppercase pb-4 border-b" style={{ borderColor: 'var(--user-border)' }}>
            Recent Reminder Activity
          </h3>

          <div className="mt-4">
            {recentActivities.length === 0 ? (
              <div className="py-10 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg border mb-3" style={{ backgroundColor: 'var(--user-bg)', borderColor: 'var(--user-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--user-text)', opacity: 0.4 }}>&#9993;</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--user-text)', opacity: 0.5 }}>
                  No reminder activity yet. Generate a draft to see it here.
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {recentActivities.map((activity: RecentActivity, idx: number) => (
                  <div 
                    key={activity.id} 
                    className="flex gap-3 cursor-pointer hover:bg-white/[0.01] p-1.5 rounded-lg transition-all"
                    onClick={() => setSelectedActivity(activity)}
                    title="Click to view full archived reminder"
                  >
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
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--user-text)' }}>
                          {activity.description || activity.event_type}
                        </p>
                        {activity.invoice_number && (
                          <span className="text-xs font-mono" style={{ color: 'var(--user-text)', opacity: 0.4 }}>
                            #{activity.invoice_number}
                          </span>
                        )}
                        {activity.tone && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded border capitalize ${toneStyles[activity.tone] ?? ''}`}>
                            {activity.tone.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--user-text)', opacity: 0.4 }}>
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

      {/* Aging Report / Right Column Widget (Phase 3) */}
      <div className="lg:col-span-1 space-y-5">
        <div
          className="border p-4 sm:p-6"
          style={{ backgroundColor: 'var(--user-card)', borderColor: 'var(--user-border)', borderRadius: 'var(--user-radius)' }}
        >
          <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--user-border)' }}>
            <h3 className="tracking-wider font-semibold text-xs text-muted-foreground uppercase">
              Outstanding Aging
            </h3>
          </div>

          <div className="mt-6 space-y-8">
            {Object.keys(agingReport).length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color: 'var(--user-text)', opacity: 0.5 }}>
                No outstanding aging balances.
              </div>
            ) : (
              Object.entries(agingReport).map(([cur, buckets]) => {
                const total = buckets.current + buckets.bucket30 + buckets.bucket60 + buckets.bucket90 + buckets.bucket90Plus
                if (total === 0) return null

                const getPct = (val: number) => (total > 0 ? (val / total) * 105 : 0)

                const list = [
                  { label: 'Current (Not Overdue)', value: buckets.current, color: 'var(--user-accent)' },
                  { label: '1 - 30 Days Overdue', value: buckets.bucket30, color: '#eab308' },
                  { label: '31 - 60 Days Overdue', value: buckets.bucket60, color: '#f97316' },
                  { label: '61 - 90 Days Overdue', value: buckets.bucket90, color: '#f43f5e' },
                  { label: '90+ Days Overdue', value: buckets.bucket90Plus, color: '#ef4444' },
                ]

                return (
                  <div key={cur} className="space-y-4">
                    {Object.keys(agingReport).length > 1 && (
                      <h4 className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-wider">
                        {cur} Aging Portfolio
                      </h4>
                    )}

                    <div className="space-y-4">
                      {list.map((b) => {
                        const pct = getPct(b.value)
                        return (
                          <div key={b.label} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground font-medium text-xs">{b.label}</span>
                              <span className="font-mono font-semibold text-xs" style={{ color: 'var(--user-title)' }}>
                                {formatCurrencyWithCode(b.value, cur)}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-background/80 overflow-hidden border border-white/[0.03]">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  backgroundColor: b.color,
                                  width: `${Math.max(0, Math.min(100, pct))}%`
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      </div> {/* Closes the main 3-column grid (line 340) */}

      {/* 6. Archived Reminder Detail Dialog (Phase 4) */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
          <div 
            className="w-full max-w-lg border p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
            style={{ 
              backgroundColor: 'var(--user-card)', 
              borderColor: 'var(--user-border)', 
              borderRadius: 'var(--user-radius)',
              color: 'var(--user-text)' 
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--user-border)' }}>
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--user-title)' }}>
                Reminder Audit Log Details
              </h3>
              <button 
                onClick={() => setSelectedActivity(null)}
                className="text-xs hover:opacity-80 px-2 py-1 rounded bg-secondary border border-border text-muted-foreground cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Activity Description</p>
                <p className="text-xs" style={{ color: 'var(--user-title)' }}>{selectedActivity.description}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Event Type</p>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary border border-border text-xs font-mono capitalize">
                  {selectedActivity.event_type.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Timestamp</p>
                <p className="text-xs font-mono">{new Date(selectedActivity.created_at).toLocaleString()}</p>
              </div>

              {selectedActivity.mail_subject ? (
                <>
                  <div className="space-y-1 pt-2 border-t" style={{ borderColor: 'var(--user-border)' }}>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Archived Subject</p>
                    <p className="text-xs font-semibold" style={{ color: 'var(--user-title)' }}>{selectedActivity.mail_subject}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Archived Body Text</p>
                    <div className="p-4 bg-background/60 rounded-lg border border-white/[0.03] text-xs font-sans whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {selectedActivity.mail_body}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-3 bg-blue-950/20 border border-blue-900/30 text-blue-400 rounded-lg text-xs leading-relaxed">
                  ℹ️ This event does not contain an archived message body. AI message bodies are permanently archived for reminder drafts generated after v2.5.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
    </div>
  )
}
