'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { deleteClientAction } from '@/lib/clients/actions'

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

  const filtered = useMemo(() => {
    if (!search.trim()) return clients
    const q = search.toLowerCase()
    return clients.filter(
      (c) =>
        c.client_name.toLowerCase().includes(q) ||
        (c.company_name?.toLowerCase().includes(q) ?? false) ||
        (c.email?.toLowerCase().includes(q) ?? false)
    )
  }, [clients, search])

  function handleEdit(client: Client) {
    setEditingClient(client)
    setFormOpen(true)
  }

  async function handleDelete(clientId: string) {
    const result = await deleteClientAction(clientId)
    if (result.success) {
      router.refresh()
    } else {
      console.error('[Client Deletion Failed]', result.error)
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
          <h1 className="text-2xl font-semibold text-neutral-100 tracking-tight">Clients</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Your client directory for invoice tracking and follow-ups.
          </p>
        </div>
        <Button
          id="tour-add-client"
          onClick={() => {
            setEditingClient(null)
            setFormOpen(true)
          }}
          className="bg-white text-black hover:bg-neutral-200 font-medium text-sm cursor-pointer w-fit"
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
            className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 placeholder:text-neutral-600 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
          />
        </div>
      )}

      {/* Empty State */}
      {clients.length === 0 ? (
        <Card className="border-neutral-900 bg-neutral-900/40 backdrop-blur-xl max-w-lg">
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 mb-4">
              <span className="text-lg text-neutral-500">+</span>
            </div>
            <h3 className="text-base font-medium text-neutral-300 mb-1">No clients yet</h3>
            <p className="text-sm text-neutral-500 mb-6 max-w-xs mx-auto">
              Add your first client to start tracking invoices and sending follow-ups.
            </p>
            <Button
              onClick={() => {
                setEditingClient(null)
                setFormOpen(true)
              }}
              className="bg-white text-black hover:bg-neutral-200 font-medium text-sm cursor-pointer"
            >
              + Add Your First Client
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-neutral-500">No clients match your search.</p>
        </div>
      ) : (
        /* Client List */
        <div className="grid gap-2">
          {filtered.map((client) => (
            <Card
              key={client.id}
              className="border-white/[0.06] bg-neutral-900/40 backdrop-blur-xl hover:bg-white/[0.02] transition-colors"
            >
              <CardContent className="py-3.5 px-5">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/clients/${client.id}`}
                    className="flex-1 min-w-0 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-800/80 border border-neutral-700/50 shrink-0">
                        <span className="text-xs font-medium text-neutral-400">
                          {client.client_name[0]?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-neutral-200 truncate group-hover:text-white transition-colors">
                          {client.client_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {client.company_name && (
                            <span className="text-xs text-neutral-500 truncate">{client.company_name}</span>
                          )}
                          {client.email && client.company_name && (
                            <span className="text-neutral-700">&middot;</span>
                          )}
                          {client.email && (
                            <span className="text-xs text-neutral-600 truncate">{client.email}</span>
                          )}
                          {!client.company_name && !client.email && (
                            <span className="text-xs text-neutral-600">No contact info</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-3">
                    {client.phone && (
                      <span className="text-xs text-neutral-600 hidden lg:inline">{client.phone}</span>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 cursor-pointer"
                          >
                            <span className="text-lg leading-none">...</span>
                          </Button>
                        }
                      />
                      <DropdownMenuContent
                        align="end"
                        className="border-neutral-800 bg-neutral-950/95 backdrop-blur-xl"
                      >
                        <DropdownMenuItem
                          onClick={() => handleEdit(client)}
                          className="text-neutral-300 focus:bg-neutral-800 focus:text-neutral-100 cursor-pointer"
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
