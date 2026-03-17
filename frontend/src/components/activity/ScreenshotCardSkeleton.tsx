"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function ScreenshotCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="p-3">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-3 w-32 mb-1" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
        <Skeleton className="mb-2 aspect-video w-full rounded border border-slate-200" />
        <div className="mb-2 text-center">
          <Skeleton className="h-3 w-16 mx-auto" />
        </div>
        <div className="mb-2 flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-3 rounded" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      </div>
    </div>
  )
}

