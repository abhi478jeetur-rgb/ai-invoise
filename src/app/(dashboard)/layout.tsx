import { createClient } from '@/lib/db/server'
import { redirect } from 'next/navigation'
import { logout } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import Sidebar from './sidebar'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'

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
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

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
      <Sidebar initials={initials} email={user.email ?? ''} />

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Minimalist Header */}
        <header className="h-14 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-30 shrink-0">
          
          <div />

          {/* User section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 select-none">
                <span className="text-[10px] font-semibold text-neutral-300">{initials}</span>
              </div>
              <span className="text-[11px] text-neutral-500 hidden sm:inline select-none">
                {user.email}
              </span>
            </div>
            
            <form action={async () => {
              'use server'
              await logout()
            }}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-[11px] text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 cursor-pointer h-7 px-2.5"
              >
                Log Out
              </Button>
            </form>
          </div>

        </header>

        {/* Dynamic page contents with unified grid-padding */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
          {children}
        </main>

      </div>
      <OnboardingModal initialOpen={!profile?.onboarding_completed} />
    </div>
  )
}
