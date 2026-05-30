'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Command as CommandPrimitive } from 'cmdk'
import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { searchAllData } from '@/lib/search/actions'

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ clients: any[], invoices: any[] }>({ clients: [], invoices: [] })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (!query) {
      setResults({ clients: [], invoices: [] })
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      const res = await searchAllData(query)
      if (!cancelled && res.success && res.data) {
        setResults(res.data)
      }
      if (!cancelled) setLoading(false)
    }, 300)

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
    <CommandPrimitive ref={wrapperRef} className="relative w-full min-w-[200px] sm:min-w-[300px] max-w-md bg-transparent border-none overflow-visible" shouldFilter={false}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 focus-within:bg-secondary border border-border rounded-lg px-3 py-1.5 transition-colors">
        <Search className="w-4 h-4 shrink-0" />
        <CommandPrimitive.Input
          ref={inputRef}
          value={query}
          onValueChange={setQuery}
          onFocus={() => setOpen(true)}
          placeholder="Search anything..."
          className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground min-w-0"
        />
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#000000] border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
          <CommandList className="bg-[#000000] text-white max-h-[350px] overflow-y-auto p-1">
            <CommandEmpty className="text-zinc-400 py-6 text-center text-sm">{loading ? 'Searching...' : 'No results found.'}</CommandEmpty>
          
          {results.clients.length > 0 && (
            <CommandGroup heading="Clients" className="text-white [&_[cmdk-group-heading]]:text-zinc-400">
              {results.clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.id}
                  onSelect={() => runCommand(() => router.push(`/clients/${client.id}`))}
                  className="cursor-pointer text-zinc-300 data-[selected=true]:bg-zinc-900 data-[selected=true]:text-white aria-selected:bg-zinc-900 aria-selected:text-white"
                >
                  <div className="flex flex-col">
                    <span className="text-white">{client.client_name}</span>
                    <span className="text-xs text-zinc-400">{client.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.invoices.length > 0 && (
            <>
              {results.clients.length > 0 && <CommandSeparator className="bg-zinc-800" />}
              <CommandGroup heading="Invoices" className="text-white [&_[cmdk-group-heading]]:text-zinc-400">
                {results.invoices.map((invoice) => (
                  <CommandItem
                    key={invoice.id}
                    value={invoice.id}
                    onSelect={() => runCommand(() => router.push(`/invoices/${invoice.id}`))}
                    className="cursor-pointer text-zinc-300 data-[selected=true]:bg-zinc-900 data-[selected=true]:text-white aria-selected:bg-zinc-900 aria-selected:text-white"
                  >
                    <div className="flex flex-col">
                      <span className="text-white">#{invoice.invoice_number} - {invoice.clients?.client_name}</span>
                      <span className="text-xs text-zinc-400 capitalize">{invoice.status}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {!query && (
            <CommandGroup heading="Quick Links" className="text-white [&_[cmdk-group-heading]]:text-zinc-400">
              <CommandItem value="dashboard" onSelect={() => runCommand(() => router.push('/dashboard'))} className="cursor-pointer text-zinc-300 data-[selected=true]:bg-zinc-900 data-[selected=true]:text-white aria-selected:bg-zinc-900 aria-selected:text-white">
                Dashboard
              </CommandItem>
              <CommandItem value="clients" onSelect={() => runCommand(() => router.push('/clients'))} className="cursor-pointer text-zinc-300 data-[selected=true]:bg-zinc-900 data-[selected=true]:text-white aria-selected:bg-zinc-900 aria-selected:text-white">
                Clients
              </CommandItem>
              <CommandItem value="invoices" onSelect={() => runCommand(() => router.push('/invoices'))} className="cursor-pointer text-zinc-300 data-[selected=true]:bg-zinc-900 data-[selected=true]:text-white aria-selected:bg-zinc-900 aria-selected:text-white">
                Invoices
              </CommandItem>
              <CommandItem value="settings" onSelect={() => runCommand(() => router.push('/settings'))} className="cursor-pointer text-zinc-300 data-[selected=true]:bg-zinc-900 data-[selected=true]:text-white aria-selected:bg-zinc-900 aria-selected:text-white">
                Settings
              </CommandItem>
            </CommandGroup>
          )}
          </CommandList>
        </div>
      )}
    </CommandPrimitive>
  )
}
