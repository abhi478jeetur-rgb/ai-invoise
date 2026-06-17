import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verify Code - ChaseFree AI',
  description: 'Enter the 6-digit verification code sent to your email to verify your identity and access ChaseFree AI.',
}

export default function VerifyOtpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
