import { Skeleton } from '@/components/ui/skeleton'

export default function InvoicesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3.5 w-64 mt-2" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-9 max-w-sm w-full rounded-md" />
        <div className="flex items-center gap-1.5">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Invoice List */}
      <div className="grid gap-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="border border-border bg-card/40 backdrop-blur-xl rounded-xl py-3.5 px-5"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Status bar */}
                <Skeleton className="w-1 h-8 rounded-full shrink-0" />
                {/* Title + Client */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-5 w-16 rounded" />
                  </div>
                  <Skeleton className="h-3 w-28" />
                </div>
                {/* Amount */}
                <div className="shrink-0 text-right hidden sm:block space-y-1.5">
                  <Skeleton className="h-4 w-20 ml-auto" />
                  <Skeleton className="h-3 w-16 ml-auto" />
                </div>
                {/* Status badge */}
                <Skeleton className="h-5 w-16 rounded-md shrink-0" />
              </div>
              {/* Actions */}
              <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
