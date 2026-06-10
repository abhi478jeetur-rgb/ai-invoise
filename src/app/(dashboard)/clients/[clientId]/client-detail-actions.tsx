'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ClientForm } from '@/components/clients/client-form'
import { deleteClientAction } from '@/lib/clients/actions'

import { Client } from '@/types/client'

interface ClientDetailActionsProps {
  client: Client
}

export function ClientDetailActions({ client }: ClientDetailActionsProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return
    }
    setDeleting(true)
    const result = await deleteClientAction(client.id)
    if (result.success) {
      router.push('/clients')
    } else {
      toast.error(result.error || 'Failed to delete client')
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFormOpen(true)}
          className="text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="text-red-400 hover:text-red-300 hover:bg-red-950/30 cursor-pointer disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>

      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        client={client}
        onSaved={() => router.refresh()}
      />
    </>
  )
}
