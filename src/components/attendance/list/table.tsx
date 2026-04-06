import React, { useMemo } from "react"
import Link from "next/link"
import { AttendanceListItem } from "@/action/attendance"
import { UserAvatar } from "@/components/profile&image/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Timer, XCircle, AlertCircle, Edit, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatLocalTime } from "@/utils/date-helper"
import { TableSkeleton, ColumnSkeletonDef } from "@/components/skeleton/tables-loading"

interface AttendanceRowProps {
  record: AttendanceListItem
  isSelected: boolean
  onToggleSelect: (id: string, checked: boolean) => void
  onEdit: () => void
  onDelete: () => void
  checkInDisplay: { date: string; time: string; method: string }
  checkOutDisplay: { date: string; time: string; method: string }
  breakInDisplay: { date: string; time: string; method: string }
  breakOutDisplay: { date: string; time: string; method: string }
}

const AttendanceRowPure: React.FC<AttendanceRowProps> = ({
  record, isSelected, onToggleSelect, onEdit, onDelete,
  checkInDisplay, checkOutDisplay, breakInDisplay, breakOutDisplay
}) => {
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      present: "bg-slate-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      late: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      absent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      leave: "bg-slate-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      early_leave: "bg-slate-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      excused: "bg-slate-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle2 className="h-3 w-3" />
      case 'late': return <Timer className="h-3 w-3" />
      case 'absent': return <XCircle className="h-3 w-3" />
      default: return <AlertCircle className="h-3 w-3" />
    }
  }

  return (
    <tr className={cn(
      "border-b transition-colors cursor-pointer custom-hover-row",
      isSelected && "bg-slate-50 dark:bg-blue-950/50"
    )}>
      <td className="p-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggleSelect(record.id, e.target.checked)}
          className="rounded"
        />
      </td>

      <td className="p-3">
        <div className="flex items-center gap-3">
          <UserAvatar
            name={record.member?.name || ''}
            photoUrl={record.member?.avatar}
            userId={record.member?.userId}
            size={8}
          />
          <div>
            <p className="font-medium text-sm">
              <Link href={`/members/${record.member?.id ?? ""}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                {record.member?.name || 'Unknown'}
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">{record.member?.email || 'no email'}</p>
          </div>
        </div>
      </td>

      <td className="p-3">
        <p className="font-medium text-xs">{record.member?.department || '-'}</p>
      </td>

      <td className="p-3">
        <div className="flex flex-col text-xs font-mono">
          <span className="font-medium whitespace-nowrap">{checkInDisplay.date}</span>
          <span className="text-muted-foreground">{checkInDisplay.time}</span>
          {checkInDisplay.method && (
            <span className="text-[10px] text-muted-foreground uppercase font-semibold mt-0.5">
              {checkInDisplay.method}
            </span>
          )}
        </div>
      </td>

      <td className="p-3">
        <div className="flex flex-col text-xs font-mono">
          <span className="font-medium whitespace-nowrap">{breakInDisplay.date}</span>
          <span className="text-muted-foreground">{breakInDisplay.time}</span>
          {breakInDisplay.method && (
            <span className="text-[10px] text-muted-foreground uppercase font-semibold mt-0.5">
              {breakInDisplay.method}
            </span>
          )}
        </div>
      </td>

      <td className="p-3">
        <div className="flex flex-col text-xs font-mono">
          <span className="font-medium whitespace-nowrap">{breakOutDisplay.date}</span>
          <span className="text-muted-foreground">{breakOutDisplay.time}</span>
          {breakOutDisplay.method && (
            <span className="text-[10px] text-muted-foreground uppercase font-semibold mt-0.5">
              {breakOutDisplay.method}
            </span>
          )}
        </div>
      </td>

      <td className="p-3">
        <div className="flex flex-col text-xs font-mono">
          <span className="font-medium whitespace-nowrap">{checkOutDisplay.date}</span>
          <span className="text-muted-foreground">{checkOutDisplay.time}</span>
          {checkOutDisplay.method && (
            <span className="text-[10px] text-muted-foreground uppercase font-semibold mt-0.5">
              {checkOutDisplay.method}
            </span>
          )}
        </div>
      </td>

      <td className="p-3 text-center font-medium text-xs">
        {record.workHours || '0h'}
      </td>

      <td className="p-3">
        <Badge className={cn("gap-1 px-2 py-0.5 text-xs whitespace-nowrap", getStatusColor(record.status))}>
          {getStatusIcon(record.status)}
          <span className="capitalize">
            {record.status
              ? record.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
              : "Unknown"}
          </span>
        </Badge>
      </td>

      <td className="p-3">
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="icon" title="Edit" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

const AttendanceRow = React.memo(AttendanceRowPure)

export const attendanceTableSkeletonColumns: ColumnSkeletonDef[] = [
  { cell: "checkbox", headClassName: "w-10 px-3", cellClassName: "px-3 py-3" },
  { cell: "name", headerWidth: "w-20", cellClassName: "px-3 py-3", cellWidth: "w-32" },
  { cell: "text", headerWidth: "w-16", cellClassName: "px-3 py-3", cellWidth: "w-20" },
  { cell: "text", headerWidth: "w-16", cellClassName: "px-3 py-3", cellWidth: "w-20" },
  { cell: "text", headerWidth: "w-16", cellClassName: "px-3 py-3", cellWidth: "w-20" },
  { cell: "text", headerWidth: "w-16", cellClassName: "px-3 py-3", cellWidth: "w-20" },
  { cell: "text", headerWidth: "w-16", cellClassName: "px-3 py-3", cellWidth: "w-20" },
  { cell: "number", headerWidth: "w-20", cellClassName: "px-3 py-3", cellWidth: "w-12 text-center" },
  { cell: "badge", headerWidth: "w-16", cellClassName: "px-3 py-3", cellWidth: "w-20" },
  { cell: "actions", headClassName: "w-24 text-center px-3", cellClassName: "px-3 py-3 text-center" },
]

export interface AttendanceTableProps {
  items: AttendanceListItem[]
  loading: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string, checked: boolean) => void
  onSelectAll: () => void
  userTimezone: string
  onEdit: (record: AttendanceListItem) => void
  onDelete: (id: string) => void
  isMounted: boolean
}

export function AttendanceTable({
  items,
  loading,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  userTimezone,
  onEdit,
  onDelete,
  isMounted
}: AttendanceTableProps) {
  const visibleRows = useMemo(() => {
    if (!isMounted) return []

    return items.map((record) => {
      const format = (utc: string | null) => {
        if (!utc) return { date: '-', time: '-' }
        const formatted = formatLocalTime(utc, userTimezone, "24h", true)
        const parts = formatted.split(', ')
        return {
          date: parts[0] || '-',
          time: parts[1] || '-'
        }
      }

      const checkInDisplay = { 
        ...format(record.checkIn), 
        method: record.checkIn ? (record.checkInMethod || '') : '' 
      }
      const checkOutDisplay = { 
        ...format(record.checkOut), 
        method: record.checkOut ? (record.checkOutMethod || '') : '' 
      }
      const breakInDisplay = { 
        ...format(record.actualBreakStart), 
        method: record.actualBreakStart ? (record.breakInMethod || '') : '' 
      }
      const breakOutDisplay = { 
        ...format(record.actualBreakEnd), 
        method: record.actualBreakEnd ? (record.breakOutMethod || '') : '' 
      }

      return (
        <AttendanceRow
          key={record.id}
          record={record}
          isSelected={selectedIds.has(record.id)}
          onToggleSelect={onToggleSelect}
          onEdit={() => onEdit(record)}
          onDelete={() => onDelete(record.id)}
          checkInDisplay={checkInDisplay}
          checkOutDisplay={checkOutDisplay}
          breakInDisplay={breakInDisplay}
          breakOutDisplay={breakOutDisplay}
        />
      )
    })
  }, [items, userTimezone, selectedIds, onToggleSelect, isMounted, onEdit, onDelete])

  if (loading) {
    return (
      <div className="overflow-x-auto w-full">
        <TableSkeleton rows={6} columns={attendanceTableSkeletonColumns} />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full min-w-[880px]">
        <thead className="bg-muted/50">
          <tr>
            <th className="p-3 text-left w-10">
              <input
                type="checkbox"
                checked={selectedIds.size === items.length && items.length > 0}
                onChange={onSelectAll}
                className="rounded cursor-pointer"
              />
            </th>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Member</th>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Group</th>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Check In</th>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Break In</th>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Break Out</th>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">Check Out</th>
            <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider">Work Hours</th>
            <th className="p-3 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
            <th className="p-3 text-center text-xs font-semibold uppercase tracking-wider w-24">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.length === 0 ? (
            <tr>
              <td colSpan={10} className="text-center py-12 text-muted-foreground text-sm italic">
                No attendance records found
              </td>
            </tr>
          ) : (
            visibleRows
          )}
        </tbody>
      </table>
    </div>
  )
}
