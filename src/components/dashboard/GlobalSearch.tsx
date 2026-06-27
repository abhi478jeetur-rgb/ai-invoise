'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { searchAllData } from '@/lib/search/actions'
import { Button } from '@/components/ui/button'
import type { SearchResults } from '@/types/search'

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({ clients: [], invoices: [] })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (!query) {
      setResults({ clients: [], invoices: [] })
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    const timer = setTimeout(async () => {
      const res = await searchAllData(query)
      if (!cancelled && res.success && res.data) {
        setResults(res.data)
      }
      if (!cancelled) setLoading(false)
    }, 450) // Increased debounce to 450ms to protect backend

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative flex items-center">
        {/* Desktop Trigger */}
        <PopoverTrigger render={
          <Button
            variant="outline"
            className="hidden sm:flex relative h-9 w-full justify-start rounded-[0.5rem] bg-secondary/50 hover:bg-secondary text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64 border-border"
          >
            <span className="hidden lg:inline-flex">Search anything...</span>
            <span className="inline-flex lg:hidden">Search...</span>
            <kbd className="pointer-events-none absolute right-[0.3rem] top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        } />

        {/* Mobile Trigger */}
        <PopoverTrigger render={
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden text-muted-foreground hover:text-foreground shrink-0"
          >
            <Search className="w-5 h-5" />
            <span className="sr-only">Search</span>
          </Button>
        } />
      </div>

      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[500px] p-0" align="start" sideOffset={8}>
        <Command>
          <CommandInput 
            value={query}
            onValueChange={setQuery}
            placeholder="Search clients, invoices..." 
          />
          <CommandList className="max-h-[350px] overflow-y-auto p-1">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              {loading ? 'Searching...' : 'No results found.'}
            </CommandEmpty>
            
            {results.clients.length > 0 && (
              <CommandGroup heading="Clients">
                {results.clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={() => runCommand(() => router.push(`/clients/${client.id}`))}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="text-foreground">{client.client_name}</span>
                      <span className="text-xs text-muted-foreground">{client.email}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results.invoices.length > 0 && (
              <>
                {results.clients.length > 0 && <CommandSeparator />}
                <CommandGroup heading="Invoices">
                  {results.invoices.map((invoice) => (
                    <CommandItem
                      key={invoice.id}
                      value={invoice.id}
                      onSelect={() => runCommand(() => router.push(`/invoices/${invoice.id}`))}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="text-foreground">#{invoice.invoice_number} - {Array.isArray(invoice.clients) ? invoice.clients[0]?.client_name : invoice.clients?.client_name}</span>
                        <span className="text-xs text-muted-foreground capitalize">{invoice.status}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {!query && (
              <CommandGroup heading="Quick Links">
                <CommandItem value="dashboard" onSelect={() => runCommand(() => router.push('/dashboard'))} className="cursor-pointer">
                  Dashboard
                </CommandItem>
                <CommandItem value="clients" onSelect={() => runCommand(() => router.push('/clients'))} className="cursor-pointer">
                  Clients
                </CommandItem>
                <CommandItem value="invoices" onSelect={() => runCommand(() => router.push('/invoices'))} className="cursor-pointer">
                  Invoices
                </CommandItem>
                <CommandItem value="settings" onSelect={() => runCommand(() => router.push('/settings'))} className="cursor-pointer">
                  Settings
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
