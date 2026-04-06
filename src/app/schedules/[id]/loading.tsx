import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingScheduleDetails() {
  return (
    <>
      <div>
        {/* ── Page Header Skeleton ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-48 sm:w-64" />
          </div>

          {/* Summary chips */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Skeleton className="h-7 w-32 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {/* ── Timezone info bar ── */}
        <Skeleton className="h-9 w-full rounded-lg" />

        {/* ── Two-Panel Editor ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          
          {/* ── Left Panel: Day Selector ── */}
          <div className="md:col-span-1 border rounded-xl overflow-hidden bg-card shadow-sm">
            <div className="px-4 py-3 border-b bg-muted/30">
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="divide-y">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="w-full px-4 py-3 flex items-center justify-between">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Panel: Day Editor ── */}
          <div className="border rounded-xl bg-card shadow-sm md:col-span-2 lg:col-span-3">
            {/* Panel Header */}
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>

            <div className="p-5 space-y-5">
              {/* Quick Presets */}
              <div>
                <Skeleton className="h-3 w-24 mb-2.5" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-8 w-32 rounded-full" />
                  <Skeleton className="h-8 w-28 rounded-full" />
                  <Skeleton className="h-8 w-28 rounded-full" />
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
              </div>

              {/* Time Fields */}
              <div>
                <Skeleton className="h-3 w-36 mb-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-9 w-full rounded-md" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Copy Actions */}
              <div className="pt-1">
                <Skeleton className="h-3 w-32 mb-2.5 mt-4" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-8 w-28 rounded-full" />
                  <Skeleton className="h-8 w-36 rounded-full" />
                  <Skeleton className="h-8 w-32 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Assign Members ── */}
        <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
          {/* Section Header */}
          <div className="px-5 py-4 bg-muted/30 flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-24" />
          </div>

          <div className="p-5 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Skeleton className="h-9 w-full sm:w-72 rounded-md" />
              <Skeleton className="h-9 w-32 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
              <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-[148px] rounded-md" />
              </div>
            </div>

            {/* Member list */}
            <div>
              <Skeleton className="h-3 w-32 mb-2" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-full" />
                ))}
              </div>
            </div>

            {/* Selected members */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-[56px] w-full rounded-lg" />
            </div>
          </div>
        </div>

        {/* ── Action Bar ── */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t">
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-32 rounded-md" />
        </div>
      </div>
    </>
  )
}