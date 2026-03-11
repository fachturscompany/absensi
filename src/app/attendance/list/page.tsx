"use client"
import React, { useCallback, useEffect, useRef, useState, useMemo, useDeferredValue } from "react"

import { DateFilterBar } from "@/components/analytics/date-filter-bar"
import { useOrgStore } from "@/store/org-store"
import { formatInTimeZone } from "date-fns-tz"
import type { GetAttendanceResult, AttendanceListItem } from "@/action/attendance"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { deleteAttendanceRecord, deleteMultipleAttendanceRecords, updateAttendanceRecord } from "@/action/attendance"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { AnimatePresence, motion } from "framer-motion"
import {
  Search, RotateCcw, Plus, Download, Edit, Trash2, CheckCircle2, Timer, XCircle, AlertCircle,
} from "lucide-react"
import { UserAvatar } from "@/components/profile&image/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PaginationFooter } from "@/components/tables/pagination-footer"
import { cn } from "@/lib/utils"
import { formatLocalTime } from "@/utils/timezone"

interface AttendanceRowProps {
  record: AttendanceListItem
  isSelected: boolean
  onToggleSelect: (id: string, checked: boolean) => void
  onEdit: () => void
  onDelete: () => void
  showLocation: boolean
  checkInDisplay: { date: string; time: string; method: string }
  checkOutDisplay: { date: string; time: string; method: string }
  breakInDisplay: { date: string; time: string; method: string }
  breakOutDisplay: { date: string; time: string; method: string }
}

const AttendanceRowPure: React.FC<AttendanceRowProps> = ({
  record, isSelected, onToggleSelect, onEdit, onDelete, showLocation,
  checkInDisplay, checkOutDisplay, breakInDisplay, breakOutDisplay
}) => {
  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      present: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      late: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      absent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      leave: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      early_leave: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      excused: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'late':
        return <Timer className="h-3 w-3" />;
      case 'absent':
        return <XCircle className="h-3 w-3" />;
      case 'leave':
      case 'excused':
      case 'early_leave':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  return (
    <tr className={cn(
      "border-b transition-colors cursor-pointer custom-hover-row",
      isSelected && "bg-blue-50 dark:bg-blue-950/50"
    )}>
      {/* Checkbox */}
      <td className="p-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggleSelect(record.id, e.target.checked)}
          className="rounded"
        />
      </td>

      {/* Member */}
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
              <Link href={`/members/${record.member?.id ?? ""}`} className="hover:underline">
                {record.member?.name || 'Unknown'}
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">{record.member?.email || 'no email'}</p>
          </div>
        </div>
      </td>

      {/* Department */}
      <td className="p-3">
        <p className="font-medium text-xs">{record.member?.department || '-'}</p>
      </td>

      {/* Check In */}
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

      {/* Check Out */}
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

      {/* Break In */}
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

      {/* Break Out */}
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

      {/* Work Hours */}
      <td className="p-3">
        <span className="font-medium text-xs">{record.workHours || '0h'}</span>
      </td>

      {/* Status */}
      <td className="p-3">
        <Badge className={cn("gap-1 px-2 py-0.5 text-xs", getStatusColor(record.status))}>
          {getStatusIcon(record.status)}
          <span className="capitalize">
            {record.status
              ? record.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
              : "Unknown"}
          </span>
        </Badge>
      </td>

      {/* Location */}
      {showLocation && <td className="p-3">-</td>}

      {/* Actions */}
      <td className="p-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Edit" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Delete" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

const AttendanceRow = React.memo(AttendanceRowPure)

function ModernAttendanceListCloned() {
  const orgStore = useOrgStore()

  type QueryParams = {
    orgId: number | null
    page: number
    limit: number
    dateFrom: string
    dateTo: string
    search: string
    status: string
    department: string
  }

  const [queryParams, setQueryParams] = useState<QueryParams>({
    orgId: null,
    page: 1,
    limit: 10,
    dateFrom: (() => {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      return now.toLocaleDateString('en-CA')
    })(),
    dateTo: (() => {
      const now = new Date()
      now.setHours(23, 59, 59, 999)
      return now.toLocaleDateString('en-CA')
    })(),
    search: "",
    status: "all",
    department: "all"
  })

  const deferredSearch = useDeferredValue(queryParams.search)
  const [data, setData] = useState<{ items: AttendanceListItem[], total: number }>({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [userTimezone, setUserTimezone] = useState("UTC")
  const [selectedIds, setSelectedIds] = useState(new Set<string>())
  const [departments, setDepartments] = useState<string[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Dialog states
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmState, setConfirmState] = useState<{ mode: "single" | "bulk"; id?: string } | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AttendanceListItem | null>(null)
  const [editIn, setEditIn] = useState("")
  const [editOut, setEditOut] = useState("")
  const [editRemarks, setEditRemarks] = useState("")

  // Performance refs


  const fetchDataRef = useRef<() => void>(() => { })
  const queryParamsRef = useRef(queryParams)
  queryParamsRef.current = queryParams
  const orgIdRef = useRef(orgStore.organizationId)
  orgIdRef.current = orgStore.organizationId
  const queryKeyRef = useRef('')


  // Helper functions
  function toOrgYMD(d: Date, tz?: string): string {
    if (!tz || tz === "UTC") {
      const dt = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      return dt.toISOString().slice(0, 10)
    }
    try {
      return formatInTimeZone(d, tz, "yyyy-MM-dd")
    } catch {
      const dt = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      return dt.toISOString().slice(0, 10)
    }
  }

  // ✅ FIXED QUERY KEY - Stable dependencies
  const orgId = useMemo(() =>
    queryParams.orgId || orgStore.organizationId,
    [queryParams.orgId, orgStore.organizationId]
  )

  const queryKey = useMemo(() => JSON.stringify({
    orgId,
    page: queryParams.page,
    limit: queryParams.limit,
    dateFrom: queryParams.dateFrom,
    dateTo: queryParams.dateTo,
    status: queryParams.status,
    department: queryParams.department,
    search: deferredSearch?.trim() ?? "",
  }), [orgId, queryParams.page, queryParams.limit, queryParams.dateFrom, queryParams.dateTo,
    queryParams.status, queryParams.department, deferredSearch])


  // Update query helper
  const updateQueryParams = useCallback((updates: Partial<QueryParams>) => {
    setQueryParams(prev => ({ ...prev, ...updates, page: 1 }))
  }, [])

  const fetchData = useCallback(async () => {
    const qp = queryParamsRef.current
    const orgId = qp.orgId || orgIdRef.current
    if (!orgId) {
      setLoading(false)
      return
    }

    setLoading(true)

    // ✅ NO CACHE - Langsung fetch fresh
    const params = new URLSearchParams({
      page: qp.page.toString(),
      limit: qp.limit.toString(),
      dateFrom: qp.dateFrom,
      dateTo: qp.dateTo,
      organizationId: orgId.toString(),
      _cb: Date.now().toString(),  // ✅ Cache buster
      ...(qp.status !== "all" && { status: qp.status }),
      ...(qp.department !== "all" && { department: qp.department }),
      ...(qp.search?.trim().length >= 2 && { search: qp.search.trim() })
    })

    const res = await fetch(`/api/attendance-records?${params}`, {
      cache: 'no-store',  // ✅ No browser cache
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })

    const result = await res.json() as GetAttendanceResult
    handleFetchSuccess(result)
    setLoading(false)
  }, [])

  // Keep ref in sync so the realtime callback always calls the latest fetchData
  // without being a useEffect dependency (prevents infinite re-subscription loop)
  queryKeyRef.current = queryKey
  fetchDataRef.current = fetchData

  const handleFetchSuccess = useCallback((result: GetAttendanceResult) => {
    if (result.success) {
      const items = (result.data || []) as AttendanceListItem[]
      setData({ items, total: result.meta?.total || items.length })

      // Only update timezone if it actually changed — avoids re-render cascade
      if (items.length > 0) {
        const nextTz = items[0]?.timezone ?? "UTC"
        setUserTimezone(prev => prev === nextTz ? prev : nextTz)
      }

      // Only update departments if the list actually changed — avoids re-render cascade
      const uniqueDepts = Array.from(new Set(
        items.map(r => r.member?.department)
          .filter((d): d is string => Boolean(d && d !== "No Department"))
      )).sort()
      setDepartments(prev => {
        const same = prev.length === uniqueDepts.length && prev.every((d, i) => d === uniqueDepts[i])
        return same ? prev : uniqueDepts
      })
    } else {
      setData({ items: [], total: 0 })
    }
  }, [])

  useEffect(() => {
    if (!orgId) return
    console.log('🔍 NO FILTER TEST - orgId:', orgId)

    const supabase = createClient()
    const channel = supabase.channel('test_no_filter')

    // ❌ NO FILTER - dengar SEMUA changes
    channel
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records'
          // NO FILTER!
        },
        (payload: any) => {
          console.log('🔔 NO FILTER TRIGGERED:', payload)
          fetchData()
        }
      )
      .subscribe((status: any) => console.log('📶 NO FILTER:', status))

    return () => supabase.removeChannel(channel)
  }, [orgId, fetchData])


  useEffect(() => {
    if (!orgId) return
    fetchDataRef.current()
  }, [queryKey, orgId])

  // Selection handlers
  const toggleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(prev =>
      prev.size === data.items.length
        ? new Set()
        : new Set(data.items.map(r => r.id))
    )
  }, [data.items.length])

  // ✅ FIXED VISIBLE ROWS - Precompute outside hooks
  const visibleRows = useMemo(() => {
    return data.items.map((record) => {
      // Pre-compute displays (NO HOOKS)
      const checkInDisplay = (() => {
        if (!record.checkIn) return { date: '-', time: '-', method: '' }
        try {
          const formatted = formatLocalTime(record.checkIn, userTimezone, "24h", true)
          const [datePart, timePart] = formatted.split(', ')
          return {
            date: datePart || '-',
            time: timePart || '-',
            method: record.checkInMethod || ''
          }
        } catch {
          return { date: '-', time: '-', method: '' }
        }
      })()

      const checkOutDisplay = (() => {
        if (!record.checkOut) return { date: '-', time: '-', method: '' }
        try {
          const formatted = formatLocalTime(record.checkOut, userTimezone, "24h", true)
          const [datePart, timePart] = formatted.split(', ')
          return {
            date: datePart || '-',
            time: timePart || '-',
            method: record.checkOutMethod || ''
          }
        } catch {
          return { date: '-', time: '-', method: '' }
        }
      })()

      const breakInDisplay = (() => {
        if (!record.actualBreakStart) return { date: '-', time: '-', method: '' }
        try {
          const formatted = formatLocalTime(record.actualBreakStart, userTimezone, "24h", true)
          const [datePart, timePart] = formatted.split(', ')
          return {
            date: datePart || '-',
            time: timePart || '-',
            method: record.breakInMethod || ''
          }
        } catch {
          return { date: '-', time: '-', method: '' }
        }
      })()

      const breakOutDisplay = (() => {
        if (!record.actualBreakEnd) return { date: '-', time: '-', method: '' }
        try {
          const formatted = formatLocalTime(record.actualBreakEnd, userTimezone, "24h", true)
          const [datePart, timePart] = formatted.split(', ')
          return {
            date: datePart || '-',
            time: timePart || '-',
            method: record.breakOutMethod || ''
          }
        } catch {
          return { date: '-', time: '-', method: '' }
        }
      })()

      return (
        <AttendanceRow
          key={record.id}
          record={record}
          isSelected={selectedIds.has(record.id)}
          onToggleSelect={toggleSelect}
          onEdit={() => {
            setEditTarget(record)
            setEditIn(record.checkIn ?? "")
            setEditOut(record.checkOut ?? "")
            setEditRemarks("")
            setEditOpen(true)
          }}
          onDelete={() => {
            setConfirmState({ mode: "single", id: record.id })
            setConfirmOpen(true)
          }}
          showLocation={false}
          checkInDisplay={checkInDisplay}
          checkOutDisplay={checkOutDisplay}
          breakInDisplay={breakInDisplay}
          breakOutDisplay={breakOutDisplay}
        />
      )
    })
  }, [data.items, userTimezone, selectedIds, toggleSelect])

  // Event handlers
  const handleManualRefresh = useCallback(() => fetchData(), [fetchData])
  const handleDeleteMultiple = useCallback(() => {
    if (selectedIds.size === 0) {
      toast.info("No records selected")
      return
    }
    setConfirmState({ mode: "bulk" })
    setConfirmOpen(true)
  }, [selectedIds.size])

  const submitEdit = async () => {
    if (!editTarget) return
    try {
      setIsSubmitting(true)
      const res = await updateAttendanceRecord({
        id: editTarget.id,
        actual_check_in: editIn.trim() === "" ? null : editIn.trim(),
        actual_check_out: editOut.trim() === "" ? null : editOut.trim(),
        remarks: editRemarks.trim() === "" ? null : editRemarks.trim(),
      })

      if (res.success) {
        toast.success("Record updated")
        setEditOpen(false)
        setEditTarget(null)
        setEditIn("")
        setEditOut("")
        setEditRemarks("")
        fetchData()
      } else {
        toast.error(res.message || "Failed to update record")
      }
    } catch (e) {
      toast.error("Failed to update record")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Effects
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const SHOW_LOCATION = false

  return (
    <>
      <style jsx global>{`
        .custom-hover-row:hover,
        .custom-hover-row:hover > td {
          background-color: #f4f4f5 !important;
        }
        .dark .custom-hover-row:hover,
        .dark .custom-hover-row:hover > td {
          background-color: #27272a !important;
        }
      `}</style>

      {/* Toolbar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Attendance list</h1>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-2 flex-wrap">
          {/* Search */}
          <div className="w-full md:flex-1 md:min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search..."
              value={queryParams.search}
              onChange={(e) => updateQueryParams({ search: e.target.value })}
              className="pl-10 bg-white w-full"
            />
          </div>

          {/* Date Filter */}
          <div className="w-full md:w-auto shrink-0">
            <DateFilterBar
              dateRange={{
                from: new Date(queryParams.dateFrom),
                to: new Date(queryParams.dateTo),
                preset: "custom" as const
              }}
              onDateRangeChange={({ from, to }) =>
                updateQueryParams({
                  dateFrom: toOrgYMD(from, userTimezone),
                  dateTo: toOrgYMD(to, userTimezone)
                })
              }
              className="w-full justify-start"
            />
          </div>

          {/* Filters */}
          <div className="flex w-full md:w-auto gap-2 shrink-0">
            {/* Status */}
            <div className="flex-1 md:w-auto">
              {isMounted ? (
                <Select
                  value={queryParams.status}
                  onValueChange={(v) => updateQueryParams({ status: v })}
                >
                  <SelectTrigger className="w-full md:w-[140px] bg-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="excused">Excused</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="w-full md:w-[140px] h-9 border rounded bg-muted/50" />
              )}
            </div>

            {/* Department */}
            <div className="flex-1 md:w-auto">
              {isMounted ? (
                <Select
                  value={queryParams.department}
                  onValueChange={(v) => updateQueryParams({ department: v })}
                >
                  <SelectTrigger className="w-full md:w-40 bg-white">
                    <SelectValue placeholder="Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="w-full md:w-40 h-9 border rounded bg-muted/50" />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex w-full md:w-auto gap-2 shrink-0">
            <Button
              onClick={handleManualRefresh}
              title="Refresh"
              className="shrink-0 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90"
              disabled={loading}
            >
              <RotateCcw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>

            <Link href="/attendance/list/import" className="flex-1 md:flex-none">
              <Button variant="outline" className="w-full bg-white whitespace-nowrap">
                <Download className="mr-2 h-4 w-4" />
                Import
              </Button>
            </Link>

            <Link href="/attendance/add" className="flex-1 md:flex-none">
              <Button className="w-full bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 whitespace-nowrap">
                <Plus className="mr-2 h-4 w-4" />
                Entry
              </Button>
            </Link>
          </div>
        </div>

        {/* Selected Actions Bar */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{
                opacity: 1,
                y: 0
              }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2"
            >
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="sm" disabled={selectedIds.size !== 1}>
                <Edit className="mr-2 h-4 w-4" />
                {selectedIds.size === 1 ? "Edit" : "Bulk Edit"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteMultiple}
                disabled={isSubmitting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="ml-auto"
              >
                Clear Selection
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div>
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[880px]">
                <thead className="sticky top-0 z-10 bg-muted/50">
                  <tr>
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === data.items.length && data.items.length > 0}
                        onChange={() => selectAll()}
                        className="rounded"
                      />
                    </th>
                    <th className="p-3 text-left text-xs font-medium">Member</th>
                    <th className="p-3 text-left text-xs font-medium">Group</th>
                    <th className="p-3 text-left text-xs font-medium">Check In</th>
                    <th className="p-3 text-left text-xs font-medium">Check Out</th>
                    <th className="p-3 text-left text-xs font-medium">Break In</th>
                    <th className="p-3 text-left text-xs font-medium">Break Out</th>
                    <th className="p-3 text-left text-xs font-medium">Work Hours</th>
                    <th className="p-3 text-left text-xs font-medium">Status</th>
                    {SHOW_LOCATION && <th className="p-3 text-left text-xs font-medium">Location</th>}
                    <th className="p-3 text-left text-xs font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&>tr:nth-child(even)]:bg-muted/50">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={`skel-${i}`} className="border-b">
                        <td className="p-3"><Skeleton className="h-3 w-3 rounded" /></td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-2">
                              <Skeleton className="h-3 w-40" />
                              <Skeleton className="h-2.5 w-24" />
                            </div>
                          </div>
                        </td>
                        <td className="p-3"><Skeleton className="h-3 w-24" /></td>
                        <td className="p-3"><Skeleton className="h-3 w-16" /></td>
                        <td className="p-3"><Skeleton className="h-3 w-16" /></td>
                        <td className="p-3"><Skeleton className="h-3 w-20" /></td>
                        <td className="p-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                        <td className="p-3"><Skeleton className="h-3 w-24" /></td>
                        <td className="p-3"><Skeleton className="h-3 w-24" /></td>
                        {SHOW_LOCATION && <td className="p-3"><Skeleton className="h-3 w-28" /></td>}
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-8 w-8 rounded" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : data.items.length === 0 ? (
                    <tr>
                      <td colSpan={SHOW_LOCATION ? 11 : 10} className="text-center py-6 text-muted-foreground text-sm">
                        No attendance records found
                      </td>
                    </tr>
                  ) : (
                    visibleRows
                  )}
                </tbody>
              </table>
            </div>

        {/* Pagination */}
        {!loading && data.total > queryParams.limit && (
          <PaginationFooter
            page={queryParams.page}
            totalPages={Math.ceil(data.total / queryParams.limit)}
            onPageChange={(p) => updateQueryParams({ page: Math.max(1, p) })}
            isLoading={loading}
            from={(queryParams.page - 1) * queryParams.limit + 1}
            to={Math.min(queryParams.page * queryParams.limit, data.total)}
            total={data.total}
            pageSize={queryParams.limit}
            onPageSizeChange={(size) => updateQueryParams({ limit: size, page: 1 })}
            pageSizeOptions={[10, 20, 50]}
          />
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmState?.mode === "bulk" ? "Delete selected records" : "Delete attendance record"}
        description={
          confirmState?.mode === "bulk"
            ? `This will delete ${selectedIds.size} selected record(s). This action cannot be undone.`
            : "This will delete the selected attendance record. This action cannot be undone."
        }
        confirmText="Delete"
        destructive
        loadingText="Deleting..."
        onConfirm={async () => {
          if (!confirmState) return
          try {
            setIsSubmitting(true)
            if (confirmState.mode === "bulk") {
              const ids = Array.from(selectedIds)
              const res = await deleteMultipleAttendanceRecords(ids)
              if (res.success) {
                // Optimistically remove from UI immediately
                setData(prev => ({
                  items: prev.items.filter(r => !ids.includes(r.id)),
                  total: Math.max(0, prev.total - ids.length)
                }))
                setSelectedIds(new Set())
                toast.success("Selected records deleted")
                fetchDataRef.current()
              } else {
                toast.error(res.message || "Failed to delete selected records")
              }
            } else if (confirmState.mode === "single" && confirmState.id) {
              const deletedId = confirmState.id
              const res = await deleteAttendanceRecord(deletedId)
              if (res?.success) {
                // Optimistically remove from UI immediately
                setData(prev => ({
                  items: prev.items.filter(r => r.id !== deletedId),
                  total: Math.max(0, prev.total - 1)
                }))
                toast.success("Record deleted")
                fetchDataRef.current()
              } else {
                toast.error(res.message || "Failed to delete record")
              }
            }
          } catch (e) {
            toast.error("Delete operation failed")
          } finally {
            setIsSubmitting(false)
            setConfirmState(null)
          }
        }}
      />

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => !isSubmitting && setEditOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit attendance record</DialogTitle>
            <DialogDescription>
              Perbarui waktu Check In/Out dan catatan. Biarkan kosong untuk menghapus nilai.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Check In (ISO)</label>
              <Input
                value={editIn}
                onChange={(e) => setEditIn(e.target.value)}
                placeholder="contoh: 2026-01-15T08:30:00+07:00"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Check Out (ISO)</label>
              <Input
                value={editOut}
                onChange={(e) => setEditOut(e.target.value)}
                placeholder="contoh: 2026-01-15T17:00:00+07:00"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Remarks</label>
              <Input
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                placeholder="Catatan (opsional)"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={submitEdit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ModernAttendanceListCloned
