import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="min-h-screen relative select-none">
      <div className="space-y-10 max-w-6xl mx-auto pb-20">

        {/* 1. Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-3.5 w-72 mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        </div>

        {/* 2. Summary Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="border border-border bg-card/40 backdrop-blur-xl p-5 rounded-xl"
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-28 mt-3" />
              <Skeleton className="h-3 w-24 mt-2" />
            </div>
          ))}
        </div>

        {/* 3. Who to Chase Today */}
        <div className="border border-border bg-card/40 backdrop-blur-xl p-6 rounded-xl">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="mt-4 space-y-2.5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Skeleton className="w-1.5 h-10 rounded-full shrink-0" />
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-5 w-16 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-5 w-20 rounded" />
                      <Skeleton className="h-5 w-24 rounded" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-8 w-28 rounded-md" />
                  <Skeleton className="h-8 w-24 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Recent Invoices Table */}
        <div className="border border-border bg-card/40 backdrop-blur-xl p-6 rounded-xl">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="mt-4 space-y-3">
            {/* Table header */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16 ml-auto" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
            {/* Table rows */}
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-2.5 border-t border-border"
              >
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-20 ml-auto" />
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-5 w-14 rounded" />
                <Skeleton className="h-3.5 w-12" />
              </div>
            ))}
          </div>
        </div>

        {/* 5. Recent Reminder Activity */}
        <div className="border border-border bg-card/40 backdrop-blur-xl p-6 rounded-xl">
          <Skeleton className="h-3 w-44 pb-4 border-b border-border" />
          <div className="mt-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                  {i < 2 && <div className="w-px flex-1 my-1 bg-accent" />}
                </div>
                <div className="pb-4 min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-64" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
