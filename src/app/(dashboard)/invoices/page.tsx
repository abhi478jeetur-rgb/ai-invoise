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

  const [invoicesResult, clientsResult, profileResult] = await Promise.all([
    getInvoicesAction(),
    getClientsAction(),
    supabase
      .from('profiles')
      .select('default_currency, payment_link_default, default_payment_terms')
      .eq('id', user.id)
      .single(),
  ])

  const invoices = invoicesResult.success ? invoicesResult.data : []
  const clients = clientsResult.success ? clientsResult.data : []
  const defaultProfile = profileResult.data ?? {}

  return <InvoicesPageClient invoices={invoices ?? []} clients={clients ?? []} defaultProfile={defaultProfile} />
}

