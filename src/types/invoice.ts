import { InvoiceStatus } from '@/lib/constants/invoice-status'
import { Client } from './client'

export interface LineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

export interface Invoice {
  id: string
  user_id: string
  client_id: string
  invoice_number: string
  title: string | null
  description: string | null
  amount: number
  currency: string
  status: InvoiceStatus
  due_date: string
  notes: string | null
  payment_link: string | null
  po_number: string | null
  line_items: LineItem[] | null
  tax_rate: number
  tax_label: string
  discount_amount: number
  discount_type: 'flat' | 'percentage'
  deleted_at: string | null
  paid_date: string | null
  amount_paid: number | null
  reminder_count: number
  last_reminder_at: string | null
  created_at: string
  updated_at: string
  clients?: Client | null
}

export interface SoftDeletedInvoice {
  id: string
  invoice_number: string
  amount: number
  currency: string
  deleted_at: string
  clients: {
    client_name: string
    email: string | null
    company_name: string | null
  } | null
}
