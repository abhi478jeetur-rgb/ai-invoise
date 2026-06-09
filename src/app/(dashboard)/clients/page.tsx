import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'
import { getClientsAction } from '@/lib/clients/actions'
import { ClientsPageClient } from './clients-page-client'

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
