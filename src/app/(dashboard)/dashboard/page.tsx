import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'
import { getDashboardDataAction } from '@/lib/dashboard/actions'
import DashboardVisualCustomizer from './visual-customizer'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const fullName = (user.user_metadata?.full_name as string) || 'there'
  const firstName = fullName.split(' ')[0]
  
  const result = await getDashboardDataAction()

  if (!result.success) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-red-400">Failed to load dashboard data: {result.error || 'Unknown error'}</p>
      </div>
    )
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <DashboardVisualCustomizer 
      data={result.data!} 
      firstName={firstName} 
      today={today} 
    />
  )
}
