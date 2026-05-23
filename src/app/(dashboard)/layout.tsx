import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'
import { logout } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import Sidebar from './sidebar'
import { OnboardingSurvey } from '@/components/onboarding/OnboardingSurvey'
import { TourManager } from '@/components/onboarding/TourManager'

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
    .select('onboarding_completed, full_name, setup_preference')
    .eq('id', user.id)
    .single()

  const displayName = profile?.full_name || fullName || ''
  const showOnboarding = profile?.onboarding_completed === false

  return (
    <div
      className="min-h-screen bg-neutral-950 flex"
      style={{
        '--user-accent': '#10b981',
        '--user-radius': '12px',
        '--user-bg': '#050505',
        '--user-card': '#0a0a0a',
        '--user-border': '#151515',
        '--user-text': '#a3a3a3',
        '--user-title': '#f5f5f5',
        '--user-font-scale': '1.0',
      } as React.CSSProperties}
    >
      {/* Sidebar */}
      <Sidebar initials={initials} email={user.email ?? ''} name={displayName} />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Minimalist Header */}
        <header className="h-14 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30 shrink-0">

          <div />

          {/* User section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-900 text-neutral-400 font-medium text-xs">
                {initials}
              </div>
              {displayName && (
                <span className="text-sm text-neutral-300 hidden sm:block">{displayName}</span>
              )}
            </div>

            <form action={async () => { 'use server'; await logout(); }}>
              <Button
                type="submit"
                variant="ghost"
                className="text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 text-xs cursor-pointer"
              >
                Logout
              </Button>
            </form>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-x-hidden">
          {children}
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
