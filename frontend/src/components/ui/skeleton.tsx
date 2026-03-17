import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "skeleton-shimmer relative overflow-hidden rounded-lg",
        "bg-gray-300 dark:bg-gray-700",
        "before:absolute before:inset-0",
        "before:-translate-x-full",
        "before:bg-gradient-to-r",
        "before:from-transparent before:via-white/60 before:to-transparent",
        "dark:before:via-white/20",
        "isolate",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
