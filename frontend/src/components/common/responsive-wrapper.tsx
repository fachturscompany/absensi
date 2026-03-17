"use client"

import React from "react"
import { useIsClient } from "@/lib/hydration-safe"

interface ResponsiveWrapperProps {
  children: React.ReactNode
  className?: string
  baseClasses?: string
  responsiveClasses?: string
}

/**
 * Wrapper component to handle responsive classes without hydration errors
 * Responsive classes are applied only after client-side hydration
 */
export function ResponsiveWrapper({ 
  children, 
  className = "",
  baseClasses = "flex flex-1 flex-col gap-4",
  responsiveClasses = "p-3 sm:p-4 md:p-6 max-w-full overflow-x-hidden"
}: ResponsiveWrapperProps) {
  const isClient = useIsClient()

  // Responsive classes applied only after hydration
  const appliedResponsiveClasses = isClient ? responsiveClasses : ""

  return (
    <div className={`${baseClasses} ${appliedResponsiveClasses} ${className}`.trim()}>
      {children}
    </div>
  )
}
