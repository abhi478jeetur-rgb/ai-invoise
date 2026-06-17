import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'
import { getInvoicesAction } from '@/lib/invoices/actions'
import { getSettingsAction } from '@/lib/settings/actions'
import { RemindersPageClient } from './reminders-page-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Reminders - ChaseFree AI',
  description: 'Draft and review personalized, AI-generated payment follow-ups for late invoices.',
}

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
