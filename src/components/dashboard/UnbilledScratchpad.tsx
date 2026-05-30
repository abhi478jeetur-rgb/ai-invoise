'use client'

import { useState, useEffect } from 'react'
import { Plus, CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { addUnbilledTaskAction, markUnbilledTaskAsInvoicedAction, getUnbilledTasksAction } from '@/lib/unbilled/actions'

interface UnbilledTask {
  id: string
  description: string
  status: string
  created_at: string
}

export function UnbilledScratchpad() {
  const [tasks, setTasks] = useState<UnbilledTask[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadTasks() {
      const result = await getUnbilledTasksAction()
      if (result.success && result.data) {
        setTasks(result.data as UnbilledTask[])
      }
      setLoading(false)
    }
    loadTasks()
  }, [])

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const description = inputValue.trim()
    const tempTask: UnbilledTask = {
      id: `temp-${Date.now()}`,
      description,
      status: 'pending',
      created_at: new Date().toISOString()
    }

    setTasks(prev => [tempTask, ...prev])
    setIsAdding(true)

    try {
      const result = await addUnbilledTaskAction(description)
      if (result && 'error' in result) {
        // Rollback: remove temp task and restore input
        setTasks(prev => prev.filter(t => t.id !== tempTask.id))
        setInputValue(description)
        toast.error('Failed to add task', {
          description: result.error || 'Please try again.'
        })
        return
      }
      // Only clear input after server confirms success
      setInputValue('')
      const refresh = await getUnbilledTasksAction()
      if (refresh.success && refresh.data) {
        setTasks(refresh.data as UnbilledTask[])
      }
    } catch {
      // Rollback on unexpected error
      setTasks(prev => prev.filter(t => t.id !== tempTask.id))
      setInputValue(description)
      toast.error('Failed to add task', {
        description: 'An unexpected error occurred. Please try again.'
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleMarkDone = async (id: string) => {
    // H14: Store the task before removing for potential rollback
    const removedTask = tasks.find(t => t.id === id)
    setTasks(prev => prev.filter(t => t.id !== id))

    try {
      const result = await markUnbilledTaskAsInvoicedAction(id)

      // H14: Rollback on failure - re-add the task and show error
      if (result && 'error' in result && removedTask) {
        setTasks(prev => [removedTask, ...prev])
        toast.error('Failed to mark task as done', {
          description: result.error || 'Please try again.'
        })
      }
    } catch {
      if (removedTask) {
        setTasks(prev => [removedTask, ...prev])
      }
      toast.error('Failed to mark task as done', {
        description: 'An unexpected error occurred. Please try again.'
      })
    }
  }

  const handleCreateInvoice = (description: string) => {
    // H15: Navigate to invoices page with new invoice dialog and description pre-filled
    const params = new URLSearchParams()
    params.set('new', 'true')
    params.set('desc', description)
    router.push(`/invoices?${params.toString()}`)
  }

  if (loading) return (
    <div className="rounded-xl border border-border bg-card/50 p-6 animate-pulse">
      <div className="h-5 w-40 bg-accent rounded mb-4"></div>
      <div className="h-10 w-full bg-accent rounded"></div>
    </div>
  )

  return (
    <div className="rounded-xl border border-border bg-background p-6 flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-[var(--user-accent)]" />
          Unbilled Work (Scratchpad)
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Quickly log things you&apos;ve done. Convert them to invoices later.
        </p>
      </div>

      <form onSubmit={handleAddTask} className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="e.g. Wrote 2 blog articles for Acme Corp..."
          className="w-full rounded-lg border border-border bg-secondary py-2.5 pl-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:border-border focus:outline-none focus:ring-1 focus:ring-neutral-700"
          disabled={isAdding}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isAdding}
          className="absolute right-1.5 top-1.5 rounded-md bg-[var(--user-accent)] p-1 text-white hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
        </button>
      </form>

      {tasks.length > 0 && (
        <div className="mt-2 space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {tasks.map(task => (
            <div key={task.id} className="group relative flex items-center justify-between rounded-lg border border-border bg-card/50 p-3 hover:border-border transition-colors">
              <span className="text-sm text-foreground/80 pr-20">{task.description}</span>
              
              <div className="absolute right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleCreateInvoice(task.description)}
                  title="Create Invoice from this"
                  className="rounded bg-accent p-1.5 text-foreground/80 hover:bg-accent hover:text-foreground"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleMarkDone(task.id)}
                  title="Mark as Invoiced / Remove"
                  className="rounded bg-green-500/10 p-1.5 text-green-500 hover:bg-green-500/20"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {tasks.length === 0 && (
        <div className="mt-2 text-center py-6 border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground">No unbilled tasks! You&apos;re all caught up.</p>
        </div>
      )}
    </div>
  )
}
