import { Skeleton } from '@/components/ui/skeleton'

export default function ClientsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-3.5 w-60 mt-2" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>

      {/* Client List */}
      <div className="grid gap-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="border border-border bg-card/40 backdrop-blur-xl rounded-xl py-3.5 px-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Avatar */}
                <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                {/* Name + Info */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-24 hidden lg:block" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
