'use client'

import React, { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { completeTourAction } from '@/lib/profile/actions'

interface TourManagerProps {
  isActive?: boolean
}

export function TourManager({ isActive }: TourManagerProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const driverRef = useRef<any>(null)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !isActive) return

    // Inject custom dark mode styles for driver.js
    if (!document.getElementById('driver-dark-theme')) {
      const style = document.createElement('style')
      style.id = 'driver-dark-theme'
      style.innerHTML = `
        .driver-popover {
          background-color: #0a0a0a !important;
          color: #f5f5f5 !important;
          border: 1px solid #262626 !important;
          border-radius: 12px !important;
        }
        .driver-popover-title {
          color: #f5f5f5 !important;
          font-weight: 600 !important;
        }
        .driver-popover-description {
          color: #a3a3a3 !important;
        }
        .driver-popover-footer button {
          background-color: #ffffff !important;
          color: #000000 !important;
          border: none !important;
          border-radius: 6px !important;
          font-weight: 500 !important;
          text-shadow: none !important;
        }
        .driver-popover-footer button:hover {
          background-color: #e5e5e5 !important;
        }
        .driver-popover-close-btn {
          color: #a3a3a3 !important;
        }
        .driver-popover-close-btn:hover {
          color: #f5f5f5 !important;
        }
        .driver-popover-arrow {
          border-color: #0a0a0a !important;
        }
      `
      document.head.appendChild(style)
    }

    if (pathname === '/dashboard') {
      setTimeout(() => {
        driverRef.current = driver({
          showProgress: true,
          animate: true,
          allowClose: false,
          steps: [
            {
              element: '#tour-nav',
              popover: {
                title: 'Navigation',
                description: 'Here you can access all your features. Navigate between Invoices, Reminders, Clients, and Settings.',
                side: 'right',
                align: 'start',
                onNextClick: (element, step, opts) => {
                  opts.driver.moveNext()
                }
              }
            },
            {
              element: '#tour-getting-started',
              popover: {
                title: 'Getting Started',
                description: 'Start by adding a client, then create an invoice, and let AI chase the payments! Click Next to go to the Clients page.',
                side: 'top',
                align: 'center',
                onNextClick: (element, step, opts) => {
                  opts.driver.destroy()
                  router.push('/clients')
                }
              }
            }
          ]
        })
        driverRef.current.drive()
      }, 800) // slight delay for rendering
    } else if (pathname === '/clients') {
      setTimeout(() => {
        driverRef.current = driver({
          showProgress: false,
          animate: true,
          allowClose: false,
          steps: [
            {
              element: '#tour-add-client',
              popover: {
                title: 'Add a Client',
                description: 'Click here to add your first client. You need a client before you can create an invoice. Click Next to finish the tour.',
                side: 'bottom',
                align: 'center',
                onNextClick: async (element, step, opts) => {
                  opts.driver.destroy()
                  await completeTourAction()
                  router.refresh()
                }
              }
            }
          ]
        })
        driverRef.current.drive()
      }, 800)
    }

    return () => {
      if (driverRef.current) {
        driverRef.current.destroy()
      }
    }
  }, [mounted, isActive, pathname, router])

  return null
}
