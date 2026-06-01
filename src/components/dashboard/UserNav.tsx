'use client'

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/lib/auth/actions"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"

interface UserNavProps {
  initials: string
  name: string
  email: string
}

export function UserNav({ initials, name, email }: UserNavProps) {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative h-8 w-8 rounded-lg !p-0 outline-none hover:opacity-80 transition-opacity">
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarImage src="" alt={name} />
          <AvatarFallback className="rounded-lg bg-secondary text-muted-foreground font-medium text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-popover border-border text-popover-foreground" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-foreground">{name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {email}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer hover:bg-accent focus:bg-accent focus:text-accent-foreground" asChild>
            <Link href="/settings">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer hover:bg-accent focus:bg-accent focus:text-accent-foreground" asChild>
            <Link href="/settings">Settings</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-border" />

        {/* Theme Switcher */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1.5">
            Theme
          </DropdownMenuLabel>
          <div className="flex items-center gap-1 px-2 pb-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                theme === 'light'
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Dark
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                theme === 'system'
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              System
            </button>
          </div>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          onClick={async () => {
            try {
              await logout()
            } catch (error) {
              if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
                throw error
              }
              // In Next.js redirect() throws an error with digest 'NEXT_REDIRECT'
              if (typeof error === 'object' && error !== null && 'digest' in error && (error as any).digest?.startsWith('NEXT_REDIRECT')) {
                throw error
              }
              toast.error('Failed to log out. Please try again.')
            }
          }}
          className="cursor-pointer text-red-500 hover:bg-accent hover:text-red-400 focus:bg-accent focus:text-red-400"
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
