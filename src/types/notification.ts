export interface AppNotification {
  id: string
  user_id: string
  title: string
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}
