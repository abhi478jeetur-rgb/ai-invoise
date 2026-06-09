import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardRootLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-3.5 w-64 mt-2" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* Generic Card Body */}
      <div className="border border-border bg-card/40 backdrop-blur-xl rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2.5 border-t border-border">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-20 ml-auto" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
