'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  LayoutGrid,
  FileText,
  Mail,
  BookOpen,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  icon: LucideIcon
  label: string
  title: string
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard', title: 'Dashboard' },
  { href: '/invoices', icon: FileText, label: 'Invoices', title: 'Invoices' },
  { href: '/reminders', icon: Mail, label: 'AI Reminders', title: 'AI Reminders' },
  { href: '/clients', icon: BookOpen, label: 'Clients', title: 'Clients' },
  { href: '/settings', icon: Settings, label: 'Settings', title: 'Settings' },
]

interface SidebarProps {
  initials: string
  email: string
  name?: string
}

export default function Sidebar({ initials, email, name }: SidebarProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`h-screen sticky top-0 z-40 border-r border-neutral-900 bg-neutral-950 flex flex-col items-start py-4 justify-between shrink-0 overflow-hidden transition-all duration-200 ease-in-out ${
        expanded ? 'w-56' : 'w-14'
      }`}
    >
      {/* Top Logo */}
      <div className="flex items-center w-14 justify-center shrink-0">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white hover:bg-neutral-900 cursor-pointer transition-colors">
          <svg
            className="w-7 h-7 text-neutral-400 hover:text-white transition-colors"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        </div>
      </div>

      {/* Navigation */}
      <nav id="tour-nav" className="flex-1 flex flex-col items-start gap-0.5 my-6 w-full px-2">
        {navItems.map((item) => (
          <Link key={`${item.href}-${item.label}`} href={item.href} title={item.title} className="w-full">
            <div
              className="flex items-center gap-3 h-9 rounded-lg px-2.5 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900/60 transition-all cursor-pointer"
              style={{ width: expanded ? '100%' : '36px' }}
            >
              <item.icon size={16} strokeWidth={1.5} className="shrink-0" />
              <span
                className={`text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1 pointer-events-none w-0'
                }`}
              >
                {item.label}
              </span>
            </div>
          </Link>
        ))}
      </nav>

      {/* Bottom Acme Tenant */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        <Link href="/settings" title="Acme Tenant Switcher" className="w-full">
          <div
            className="flex items-center gap-3 rounded-md bg-neutral-900 border border-neutral-800 px-2.5 text-[9px] font-bold text-neutral-400 hover:text-white hover:border-neutral-700 transition-all cursor-pointer h-9"
            style={{ width: expanded ? '100%' : '36px' }}
          >
            <span className="shrink-0 w-5 text-center">A</span>
            <span
              className={`whitespace-nowrap transition-all duration-150 ${
                expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1 pointer-events-none w-0'
              }`}
            >
              Acme
            </span>
          </div>
        </Link>
      </div>
    </aside>
  )
}
