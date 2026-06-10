export interface Client {
  id: string
  user_id: string
  client_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  company_name: string | null
  notes: string | null
  deleted_at: string | null
  created_at?: string
  updated_at?: string
}

export interface SoftDeletedClient {
  id: string
  client_name: string
  email: string | null
  deleted_at: string
}
