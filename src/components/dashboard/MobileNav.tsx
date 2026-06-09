'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, LayoutGrid, FileText, Mail, BookOpen, Settings, ChevronRight } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

const navItems = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { href: '/invoices', icon: FileText, label: 'Invoices' },
  { href: '/reminders', icon: Mail, label: 'AI Reminders' },
  { href: '/clients', icon: BookOpen, label: 'Clients' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

interface MobileNavProps {
  companyName: string
}

export function MobileNav({ companyName }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden shrink-0 text-muted-foreground hover:text-foreground" />
        }
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-64 p-0 flex flex-col bg-background border-r border-border">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <Image src="/logo.svg" alt="ChaseFree AI Logo" width={24} height={24} className="w-6 h-6 object-contain dark:invert-0 invert" />
          <span className="font-sans font-bold text-lg tracking-tight text-foreground">
            ChaseFree AI
          </span>
        </div>

        <nav className="flex-1 flex flex-col gap-2 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                <div
                  className={`flex items-center justify-between h-11 rounded-xl px-3 transition-all cursor-pointer border ${
                    isActive
                      ? 'text-foreground bg-accent border-border shadow-sm'
                      : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} className="shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronRight size={16} className={`shrink-0 transition-transform ${isActive ? 'text-foreground' : 'text-muted-foreground/50'} opacity-70`} />
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Link href="/settings" onClick={() => setOpen(false)}>
            <div className="flex items-center gap-3 rounded-md bg-secondary border border-border px-3 text-[10px] font-bold text-muted-foreground hover:text-foreground hover:border-ring transition-all cursor-pointer h-10">
              <span className="shrink-0 w-6 h-6 flex items-center justify-center bg-muted rounded text-muted-foreground text-xs font-semibold uppercase">
                {companyName ? companyName.trim().charAt(0) : 'W'}
              </span>
              <span className="whitespace-nowrap overflow-hidden text-ellipsis text-xs">
                {companyName}
              </span>
            </div>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
