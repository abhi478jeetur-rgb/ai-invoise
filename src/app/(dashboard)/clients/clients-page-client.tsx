'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ClientForm } from '@/components/clients/client-form'
import { deleteClientAction, getClientsAction } from '@/lib/clients/actions'

interface Client {
  id: string
  client_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  company_name: string | null
  notes: string | null
  created_at: string
}

interface ClientsPageClientProps {
  clients: Client[]
}

export function ClientsPageClient({ clients }: ClientsPageClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const [displayedClients, setDisplayedClients] = useState<Client[]>(clients)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(clients.length >= 15)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const observerTarget = React.useRef<HTMLDivElement>(null)

  const loadMore = React.useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    try {
      const nextPage = page + 1
      const result = await getClientsAction(nextPage, 15)
      if (result.success && result.data) {
        setDisplayedClients(prev => {
          const newItems = (result.data as unknown as Client[]).filter(d => !prev.some(p => p.id === d.id))
          return [...prev, ...newItems]
        })
        setPage(nextPage)
        setHasMore(result.hasMore ?? false)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [page, hasMore, isLoadingMore])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [loadMore])

  const filtered = useMemo(() => {
    if (!search.trim()) return displayedClients
    const q = search.toLowerCase()
    return displayedClients.filter(
      (c) =>
        c.client_name.toLowerCase().includes(q) ||
        (c.company_name?.toLowerCase().includes(q) ?? false) ||
        (c.email?.toLowerCase().includes(q) ?? false)
    )
  }, [displayedClients, search])

  function handleEdit(client: Client) {
    setEditingClient(client)
    setFormOpen(true)
  }

  async function handleDelete(clientId: string) {
    const result = await deleteClientAction(clientId)
    if (result.success) {
      router.refresh()
    } else {
      toast.error(result.error || 'Failed to delete client')
    }
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open)
    if (!open) {
      setEditingClient(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your client directory for invoice tracking and follow-ups.
          </p>
        </div>
        <Button
          id="tour-add-client"
          onClick={() => {
            setEditingClient(null)
            setFormOpen(true)
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm cursor-pointer w-fit"
        >
          + Add Client
        </Button>
      </div>

      {/* Search */}
      {clients.length > 0 && (
        <div className="max-w-sm">
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50"
          />
        </div>
      )}

      {/* Empty State */}
      {clients.length === 0 ? (
        <Card className="border-border bg-card/40 backdrop-blur-xl max-w-lg">
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary border border-border mb-4">
              <span className="text-lg text-muted-foreground">+</span>
            </div>
            <h3 className="text-base font-medium text-foreground/80 mb-1">No clients yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              Add your first client to start tracking invoices and sending follow-ups.
            </p>
            <Button
              onClick={() => {
                setEditingClient(null)
                setFormOpen(true)
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm cursor-pointer"
            >
              + Add Your First Client
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">No clients match your search.</p>
        </div>
      ) : (
        /* Client List */
        <div className="grid gap-2">
          {filtered.map((client) => (
            <Card
              key={client.id}
              className="border-border bg-card/40 backdrop-blur-xl hover:bg-accent/50 transition-colors"
            >
              <CardContent className="py-2.5 px-4">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/clients/${client.id}`}
                    className="flex-1 min-w-0 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-secondary border border-border shrink-0">
                        <span className="text-xs font-medium text-muted-foreground">
                          {client.client_name[0]?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-foreground transition-colors">
                          {client.client_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {client.company_name && (
                            <span className="text-xs text-muted-foreground truncate">{client.company_name}</span>
                          )}
                          {client.email && client.company_name && (
                            <span className="text-muted-foreground/50">&middot;</span>
                          )}
                          {client.email && (
                            <span className="text-xs text-muted-foreground/60 truncate">{client.email}</span>
                          )}
                          {!client.company_name && !client.email && (
                            <span className="text-xs text-muted-foreground/60">No contact info</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-3">
                    {client.phone && (
                      <span className="text-xs text-muted-foreground/60 hidden lg:inline">{client.phone}</span>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer"
                          >
                            <span className="text-lg leading-none">...</span>
                          </Button>
                        }
                      />
                      <DropdownMenuContent
                        align="end"
                        className="border-border bg-popover/95 backdrop-blur-xl"
                      >
                        <DropdownMenuItem
                          onClick={() => handleEdit(client)}
                          className="text-foreground/80 focus:bg-accent focus:text-foreground cursor-pointer"
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(client.id)}
                          className="text-red-400 focus:bg-red-950/50 focus:text-red-300 cursor-pointer"
                        >
                          Move to Trash
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Loading Trigger for Infinite Scroll */}
          {hasMore && (
            <div ref={observerTarget} className="py-4 flex justify-center">
              {isLoadingMore ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  Loading more...
                </div>
              ) : (
                <div className="h-4"></div> /* Invisible target to trigger observer */
              )}
            </div>
          )}
          {!hasMore && displayedClients.length >= 15 && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              You've reached the end of the directory.
            </div>
          )}
        </div>
      )}

      {/* Client Form Dialog */}
      <ClientForm
        open={formOpen}
        onOpenChange={handleFormClose}
        client={editingClient}
        onSaved={() => router.refresh()}
      />
    </div>
  )
}
