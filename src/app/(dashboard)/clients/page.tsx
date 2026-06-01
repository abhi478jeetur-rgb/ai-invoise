import { Suspense } from 'react'
import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'
import { ClientsFetcher } from './clients-fetcher'
import { ClientsSkeleton } from '@/components/skeletons/clients-skeleton'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Suspense fallback={<ClientsSkeleton />}>
        <ClientsFetcher />
      </Suspense>
    </div>
  )
}
