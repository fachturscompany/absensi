"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 w-full max-w-6xl mx-auto p-4">
          
          <div className="space-y-2 w-full">
            <Skeleton className="h-10 w-full" />
         
          </div>
        </div>
      ))}
    </div>
  )
}
