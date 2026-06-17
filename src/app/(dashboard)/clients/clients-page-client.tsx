'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AIHelperCharacter } from '@/components/ui/AIHelperCharacter'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ClientForm } from '@/components/clients/client-form'
import { deleteClientAction } from '@/lib/clients/actions'

import { Client } from '@/types/client'

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
      toast.error(result.error || 'Failed to delete client')
    }
  }

  const escapeXml = (unsafe: string): string => {
    return unsafe.replace(/[<>&'"]/g, (char) => {
      switch (char) {
        case '<': return '&lt;'
        case '>': return '&gt;'
        case '&': return '&amp;'
        case '\'': return '&apos;'
        case '"': return '&quot;'
        default: return char
      }
    })
  }

  const exportToCSV = () => {
    if (clients.length === 0) {
      toast.error('No clients to export.')
      return
    }
    const headers = ['Client Name', 'Contact Name', 'Email', 'Phone', 'Company Name', 'Notes', 'Created At']
    const rows = clients.map(cli => [
      cli.client_name,
      cli.contact_name || '',
      cli.email || '',
      cli.phone || '',
      cli.company_name || '',
      cli.notes || '',
      cli.created_at ? new Date(cli.created_at).toLocaleDateString() : ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const str = String(val ?? '')
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(','))
    ].join('\n')

    // Prepend UTF-8 BOM so Excel opens the CSV directly with correct character encoding
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clients_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Clients exported to CSV successfully!')
  }

  const exportToExcel = () => {
    if (clients.length === 0) {
      toast.error('No clients to export.')
      return
    }
    const headers = ['Client Name', 'Contact Name', 'Email', 'Phone', 'Company Name', 'Notes', 'Created At']
    const rows = clients.map(cli => [
      cli.client_name,
      cli.contact_name || '',
      cli.email || '',
      cli.phone || '',
      cli.company_name || '',
      cli.notes || '',
      cli.created_at ? new Date(cli.created_at).toLocaleDateString() : ''
    ])

    let xml = 'xmlns:x="urn:schemas-microsoft-com:office:excel" ' +
              'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ' +
              'xmlns:html="http://www.w3.org/TR/REC-html40">\n' +
              '  <Worksheet ss:Name="Clients">\n' +
              '    <Table>\n'
    
    xml += '      <Row>\n'
    headers.forEach(h => {
      xml += `        <Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>\n`
    })
    xml += '      </Row>\n'

    rows.forEach(row => {
      xml += '      <Row>\n'
      row.forEach(val => {
        const safeVal = escapeXml(String(val ?? ''))
        xml += `        <Cell><Data ss:Type="String">${safeVal}</Data></Cell>\n`
      })
      xml += '      </Row>\n'
    })

    xml += '    </Table>\n  </Worksheet>\n</Workbook>'
    
    const content = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n ' + xml
    const blob = new Blob([content], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clients_export_${new Date().toISOString().split('T')[0]}.xls`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Clients exported to Excel successfully!')
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open)
    if (!open) {
      setEditingClient(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3">
        {clients.length > 0 && (
          <>
            <Button
              variant="outline"
              onClick={exportToCSV}
              className="border-border bg-card hover:bg-accent hover:text-accent-foreground text-foreground font-medium text-sm cursor-pointer w-fit"
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={exportToExcel}
              className="border-border bg-card hover:bg-accent hover:text-accent-foreground text-foreground font-medium text-sm cursor-pointer w-fit"
            >
              Export Excel
            </Button>
          </>
        )}
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
            <AIHelperCharacter variant="clients" />
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
              className="relative border-border bg-card/40 backdrop-blur-xl hover:bg-accent/50 transition-colors shadow-none overflow-hidden py-0"
            >
              <CardContent className="py-2 px-3">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/clients/${client.id}`}
                    className="flex-1 min-w-0 group"
                  >
                    <span className="absolute inset-0 z-0" aria-hidden="true" />
                    <div className="flex items-center gap-3 relative z-10">
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

                  <div className="flex items-center gap-3 relative z-10">
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
