'use server'

import { createClient } from '@/lib/db/server'
import { sanitizeDatabaseError } from '@/lib/utils/security'
import { logError } from '@/lib/utils/error-handler'
import { unstable_cache } from 'next/cache'

const ACTIVE_STATUSES = ['sent', 'due_soon', 'overdue'] as const

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

async function fetchDashboardDataRaw(userId: string, accessToken: string) {
  console.log(`[Cache] MISS - Fetching fresh dashboard data for user ${userId} from Supabase`)
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false
      }
    }
  )

  const { data: allInvoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('id, amount, currency, status, due_date, invoice_number, title, client_id, reminder_count, last_reminder_at, paid_date, created_at, clients (client_name, email, company_name)')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .limit(500)

  if (invoicesError) throw new Error(sanitizeDatabaseError(invoicesError))

  const invoices = allInvoices ?? []

  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const activeInvoices = invoices.filter((inv) => {
    if (inv.status === 'paid' || inv.status === 'archived' || inv.status === 'draft') return false
    return true
  })

  const overdueInvoices = invoices.filter((inv) => {
    if (inv.status === 'paid' || inv.status === 'archived' || inv.status === 'draft') return false
    if (inv.status === 'overdue') return true
    if (!inv.due_date) return false
    const parseStr = (inv.due_date.includes('T') || inv.due_date.includes(' ')) ? inv.due_date : inv.due_date + 'T00:00:00'
    const due = new Date(parseStr)
    due.setHours(0, 0, 0, 0)
    return due < now
  })

  const paidInvoices = invoices.filter((inv) => inv.status === 'paid')

  function formatCurrencyMap(items: Array<{ amount: number; currency: string }>) {
    const map: Record<string, number> = {}
    items.forEach(inv => {
      const cur = inv.currency || 'USD'
      map[cur] = (map[cur] || 0) + Number(inv.amount)
    })
    const currencies = Object.keys(map).filter(c => map[c] > 0)
    if (currencies.length === 0) return '$0'
    return currencies.map(cur => {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: cur,
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(map[cur])
      } catch {
        return `${cur} ${map[cur].toFixed(2)}`
      }
    }).join(' + ')
  }

  const totalOutstandingFormatted = formatCurrencyMap(activeInvoices)
  const totalOverdueFormatted = formatCurrencyMap(overdueInvoices)
  const totalPaidFormatted = formatCurrencyMap(paidInvoices)

  const totalOutstanding = activeInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)

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
    if (!inv.due_date) return false
    const due = new Date(inv.due_date + 'T00:00:00')
    return due <= threeDaysLater
  })

  const chaseList = chaseInvoices
    .sort((a, b) => {
      const priorityDiff = (statusPriority[a.status] ?? 3) - (statusPriority[b.status] ?? 3)
      if (priorityDiff !== 0) return priorityDiff
      const aTime = a.due_date ? new Date(a.due_date).getTime() : Infinity
      const bTime = b.due_date ? new Date(b.due_date).getTime() : Infinity
      return aTime - bTime
    })
    .map((inv) => {
      const clientsData = inv.clients as unknown as { client_name: string; email: string | null; company_name: string | null }
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

  let activitiesRes: { data: Record<string, unknown>[] | null; error: { code?: string; message?: string } | null } = await supabase
    .from('reminder_events')
    .select('id, event_type, description, created_at, invoice_id, invoices!inner (invoice_number, title, deleted_at), reminder_drafts (tone), mail_subject, mail_body')
    .eq('user_id', userId)
    .is('invoices.deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  if (activitiesRes.error && (activitiesRes.error.code === '42703' || activitiesRes.error.message?.includes('mail_subject'))) {
    activitiesRes = await supabase
      .from('reminder_events')
      .select('id, event_type, description, created_at, invoice_id, invoices!inner (invoice_number, title, deleted_at), reminder_drafts (tone)')
      .eq('user_id', userId)
      .is('invoices.deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5)
  }

  if (activitiesRes.error) throw new Error(sanitizeDatabaseError(activitiesRes.error))

  const activities = activitiesRes.data ?? []

  interface ActivityRow {
    id: string
    event_type: string
    description: string | null
    created_at: string
    invoice_id: string
    invoices: unknown
    reminder_drafts: unknown
    mail_subject?: string | null
    mail_body?: string | null
  }

  const recentActivities = (activities as unknown as ActivityRow[]).map((act) => {
    const invoicesData = act.invoices as { invoice_number: string; title: string | null } | null
    const invoice = Array.isArray(invoicesData) ? invoicesData[0] : invoicesData
    const draftsData = act.reminder_drafts as { tone: string } | null
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

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((inv) => {
      const clientsData = inv.clients as unknown as { client_name: string } | null
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

  // Calculate average days to paid
  const paidWithDates = invoices.filter(inv => inv.status === 'paid' && inv.paid_date && inv.created_at)
  let totalPaidDays = 0
  paidWithDates.forEach(inv => {
    const created = new Date(inv.created_at)
    created.setHours(0, 0, 0, 0)
    const paid = new Date(inv.paid_date + 'T00:00:00')
    paid.setHours(0, 0, 0, 0)
    const diffDays = Math.max(0, Math.floor((paid.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)))
    totalPaidDays += diffDays
  })
  const averageDaysToPaid = paidWithDates.length > 0 ? Math.round(totalPaidDays / paidWithDates.length) : 0

  // Calculate 6-month historical monthly trend (Invoiced vs Collected)
  const monthlyTrend: Array<{ month: string; invoiced: number; collected: number }> = []
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const year = d.getFullYear()
    const month = d.getMonth()
    const label = monthNames[month]

    const invoicedAmt = invoices
      .filter(inv => {
        if (!inv.created_at) return false
        const cDate = new Date(inv.created_at)
        return cDate.getFullYear() === year && cDate.getMonth() === month
      })
      .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0)

    const collectedAmt = invoices
      .filter(inv => {
        if (inv.status !== 'paid') return false
        const refDateStr = inv.paid_date ? inv.paid_date + 'T00:00:00' : inv.created_at
        if (!refDateStr) return false
        const pDate = new Date(refDateStr)
        return pDate.getFullYear() === year && pDate.getMonth() === month
      })
      .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0)

    monthlyTrend.push({
      month: label,
      invoiced: invoicedAmt,
      collected: collectedAmt
    })
  }

  return {
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
      averageDaysToPaid,
    },
    chaseList,
    recentActivities,
    recentInvoices,
    agingReport,
    monthlyTrend,
  }
}

function getCachedDashboardData(userId: string, accessToken: string) {
  return unstable_cache(
    async () => fetchDashboardDataRaw(userId, accessToken),
    ['dashboard-analytics-key', userId],
    {
      revalidate: false,
      tags: [`dashboard-analytics-${userId}`],
    }
  )()
}

export async function getDashboardDataAction() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || !session.user) return { error: 'You must be authenticated.' }

    const userId = session.user.id
    const accessToken = session.access_token

    const data = await getCachedDashboardData(userId, accessToken)

    return {
      success: true,
      data,
    }
  } catch (e) {
    logError('dashboard/getDashboardData', e)
    return { error: e instanceof Error ? e.message : 'An unexpected error occurred.' }
  }
}
