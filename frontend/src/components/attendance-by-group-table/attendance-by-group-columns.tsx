"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export type AttendanceByGroupRow = {
  group?: string
  present_plus_late?: number
  not_in_others?: number
  percent_present?: number
  late_count?: number
  overall?: number
}

export const attendanceByGroupColumns: ColumnDef<AttendanceByGroupRow>[] = [
  {
    id: "group",
    accessorKey: "group",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Group
        </Button>
      )
    },
    cell: ({ row }) => {
      const group = row.getValue("group") as string
      return (
        <div className="flex items-center gap-3 ml-4">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 flex items-center justify-center">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {group?.charAt(0) || '?'}
            </span>
          </div>
          <span className="font-semibold">{group || 'Unknown'}</span>
        </div>
      )
    },
  },
  {
    id: "present_plus_late",
    accessorKey: "present_plus_late",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Present
        </Button>
      )
    },
    cell: ({ row }) => {
      const present = (row.getValue("present_plus_late") as number) || 0
      return (
        <Badge 
          variant="outline" 
          className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 font-semibold"
        >
          ✓ {present}
        </Badge>
      )
    },
  },
  {
    id: "late_count",
    accessorKey: "late_count",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Late
        </Button>
      )
    },
    cell: ({ row }) => {
      const late = (row.getValue("late_count") as number) || 0
      return (
        <Badge 
          variant="outline" 
          className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-semibold"
        >
          ⏱ {late}
        </Badge>
      )
    },
  },
  {
    id: "not_in_others",
    accessorKey: "not_in_others",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Absent
        </Button>
      )
    },
    cell: ({ row }) => {
      const absent = (row.getValue("not_in_others") as number) || 0
      return (
        <Badge 
          variant="outline" 
          className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 font-semibold"
        >
          ✗ {absent}
        </Badge>
      )
    },
  },
  {
    id: "overall",
    accessorKey: "overall",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Total
        </Button>
      )
    },
    cell: ({ row }) => {
      const total = (row.getValue("overall") as number) || 0
      return (
        <span className="font-semibold text-muted-foreground">{total}</span>
      )
    },
  },
  {
    id: "percent_present",
    accessorKey: "percent_present",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="font-medium"
        >
          Attendance Rate
        </Button>
      )
    },
    cell: ({ row }) => {
      const percent = (row.getValue("percent_present") as number) || 0
      const percentage = percent * 100
      const presentPlusLate = (row.getValue("present_plus_late") as number) || 0
      const overall = (row.getValue("overall") as number) || 0
      
      // Calculate trend
      const trend = percentage >= 80 ? 'up' : percentage >= 60 ? 'stable' : 'down'
      const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
      
      return (
        <div className="space-y-2 min-w-[220px] py-2">
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-xl font-bold tabular-nums",
              percentage >= 80 ? "text-green-600 dark:text-green-400" :
              percentage >= 60 ? "text-blue-600 dark:text-blue-400" :
              "text-red-600 dark:text-red-400"
            )}>
              {percentage.toFixed(1)}%
            </span>
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              trend === 'up' ? "bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400" :
              trend === 'down' ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400" :
              "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
            )}>
              <TrendIcon className="h-3 w-3" />
              {trend === 'up' ? 'Excellent' : trend === 'down' ? 'Low' : 'Fair'}
            </div>
          </div>
          <Progress 
            value={percentage} 
            className={cn(
              "h-2.5 bg-muted",
              percentage >= 80 ? "[&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-500" :
              percentage >= 60 ? "[&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-cyan-500" :
              "[&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-orange-500"
            )}
          />
          <p className="text-xs text-muted-foreground font-medium">
            {presentPlusLate} of {overall} members checked in
          </p>
        </div>
      )
    },
  },
]
