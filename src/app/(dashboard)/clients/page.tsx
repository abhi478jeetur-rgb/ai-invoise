import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'
import { getClientsAction } from '@/lib/clients/actions'
import { ClientsPageClient } from './clients-page-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Clients - ChaseFree AI',
  description: 'Manage your client directory, contact details, and custom reminder schedules.',
}

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const result = await getClientsAction()
  const clients = result.success ? result.data : []

  return <ClientsPageClient clients={clients ?? []} />
}
