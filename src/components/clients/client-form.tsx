'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClientAction, updateClientAction } from '@/lib/clients/actions'

interface ClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (client?: any) => void
  client?: {
    id: string
    client_name: string
    contact_name: string | null
    email: string | null
    phone: string | null
    company_name: string | null
    notes: string | null
  } | null
}

export function ClientForm({ open, onOpenChange, onSaved, client }: ClientFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isEditing = !!client

  useEffect(() => {
    if (!open) {
      setError(null)
      setLoading(false)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = isEditing
      ? await updateClientAction(client!.id, formData)
      : await createClientAction(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onOpenChange(false)
      onSaved?.(result.data)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] border-neutral-800 bg-[#0a0a0a] backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-neutral-100">
            {isEditing ? 'Edit Client' : 'Add Client'}
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-500">
            {isEditing
              ? 'Update the client details below.'
              : 'Add a new client to track their invoices and reminders.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs font-medium bg-red-500/[0.1] border border-red-500/[0.2] text-red-400 rounded-lg text-center backdrop-blur-md">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-neutral-400" htmlFor="clientName">
              Client Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="clientName"
              name="clientName"
              required
              defaultValue={client?.client_name ?? ''}
              placeholder="Acme Corp"
              className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-neutral-400" htmlFor="contactName">
                Contact Name
              </Label>
              <Input
                id="contactName"
                name="contactName"
                defaultValue={client?.contact_name ?? ''}
                placeholder="Jane Smith"
                className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-neutral-400" htmlFor="companyName">
                Company
              </Label>
              <Input
                id="companyName"
                name="companyName"
                defaultValue={client?.company_name ?? ''}
                placeholder="Acme Inc."
                className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-neutral-400" htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="text"
                defaultValue={client?.email ?? ''}
                placeholder="billing@acme.com"
                className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-neutral-400" htmlFor="phone">
                Phone
              </Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={client?.phone ?? ''}
                placeholder="+1 (555) 000-0000"
                className="h-9 border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-neutral-400" htmlFor="notes">
              Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={client?.notes ?? ''}
              placeholder="Internal notes about this client..."
              rows={3}
              className="border-neutral-800 bg-neutral-950 text-neutral-200 focus-visible:border-neutral-700 focus-visible:ring-neutral-700/50 resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-800 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-white text-black hover:bg-neutral-200 font-medium text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? isEditing ? 'Saving...' : 'Adding...'
                : isEditing ? 'Save Changes' : 'Add Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
