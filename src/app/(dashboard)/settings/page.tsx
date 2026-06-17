import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'
import { getSettingsAction } from '@/lib/settings/actions'
import { SettingsPageClient } from './settings-page-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings - ChaseFree AI',
  description: 'Configure your profile details, custom payment terms, SWR caching strategies, and Sentry tracking properties.',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const result = await getSettingsAction()

  if (!result.success) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-red-400">Failed to load settings.</p>
      </div>
    )
  }

  return <SettingsPageClient initialData={result.data!} />
}
