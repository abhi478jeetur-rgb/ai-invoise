import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up - ChaseFree AI',
  description: 'Create your free ChaseFree AI account today to automate late payment follow-ups and track invoices effortlessly.',
}

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
