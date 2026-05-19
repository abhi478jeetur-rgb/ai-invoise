import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'
import { getInvoicesAction } from '@/lib/invoices/actions'
import { getSettingsAction } from '@/lib/settings/actions'
import { RemindersPageClient } from './reminders-page-client'

export default async function RemindersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const [invoicesResult, settingsResult] = await Promise.all([
    getInvoicesAction(),
    getSettingsAction(),
  ])

  const invoices = invoicesResult.success ? invoicesResult.data ?? [] : []
  const aiSettings = settingsResult.success ? settingsResult.data?.aiSettings ?? null : null

  return <RemindersPageClient initialInvoices={invoices} initialSettings={aiSettings} />
}
