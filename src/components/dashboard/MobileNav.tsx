'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  FileText,
  Mail,
  BookOpen
} from 'lucide-react'

export function MobileNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', icon: LayoutGrid, label: 'Home' },
    { href: '/invoices', icon: FileText, label: 'Invoices' },
    { href: '/reminders', icon: Mail, label: 'Reminders' },
    { href: '/clients', icon: BookOpen, label: 'Clients' },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
      <nav className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium tracking-tight">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
