'use client'

import { useState, useTransition, useEffect } from 'react'
import { Plus, CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
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
  const [isPending, startTransition] = useTransition()
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

    const tempTask: UnbilledTask = {
      id: `temp-${Date.now()}`,
      description: inputValue.trim(),
      status: 'pending',
      created_at: new Date().toISOString()
    }

    setTasks(prev => [tempTask, ...prev])
    setInputValue('')

    startTransition(async () => {
      await addUnbilledTaskAction(tempTask.description)
      const refresh = await getUnbilledTasksAction()
      if (refresh.success && refresh.data) {
        setTasks(refresh.data as UnbilledTask[])
      }
    })
  }

  const handleMarkDone = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    startTransition(async () => {
      await markUnbilledTaskAsInvoicedAction(id)
    })
  }

  const handleCreateInvoice = (description: string) => {
    // Navigate to new invoice page with the description pre-filled in the URL params
    const params = new URLSearchParams()
    params.set('desc', description)
    router.push(`/invoices/new?${params.toString()}`)
  }

  if (loading) return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 animate-pulse">
      <div className="h-5 w-40 bg-neutral-800 rounded mb-4"></div>
      <div className="h-10 w-full bg-neutral-800 rounded"></div>
    </div>
  )

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-6 flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-[var(--user-accent)]" />
          Unbilled Work (Scratchpad)
        </h3>
        <p className="text-sm text-neutral-400 mt-1">
          Quickly log things you&apos;ve done. Convert them to invoices later.
        </p>
      </div>

      <form onSubmit={handleAddTask} className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="e.g. Wrote 2 blog articles for Acme Corp..."
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2.5 pl-4 pr-12 text-sm text-neutral-200 placeholder:text-neutral-500 focus:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-700"
          disabled={isPending}
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isPending}
          className="absolute right-1.5 top-1.5 rounded-md bg-[var(--user-accent)] p-1 text-white hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
        </button>
      </form>

      {tasks.length > 0 && (
        <div className="mt-2 space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {tasks.map(task => (
            <div key={task.id} className="group relative flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 hover:border-neutral-700 transition-colors">
              <span className="text-sm text-neutral-300 pr-20">{task.description}</span>
              
              <div className="absolute right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleCreateInvoice(task.description)}
                  title="Create Invoice from this"
                  className="rounded bg-neutral-800 p-1.5 text-neutral-300 hover:bg-neutral-700 hover:text-white"
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
        <div className="mt-2 text-center py-6 border border-dashed border-neutral-800 rounded-lg">
          <p className="text-sm text-neutral-500">No unbilled tasks! You&apos;re all caught up.</p>
        </div>
      )}
    </div>
  )
}
