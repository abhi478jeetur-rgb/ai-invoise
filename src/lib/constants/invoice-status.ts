export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  DUE_SOON: 'due_soon',
  OVERDUE: 'overdue',
  PAID: 'paid',
  PARTIAL: 'partial',
  PROMISED: 'promised',
  PAUSED: 'paused',
  ARCHIVED: 'archived',
} as const

export type InvoiceStatus = typeof INVOICE_STATUS[keyof typeof INVOICE_STATUS]
