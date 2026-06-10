import { InvoiceStatus } from '@/lib/constants/invoice-status'

export interface DashboardStats {
  totalOutstanding: number
  totalOverdue: number
  totalPaid: number
  activeInvoicesCount: number
  overdueCount: number
  paidCount: number
  clientsToChaseCount: number
  totalInvoiceCount: number
  totalOutstandingFormatted?: string
  totalOverdueFormatted?: string
}

export interface ChaseItem {
  id: string
  client_name: string
  invoice_number: string
  due_date: string
  status: InvoiceStatus
  last_reminder_at: string | null
  amount: number
  currency: string
}

export interface RecentActivity {
  id: string
  event_type: string
  description: string | null
  invoice_number?: string | null
  tone?: string | null
  created_at: string
  mail_subject?: string | null
  mail_body?: string | null
}

export interface RecentInvoice {
  id: string
  client_name: string
  amount: number
  currency: string
  due_date: string
  status: InvoiceStatus
}

export interface AgingBucket {
  current: number
  bucket30: number
  bucket60: number
  bucket90: number
  bucket90Plus: number
}

export type AgingReport = Record<string, AgingBucket>

export interface DashboardData {
  stats: DashboardStats
  chaseList: ChaseItem[]
  recentActivities: RecentActivity[]
  recentInvoices: RecentInvoice[]
  agingReport?: AgingReport
}
