import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In - ChaseFree AI',
  description: 'Sign in to your ChaseFree AI dashboard to monitor outstanding invoices and manage client follow-up automation.',
}

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
