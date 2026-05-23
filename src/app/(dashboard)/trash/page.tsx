import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'
import { getDeletedInvoicesAction } from '@/lib/invoices/actions'
import { getDeletedClientsAction } from '@/lib/clients/actions'
import { TrashPageClient } from './trash-page-client'

export default async function TrashPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const [invoicesResult, clientsResult] = await Promise.all([
    getDeletedInvoicesAction(),
    getDeletedClientsAction(),
  ])

  const deletedInvoices = invoicesResult.success ? invoicesResult.data : []
  const deletedClients = clientsResult.success ? clientsResult.data : []

  return <TrashPageClient invoices={deletedInvoices ?? []} clients={deletedClients ?? []} />
}
