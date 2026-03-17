"use client"

import * as React from "react"
import { Cell, Pie, PieChart } from "recharts"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

type Slice = {
  key: "present" | "late" | "absent" | "excused"
  label: string
  color: string
}

const slices: Slice[] = [
  { key: "present", label: "Present", color: "#22c55e" }, // green-500 - hijau
  { key: "late", label: "Late", color: "#f97316" }, // orange-500 - orange/kuning
  { key: "absent", label: "Absent", color: "#dc2626" }, // red-600 - merah
  { key: "excused", label: "Excused", color: "#2563eb" }, // blue-600 - biru
]

const chartConfig: ChartConfig = slices.reduce((acc, slice) => {
  acc[slice.key] = { label: slice.label, color: slice.color }
  return acc
}, {} as ChartConfig)

export type MemberAttendanceDonutProps = {
  data?: Partial<Record<Slice["key"], number>>
  showLegend?: boolean
  hideTitle?: boolean
}

export const MemberAttendanceDonut: React.FC<MemberAttendanceDonutProps> = ({ 
  data, 
  showLegend = true, 
  hideTitle = false 
}) => {
  const chartData = React.useMemo(() => {
    const rows = slices.map((slice) => {
      const value = Number(data?.[slice.key] ?? 0)
      return { ...slice, value }
    })
    const total = rows.reduce((acc, item) => acc + item.value, 0)
    return total
      ? rows.map((row) => ({ ...row, percentage: Math.round((row.value / total) * 100) }))
      : rows.map((row) => ({ ...row, percentage: 0 }))
  }, [data])

  const total = React.useMemo(() => chartData.reduce((acc, item) => acc + item.value, 0), [chartData])

  return (
    <div className="space-y-5">
      {!hideTitle && (
        <div className="space-y-1 text-left">
          <h3 className="text-base font-semibold text-foreground">Attendance Percentage</h3>
          <p className="text-sm text-muted-foreground">Attendance distribution across the evaluation period.</p>
        </div>
      )}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-64 w-full max-w-xs">
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              innerRadius={70}
              outerRadius={100}
              strokeWidth={2}
            >
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        {showLegend ? (
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            {chartData.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between gap-3 rounded-xl border border-muted-foreground/10 bg-card/70 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{total ? `${item.percentage}%` : "0%"}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default MemberAttendanceDonut
