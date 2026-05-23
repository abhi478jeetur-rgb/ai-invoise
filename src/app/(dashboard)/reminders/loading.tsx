import { Skeleton } from '@/components/ui/skeleton'

export default function RemindersLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          {/* Search & Filters Panel */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
            <div className="p-3 space-y-3">
              <Skeleton className="h-9 w-full rounded-md" />
              <div className="flex flex-wrap gap-1.5">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-7 w-20 rounded-full" />
                ))}
              </div>
            </div>

            {/* Invoice List */}
            <div className="border-t border-zinc-800">
              <ul className="divide-y divide-zinc-800">
                {[...Array(5)].map((_, i) => (
                  <li key={i} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Invoice Details Card */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-4">
            <Skeleton className="h-4 w-28" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
            <Skeleton className="h-14 w-full rounded-md" />
          </div>

          {/* Reminder History */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="relative pl-4">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-800" />
              <ul className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <li key={i} className="relative flex items-start gap-3">
                    <Skeleton className="relative z-10 h-3.5 w-3.5 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column — Workspace */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
          {/* Invoice header */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>

          {/* Tone Selection */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5 space-y-1.5"
                >
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Skeleton className="h-10 w-full rounded-lg" />

          {/* Variant Cards */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <div className="grid gap-2 sm:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-3.5" />
                    <Skeleton className="h-3.5 w-24" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          </div>

          {/* Email Editor */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-32 w-full rounded-md" />
            </div>
          </div>

          {/* SMS Editor */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-16 w-full rounded-md" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
