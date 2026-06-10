export interface ReminderDraft {
  id: string
  user_id: string
  invoice_id: string
  tone: 'friendly' | 'professional' | 'firm' | 'final_notice'
  subject: string
  body: string
  status: 'generated' | 'sent' | 'archived'
  created_at: string
}

export interface ReminderEvent {
  id: string
  user_id: string
  invoice_id: string
  draft_id: string | null
  event_type: 'draft_generated' | 'draft_copied' | 'marked_sent' | 'status_changed'
  description: string | null
  mail_subject: string | null
  mail_body: string | null
  created_at: string
}

export interface ReminderHistoryEvent {
  id: string
  event_type: string
  description: string | null
  created_at: string
  tone: string | null
  draft_subject: string | null
  mail_subject: string | null
  mail_body: string | null
}
