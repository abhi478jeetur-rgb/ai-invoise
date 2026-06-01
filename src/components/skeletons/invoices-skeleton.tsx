import { Skeleton } from '@/components/ui/skeleton'

export function InvoicesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header and Controls Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-96">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Invoice List Skeletons */}
      <div className="grid gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-card border border-border/50 rounded-xl shadow-sm gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="space-y-2 text-right hidden sm:block">
                <Skeleton className="h-5 w-24 ml-auto" />
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
              <Skeleton className="h-6 w-16 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
