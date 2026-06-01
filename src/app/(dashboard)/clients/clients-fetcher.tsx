import { getClientsAction } from '@/lib/clients/actions'
import { ClientsPageClient } from './clients-page-client'

export async function ClientsFetcher() {
  const result = await getClientsAction()
  const clients = result.data ? (result.data as unknown as any[]) : []

  return <ClientsPageClient clients={clients ?? []} />
}
