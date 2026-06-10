export interface UserProfile {
  full_name: string
  email: string
  default_currency: string
  reminder_enabled: boolean
  reminder_day: string
  reminder_time: string
  company_name: string
  company_address: string
  company_website: string
  tax_id: string
  logo_url: string
  bank_details: string
  payment_link_default: string
  global_rules: Record<string, string>
  default_tax_label: string
  default_tax_rate: number | null
  default_payment_terms: string
}

export interface AISettings {
  base_url: string
  provider_label: string
  model_name: string
  temperature: number
}

export interface KnowledgeBaseDocument {
  id: string
  file_name: string
  file_size: number
  file_type: string
  created_at: string
}
