"use client"
import React from 'react'

export type ShadcnChartConfig = Record<string, { label?: string; color?: string }>

export function ShadcnChartContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className} data-shadcn-chart>
      {children}
    </div>
  )
}

export function ShadcnChartTooltip({ content }: { content?: React.ReactNode }) {
  // passthrough: recharts expects a component, we will return given content
  return <>{content}</>
}

export function ShadcnChartTooltipContent({ children }: { children?: React.ReactNode }) {
  return <div className="p-2 text-xs">{children}</div>
}
