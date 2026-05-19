import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'
import { getInvoicesAction } from '@/lib/invoices/actions'
import { getClientsAction } from '@/lib/clients/actions'
import { InvoicesPageClient } from './invoices-page-client'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const [invoicesResult, clientsResult] = await Promise.all([
    getInvoicesAction(),
    getClientsAction(),
  ])

  const invoices = invoicesResult.success ? invoicesResult.data : []
  const clients = clientsResult.success ? clientsResult.data : []

  return <InvoicesPageClient invoices={invoices ?? []} clients={clients ?? []} />
}
