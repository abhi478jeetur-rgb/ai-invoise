import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'
import { logout } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import Sidebar from './sidebar'
import { OnboardingSurvey } from '@/components/onboarding/OnboardingSurvey'
import { TourManager } from '@/components/onboarding/TourManager'
import { GlobalSearch } from '@/components/dashboard/GlobalSearch'
import { NotificationBell } from '@/components/dashboard/NotificationBell'
import { PageTitle } from '@/components/dashboard/PageTitle'
import { UserNav } from '@/components/dashboard/UserNav'
import { MobileNav } from '@/components/dashboard/MobileNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const fullName = user.user_metadata?.full_name as string | undefined
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.[0]?.toUpperCase() ?? '?'

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, full_name, setup_preference, company_name')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name || fullName || ''
  const companyName = profile?.company_name || displayName || 'My Workspace'
  const showOnboarding = profile?.onboarding_completed === false

  return (
    <div
      className="min-h-screen bg-background flex"
      style={{
        '--user-accent': '#10b981',
        '--user-radius': '12px',
        '--user-font-scale': '1.0',
      } as React.CSSProperties}
    >
      {/* Sidebar */}
      <Sidebar initials={initials} email={user.email ?? ''} name={displayName} companyName={companyName} />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Minimalist Header */}
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shrink-0 gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <MobileNav companyName={companyName} />
            <PageTitle />
          </div>

          {/* User section */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <GlobalSearch />
            <NotificationBell />
            
            <div className="w-px h-4 bg-border mx-2" />
            
            <UserNav initials={initials} name={displayName} email={user.email ?? ''} />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:px-6 lg:py-4 overflow-x-clip">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Onboarding Survey - shown for new users */}
      {showOnboarding && (
        <OnboardingSurvey
          defaultName={displayName}
        />
      )}

      {/* Guided Tour - only active if requested */}
      <TourManager isActive={profile?.setup_preference === 'quick_guided_tour'} />
    </div>
  )
}
