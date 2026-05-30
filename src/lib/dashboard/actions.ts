'use server'

import { createClient } from '@/lib/db/server'
import { sanitizeDatabaseError } from '@/lib/utils/security'

const ACTIVE_STATUSES = ['sent', 'due_soon', 'overdue'] as const

export async function getDashboardDataAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'You must be authenticated.' }

    // C7: Fetch all invoices for stats (exclude soft-deleted)
    const { data: allInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, amount, currency, status, due_date, invoice_number, title, client_id, reminder_count, last_reminder_at, created_at, clients (client_name, email, company_name)')
      .eq('user_id', user.id)
      .is('deleted_at', null)

    if (invoicesError) return { error: sanitizeDatabaseError(invoicesError) }

    const invoices = allInvoices ?? []

    // Calculate stats
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const activeInvoices = invoices.filter((inv) => {
      if (inv.status === 'paid' || inv.status === 'archived' || inv.status === 'draft') return false
      return true
    })

    const overdueInvoices = invoices.filter((inv) => {
      if (inv.status === 'paid' || inv.status === 'archived' || inv.status === 'draft') return false
      if (inv.status === 'overdue') return true
      // H8: Guard against null/undefined due_date
      if (!inv.due_date) return false
      const parseStr = (inv.due_date.includes('T') || inv.due_date.includes(' ')) ? inv.due_date : inv.due_date + 'T00:00:00'
      const due = new Date(parseStr)
      due.setHours(0, 0, 0, 0)
      return due < now
    })

    const paidInvoices = invoices.filter((inv) => inv.status === 'paid')

    function formatCurrencyMap(items: Array<{ amount: any; currency: string }>) {
      const map: Record<string, number> = {}
      items.forEach(inv => {
        const cur = inv.currency || 'USD'
        map[cur] = (map[cur] || 0) + Number(inv.amount)
      })
      const currencies = Object.keys(map).filter(c => map[c] > 0)
      if (currencies.length === 0) return '$0'
      return currencies.map(cur => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: cur,
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(map[cur])
      }).join(' + ')
    }

    const totalOutstandingFormatted = formatCurrencyMap(activeInvoices)
    const totalOverdueFormatted = formatCurrencyMap(overdueInvoices)
    const totalPaidFormatted = formatCurrencyMap(paidInvoices)

    const totalOutstanding = activeInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)

    // Build chase list: invoices that are NOT paid/archived AND are overdue or due within 3 days
    const threeDaysLater = new Date(now)
    threeDaysLater.setDate(now.getDate() + 3)
    threeDaysLater.setHours(23, 59, 59, 999)

    const statusPriority: Record<string, number> = {
      overdue: 0,
      partial: 1,
      due_soon: 2,
      sent: 3,
      promised: 4,
    }

    const chaseInvoices = invoices.filter((inv) => {
      if (['paid', 'archived', 'draft', 'paused'].includes(inv.status)) return false
      // H8: Guard against null/undefined due_date
      if (!inv.due_date) return false
      const due = new Date(inv.due_date + 'T00:00:00')
      return due <= threeDaysLater
    })

    const chaseList = chaseInvoices
      .sort((a, b) => {
        const priorityDiff = (statusPriority[a.status] ?? 3) - (statusPriority[b.status] ?? 3)
        if (priorityDiff !== 0) return priorityDiff
        // H8: Guard against null/undefined due_date in sort
        const aTime = a.due_date ? new Date(a.due_date).getTime() : Infinity
        const bTime = b.due_date ? new Date(b.due_date).getTime() : Infinity
        return aTime - bTime
      })
      .map((inv) => {
        const clientsData = inv.clients as any
        const client = Array.isArray(clientsData) ? clientsData[0] : clientsData
        return {
          id: inv.id,
          invoice_number: inv.invoice_number,
          title: inv.title,
          amount: Number(inv.amount),
          currency: inv.currency || 'USD',
          status: inv.status,
          due_date: inv.due_date,
          client_name: client?.client_name ?? 'Unknown',
          client_email: client?.email ?? null,
          company_name: client?.company_name ?? null,
          reminder_count: inv.reminder_count ?? 0,
          last_reminder_at: inv.last_reminder_at ?? null,
        }
      })

    // Fetch recent activities with safe column fallback
    let activitiesRes: any = await supabase
      .from('reminder_events')
      .select('id, event_type, description, created_at, invoice_id, invoices (invoice_number, title), reminder_drafts (tone), mail_subject, mail_body')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (activitiesRes.error && (activitiesRes.error.code === '42703' || activitiesRes.error.message?.includes('mail_subject'))) {
      activitiesRes = await supabase
        .from('reminder_events')
        .select('id, event_type, description, created_at, invoice_id, invoices (invoice_number, title), reminder_drafts (tone)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
    }

    if (activitiesRes.error) return { error: sanitizeDatabaseError(activitiesRes.error) }

    const activities = activitiesRes.data ?? []

    const recentActivities = (activities ?? []).map((act: any) => {
      const invoicesData = act.invoices as any
      const invoice = Array.isArray(invoicesData) ? invoicesData[0] : invoicesData
      const draftsData = act.reminder_drafts as any
      const draft = Array.isArray(draftsData) ? draftsData[0] : draftsData
      return {
        id: act.id,
        event_type: act.event_type,
        description: act.description,
        created_at: act.created_at,
        invoice_number: invoice?.invoice_number ?? null,
        invoice_title: invoice?.title ?? null,
        tone: draft?.tone ?? null,
        mail_subject: act.mail_subject ?? null,
        mail_body: act.mail_body ?? null,
      }
    })

    // Build recent invoices list (last 5 by created_at)
    const recentInvoices = [...invoices]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((inv) => {
        const clientsData = inv.clients as any
        const client = Array.isArray(clientsData) ? clientsData[0] : clientsData
        return {
          id: inv.id,
          invoice_number: inv.invoice_number,
          title: inv.title,
          amount: Number(inv.amount),
          currency: inv.currency || 'USD',
          status: inv.status,
          due_date: inv.due_date,
          client_name: client?.client_name ?? 'Unknown',
        }
      })

    // Build Aging Report grouped by currency for active unpaid invoices
    const agingReport: Record<string, { current: number; bucket30: number; bucket60: number; bucket90: number; bucket90Plus: number }> = {}

    activeInvoices.forEach((inv) => {
      const cur = inv.currency || 'USD'
      if (!agingReport[cur]) {
        agingReport[cur] = { current: 0, bucket30: 0, bucket60: 0, bucket90: 0, bucket90Plus: 0 }
      }

      const parseStr = (inv.due_date.includes('T') || inv.due_date.includes(' ')) ? inv.due_date : inv.due_date + 'T00:00:00'
      const due = new Date(parseStr)
      due.setHours(0, 0, 0, 0)
      const diffMs = now.getTime() - due.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      const amt = Number(inv.amount) || 0
      if (diffDays <= 0) {
        agingReport[cur].current += amt
      } else if (diffDays <= 30) {
        agingReport[cur].bucket30 += amt
      } else if (diffDays <= 60) {
        agingReport[cur].bucket60 += amt
      } else if (diffDays <= 90) {
        agingReport[cur].bucket90 += amt
      } else {
        agingReport[cur].bucket90Plus += amt
      }
    })

    return {
      success: true,
      data: {
        stats: {
          totalOutstanding,
          totalOverdue,
          totalPaid,
          totalOutstandingFormatted,
          totalOverdueFormatted,
          totalPaidFormatted,
          activeInvoicesCount: activeInvoices.length,
          overdueCount: overdueInvoices.length,
          paidCount: paidInvoices.length,
          clientsToChaseCount: chaseInvoices.length,
          totalInvoiceCount: invoices.length,
        },
        chaseList,
        recentActivities,
        recentInvoices,
        agingReport,
      },
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}
