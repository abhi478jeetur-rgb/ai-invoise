'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  FileText,
  Mail,
  BookOpen,
  Settings
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Image from 'next/image'

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
  companyName?: string
}

export default function Sidebar({ initials, email, name, companyName = 'My Workspace' }: SidebarProps) {
  const [expanded, setExpanded] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`h-screen sticky top-0 z-40 border-r border-neutral-900 bg-neutral-950 flex flex-col items-start py-4 justify-between shrink-0 overflow-hidden transition-all duration-200 ease-in-out ${
        expanded ? 'w-56' : 'w-14'
      }`}
    >
      {/* Top Logo */}
      <div className={`flex items-center ${expanded ? 'w-full px-3' : 'w-14 justify-center'} shrink-0`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white hover:bg-neutral-900 cursor-pointer transition-colors shrink-0">
            <Image src="/logo.svg" alt="ChaseFree AI Logo" width={24} height={24} className="w-6 h-6 object-contain" />
          </div>
          <span className={`font-sans font-bold text-lg tracking-tight text-white whitespace-nowrap transition-all duration-150 ${
            expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1 pointer-events-none w-0'
          }`}>
            ChaseFree AI
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav id="tour-nav" className="flex-1 flex flex-col items-start gap-1 my-6 w-full px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={`${item.href}-${item.label}`} href={item.href} title={item.title} className="w-full">
              <div
                className={`flex items-center gap-3 h-9 rounded-lg px-2.5 transition-all cursor-pointer border ${
                  isActive
                    ? 'text-neutral-100 bg-white/[0.06] border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                    : 'text-neutral-500 border-transparent hover:text-neutral-200 hover:bg-neutral-900/60'
                }`}
                style={{ width: expanded ? '100%' : '36px' }}
              >
                <item.icon size={16} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                <span
                  className={`text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                    expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1 pointer-events-none w-0'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Tenant Switcher (Dynamic Workspace) */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        <Link href="/settings" title="Workspace Settings" className="w-full">
          <div
            className="flex items-center gap-3 rounded-md bg-neutral-900 border border-neutral-800 px-2.5 text-[10px] font-bold text-neutral-400 hover:text-white hover:border-neutral-700 transition-all cursor-pointer h-9"
            style={{ width: expanded ? '100%' : '36px' }}
          >
            <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-neutral-800 rounded text-neutral-300 text-xs font-semibold uppercase">
              {companyName ? companyName.trim().charAt(0) : 'W'}
            </span>
            <span
              className={`whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-150 ${
                expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1 pointer-events-none w-0'
              }`}
              style={{ maxWidth: expanded ? '120px' : '0px' }}
            >
              {companyName}
            </span>
          </div>
        </Link>
      </div>
    </aside>
  )
}
