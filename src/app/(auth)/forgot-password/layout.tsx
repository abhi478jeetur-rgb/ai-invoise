import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Forgot Password - ChaseFree AI',
  description: 'Recover your ChaseFree AI account password. Enter your email address to receive password reset instructions.',
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
