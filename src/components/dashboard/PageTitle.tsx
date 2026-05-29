'use client'

import { usePathname } from 'next/navigation'

export function PageTitle() {
  const pathname = usePathname()
  
  let title = 'Dashboard'
  if (pathname.includes('/clients')) title = 'Clients'
  else if (pathname.includes('/invoices')) title = 'Invoices'
  else if (pathname.includes('/settings')) title = 'Settings'
  else if (pathname.includes('/reminders')) title = 'Reminders'
  else if (pathname.includes('/trash')) title = 'Trash'

  return (
    <h2 className="text-sm font-medium text-foreground">
      {title}
    </h2>
  )
}

