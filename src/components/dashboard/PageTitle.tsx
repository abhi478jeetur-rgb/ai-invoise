'use client'

import { usePathname } from 'next/navigation'

export function PageTitle() {
  const pathname = usePathname()
  
  let title = 'Dashboard'
  let desc = 'Track unpaid invoices and know who to follow up with today.'
  
  if (pathname.includes('/clients')) {
    title = 'Clients'
    desc = 'Your client directory for invoice tracking and follow-ups.'
  } else if (pathname.includes('/invoices')) {
    title = 'Invoices'
    desc = 'Track payments and follow up on outstanding invoices.'
  } else if (pathname.includes('/settings')) {
    title = 'Settings'
    desc = 'Manage your profile, business presence, and AI provider configuration.'
  } else if (pathname.includes('/reminders')) {
    title = 'AI Reminders'
    desc = 'Select an invoice to generate AI-powered follow-up emails.'
  } else if (pathname.includes('/trash')) {
    title = 'Recycle Bin'
    desc = 'Restore deleted items or permanently remove them.'
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
      <h2 className="text-sm font-medium text-foreground shrink-0">
        {title}
      </h2>
      <span className="text-border hidden md:block shrink-0">|</span>
      <p className="text-xs text-muted-foreground hidden md:block truncate">
        {desc}
      </p>
    </div>
  )
}

