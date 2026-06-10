import { redirect } from 'next/navigation'
import { createClient } from '@/lib/db/server'
import { getInvoiceDetailAction } from '@/lib/invoices/actions'
import SmartBuilderClient from './smart-builder-client'

export const metadata = {
  title: 'Smart PDF Builder - ChaseFree AI',
  description: 'Interactive invoice builder',
}

interface PageProps {
  params: Promise<{ invoiceId: string }>
}

export default async function SmartBuilderPage({ params }: PageProps) {
  const { invoiceId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Fetch invoice and client
  const result = await getInvoiceDetailAction(invoiceId)
  if (!result.success || !result.data) {
    redirect('/invoices')
  }

  const invoice = result.data
  const client = invoice.clients

  // Fetch all user clients for selection
  const { data: allClients } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)

  // Fetch profile for PDF "From" section and payment defaults
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex flex-col h-full -m-4 sm:-m-6 lg:-m-8">
      {/* We use negative margins to take up the full dashboard area if needed, 
          but usually the dashboard layout has padding. 
          For the builder, it might be better to just be a standard page. */}
      <SmartBuilderClient 
        invoice={invoice}
        client={client}
        profile={profile || {}}
        allClients={allClients || []}
      />
    </div>
  )
}
