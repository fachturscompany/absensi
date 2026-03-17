"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ScreenshotCardSkeleton } from "@/components/activity/ScreenshotCardSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Page() {
  const router = useRouter()
  
  useEffect(() => {
    // Delay redirect agar skeleton terlihat dengan jelas
    const timer = setTimeout(() => {
      router.replace("/activity/screenshots/10min")
    }, 500)
    
    return () => clearTimeout(timer)
  }, [router])
  
  // Copy semua skeleton dari halaman 10min
  return (
    <>
      {/* How Activity Works Section */}
      <div className="space-y-4">
        {true ? (
          <>
            {/* Skeleton untuk Header (Worked time & Avg. activity) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex gap-6">
                <div className="flex flex-1 flex-col justify-between">
                  <Skeleton className="h-3 w-24 mb-2" />
                  <Skeleton className="h-9 w-20" />
                </div>
                <div className="flex flex-1 flex-col justify-between border-l border-slate-200 pl-6">
                  <Skeleton className="h-3 w-28 mb-2" />
                  <Skeleton className="h-9 w-16" />
                </div>
              </div>
            </div>
            {/* Skeleton untuk Summary Cards */}
            <div className="relative w-full rounded-t-2xl border-t border-l border-r border-slate-200 bg-white p-6 pb-10 shadow-sm mt-6 overflow-visible" style={{ borderBottom: 'none' }}>
              <div className="absolute left-0 right-0 bottom-0 flex items-center justify-center" style={{ transform: 'translateY(50%)' }}>
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-slate-200" />
                <div className="relative z-10 bg-white">
                  <Skeleton className="h-9 w-24 rounded-full" />
                </div>
              </div>
              <div className="flex flex-col md:flex-row">
                {/* Focus Time Skeleton */}
                <div className="flex flex-1 flex-col items-center justify-start gap-4 p-6 border-r border-slate-200">
                  <Skeleton className="h-3 w-24" />
                  <div className="flex flex-col items-center justify-center gap-3 py-4">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
                {/* Unusual Activity Instances Skeleton */}
                <div className="flex flex-1 flex-col items-center justify-start gap-4 p-6 border-r border-slate-200">
                  <Skeleton className="h-3 w-40" />
                  <div className="flex w-full flex-row items-center justify-center gap-4 py-8">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </div>
                {/* Work Time Classification Skeleton */}
                <div className="flex flex-1 flex-col items-center justify-start gap-4 p-6">
                  <div className="w-full space-y-2">
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2 py-4 w-full">
                    <Skeleton className="h-2 w-full max-w-[180px] rounded-full" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Screenshots Grid */}
      <div className="space-y-6">
        {true ? (
          // Loading skeleton
          <div className="space-y-6">
            {[...Array(2)].map((_, dateIdx) => (
              <div key={dateIdx} className="space-y-6">
                <Skeleton className="h-5 w-32" />
                {[...Array(2)].map((_, blockIdx) => (
                  <div key={blockIdx} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                      {[...Array(6)].map((_, cardIdx) => (
                        <ScreenshotCardSkeleton key={cardIdx} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </>
  )
}
