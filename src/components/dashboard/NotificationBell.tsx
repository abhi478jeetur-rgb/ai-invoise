'use client'

import React, { useEffect, useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getNotifications, markAsRead, clearAllNotifications } from '@/lib/notifications/actions'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const fetchNotifications = async () => {
    const res = await getNotifications()
    if (res.success && res.data) {
      setNotifications(res.data)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every minute
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.filter(n => !n.is_read).length

  // M21: Check result of markAsRead and handle errors
  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      const previousNotifications = [...notifications]
      setNotifications(notifications.map(n => n.id === notif.id ? { ...n, is_read: true } : n))

      const res = await markAsRead(notif.id)
      if (res && 'error' in res) {
        // Revert optimistic update on failure
        setNotifications(previousNotifications)
        toast.error('Failed to mark notification as read')
      }
    }
    setOpen(false)
    if (notif.link) {
      router.push(notif.link)
    }
  }

  // M21: Check result of clearAllNotifications and handle errors
  const handleClearAll = async () => {
    const previousNotifications = [...notifications]
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))

    const res = await clearAllNotifications()
    if (res && 'error' in res) {
      // Revert optimistic update on failure
      setNotifications(previousNotifications)
      toast.error('Failed to clear notifications')
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent border border-transparent hover:border-border">
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-popover border-border text-popover-foreground shadow-2xl" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h4 className="font-semibold text-sm tracking-tight text-foreground">Notifications</h4>
          {unreadCount > 0 && (
            <button 
              onClick={handleClearAll}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <Check className="w-3 h-3" /> Mark all read
            </button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Bell className="w-8 h-8 mb-3 opacity-20" />
              <p className="text-xs">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 border-b border-border hover:bg-accent/50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-accent/20' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h5 className={`text-sm tracking-tight ${!notif.is_read ? 'text-foreground font-semibold' : 'text-foreground/70'}`}>
                      {notif.title}
                    </h5>
                    {!notif.is_read && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></span>}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed line-clamp-2">{notif.message}</p>
                  <p className="text-[10px] text-muted-foreground/60 font-mono">
                    {new Date(notif.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
