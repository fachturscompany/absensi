"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/tables/data-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export type RecentMemberRow = {
  attendance_date?: string
  status?: string
  work_duration_minutes?: number | null
  actual_check_in?: string | null
  actual_check_out?: string | null
}

const computeDuration = (row: RecentMemberRow) => {
  const baseMinutes = row.work_duration_minutes
  if (baseMinutes != null && Number.isFinite(Number(baseMinutes)) && Number(baseMinutes) > 0) {
    return Number(baseMinutes)
  }

  const { actual_check_in: checkIn, actual_check_out: checkOut } = row

  // If checked in but not checked out, return estimated 8 hours (480 minutes)
  if (checkIn && !checkOut) {
    return 480; // Default 8 hours estimated
  }

  if (!checkIn || !checkOut) return null

  const parseTime = (value: string) => {
    const parsed = Date.parse(value)
    if (!Number.isNaN(parsed)) return parsed

    const match = value.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/) // HH:MM[:SS]
    if (!match) return null
    const date = new Date()
    date.setHours(Number(match[1]), Number(match[2]), Number(match[3] || 0), 0)
    return date.getTime()
  }

  const start = parseTime(checkIn)
  const end = parseTime(checkOut)
  if (start == null || end == null || end <= start) return null

  const diffMins = Math.round((end - start) / 60000)
  return diffMins > 0 ? diffMins : null
}

const columns: ColumnDef<RecentMemberRow, any>[] = [
  {
    accessorKey: "attendance_date",
    header: "Date",
    cell: ({ getValue }) => {
      const v = getValue() as string | undefined
      if (!v) return "-"
      try {
        const dt = new Date(v)
        if (isNaN(dt.getTime())) return String(v)
        return format(dt, "MMM d, yyyy")
      } catch {
        return String(v)
      }
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const s = (getValue() as string) || "-"
      return <Badge variant="outline" className="capitalize">{s}</Badge>
    },
  },
  {
    accessorKey: "work_duration_minutes",
    header: "Duration",
    cell: ({ row }) => {
      const v = computeDuration(row.original)
      if (v == null) return "-"
      const h = Math.floor(v / 60)
      const m = v % 60
      return `${h}h ${String(m).padStart(2, "0")}m`
    },
    meta: { align: "right" },
  },
]

export function Recent30DataTable({ data }: { data: RecentMemberRow[] }) {
  // Limit to last 7 days (including today)
  const filtered = React.useMemo(() => {
    if (!Array.isArray(data)) return []
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 6) // last 7 days inclusive
    const startIso = start.toISOString().split("T")[0] as string
    const endIso = end.toISOString().split("T")[0] as string

    return data
      .filter((r) => {
        const d = r.attendance_date
        if (!d) return false
        const s = String(d)
        // try to extract YYYY-MM-DD via regex first (handles '2025-10-13', '2025-10-13 08:00', etc.)
        const m = s.match(/\d{4}-\d{2}-\d{2}/)
        let ds: string | null = null
        if (m) ds = m[0]
        else {
          // fallback to Date parsing
          const dt = new Date(s)
          if (!isNaN(dt.getTime())) ds = dt.toISOString().split("T")[0] || null
        }
        if (!ds) return false
        return ds >= startIso && ds <= endIso
      })
      .sort((a, b) => {
        // sort descending by date
        const ad = a.attendance_date ? String(a.attendance_date).localeCompare(String(b.attendance_date)) : 0
        return -ad
      })
  }, [data])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="font-medium">Attendance in the last 7 days</div>
        <div className="text-muted-foreground">{filtered.length} records</div>
      </div>
      <DataTable
        columns={columns}
        data={filtered}
        showGlobalFilter={false}
        showPagination={false}
        showColumnToggle={false}
        getRowKey={(row) => `${row.attendance_date ?? "unknown"}-${row.status ?? "status"}-${row.actual_check_in ?? "in"}`}
      />
    </div>
  )
}

export default Recent30DataTable
