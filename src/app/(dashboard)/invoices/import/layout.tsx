import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Import CSV - ChaseFree AI',
  description: 'Upload and parse your client invoice lists using CSV file formats, matching column headers dynamically.',
}

export default function ImportCSVLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
