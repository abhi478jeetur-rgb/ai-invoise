'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export function MobileLandingNav({ user }: { user: any }) {
  const [open, setOpen] = useState(false)

  const handleLinkClick = () => {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden text-neutral-400 hover:text-white" />
        }
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </SheetTrigger>
      <SheetContent side="right" className="w-[80vw] sm:w-[350px] bg-neutral-950 border-neutral-900 p-6 flex flex-col">
        <SheetTitle className="text-white mb-6">Navigation</SheetTitle>
        <nav className="flex flex-col gap-6 text-sm">
          <a href="#features" onClick={handleLinkClick} className="text-neutral-400 hover:text-white transition-colors">
            Features
          </a>
          <a href="#why" onClick={handleLinkClick} className="text-neutral-400 hover:text-white transition-colors">
            Why ChaseFree
          </a>
          <a href="#testimonial" onClick={handleLinkClick} className="text-neutral-400 hover:text-white transition-colors">
            Testimonials
          </a>
        </nav>

        <div className="mt-8 flex flex-col gap-3">
          {user ? (
            <Link href="/dashboard" onClick={handleLinkClick}>
              <Button className="w-full bg-white text-black hover:bg-neutral-200">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in" onClick={handleLinkClick}>
                <Button variant="outline" className="w-full border-neutral-800 text-white hover:bg-neutral-900">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up" onClick={handleLinkClick}>
                <Button className="w-full bg-white text-black hover:bg-neutral-200">
                  Start Free
                </Button>
              </Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
