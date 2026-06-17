import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reset Password - ChaseFree AI',
  description: 'Enter your new account password to secure your ChaseFree AI credentials.',
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
