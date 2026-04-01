"use client"
import React, { useCallback, useEffect, useState, useMemo, useDeferredValue } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

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
  Search, RotateCcw, Plus, Download, Edit, Trash2,
} from "lucide-react"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { cn } from "@/lib/utils"
import { AttendanceTable } from "@/components/attendance/list/table"

function AttendanceListPage() {
  const orgStore = useOrgStore()
  const queryClient = useQueryClient()

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

  const [userTimezone, setUserTimezone] = useState("UTC")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set<string>())
  const [departments, setDepartments] = useState<string[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmState, setConfirmState] = useState<{ mode: "single" | "bulk"; id?: string } | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AttendanceListItem | null>(null)
  const [editIn, setEditIn] = useState("")
  const [editOut, setEditOut] = useState("")
  const [editRemarks, setEditRemarks] = useState("")

  const orgId = useMemo(() => queryParams.orgId || orgStore.organizationId, [queryParams.orgId, orgStore.organizationId])

  const queryKey = ['attendance', {
    orgId,
    page: queryParams.page,
    limit: queryParams.limit,
    dateFrom: queryParams.dateFrom,
    dateTo: queryParams.dateTo,
    status: queryParams.status,
    department: queryParams.department,
    search: deferredSearch?.trim() ?? "",
  }]

  const { data: queryData, isLoading: loading, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!orgId) return { items: [], total: 0 }

      const params = new URLSearchParams({
        page: queryParams.page.toString(),
        limit: queryParams.limit.toString(),
        dateFrom: queryParams.dateFrom,
        dateTo: queryParams.dateTo,
        organizationId: orgId.toString(),
        _cb: Date.now().toString(),
        ...(queryParams.status !== "all" && { status: queryParams.status }),
        ...(queryParams.department !== "all" && { department: queryParams.department }),
        ...(deferredSearch?.trim().length >= 2 && { search: deferredSearch.trim() })
      })

      const res = await fetch(`/api/attendance-records?${params}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      const result = await res.json() as GetAttendanceResult
      if (result.success) {
        return { items: result.data, total: result.meta?.total || result.data.length }
      }
      return { items: [], total: 0 }
    },
    enabled: !!orgId,
    staleTime: 5000,
  })

  const data = queryData || { items: [], total: 0 }

  useEffect(() => {
    if (data.items.length > 0) {
      const nextTz = data.items[0]?.timezone ?? "UTC"
      setUserTimezone(prev => prev === nextTz ? prev : nextTz)

      const uniqueDepts = Array.from(new Set(
        data.items.map(r => r.member?.department).filter((d): d is string => typeof d === 'string' && d !== "" && d !== "No Department")
      )).sort()

      setDepartments(prev => {
        const same = prev.length === uniqueDepts.length && prev.every((d, i) => d === uniqueDepts[i])
        return same ? prev : uniqueDepts
      })
    }
  }, [data.items])

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

const updateQueryParams = useCallback((updates: Partial<QueryParams>) => {
  setQueryParams(prev => {
    const next = { ...prev, ...updates };
    if (!updates.hasOwnProperty('page')) {
      next.page = 1;
    }
    
    return next;
  });
}, []);

  useEffect(() => {
    if (!orgId) return

    const supabase = createClient()
    const channel = supabase.channel('attendance_realtime_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['attendance'] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orgId, queryClient])

  useEffect(() => {
    setIsMounted(true)
  }, [])

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
  }, [data.items])

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
        queryClient.invalidateQueries({ queryKey: ['attendance'] })
      } else {
        toast.error(res.message || "Failed to update record")
      }
    } catch (e) {
      toast.error("Failed to update record")
    } finally {
      setIsSubmitting(false)
    }
  }

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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Attendance list</h1>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-2 flex-wrap">
          <div className="w-full md:flex-1 md:min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search..."
              value={queryParams.search}
              onChange={(e) => updateQueryParams({ search: e.target.value })}
              className="pl-10 bg-white w-full"
            />
          </div>

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

          <div className="flex w-full md:w-auto gap-2 shrink-0">
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

          <div className="flex w-full md:w-auto gap-2 shrink-0">
            <Button
              onClick={() => refetch()}
              title="Refresh"
              className="shrink-0 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90"
              disabled={isFetching}
            >
              <RotateCcw className={cn("w-4 h-4", isFetching && "animate-spin")} />
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

        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
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

      <div className="mt-4">
        <AttendanceTable
          items={data.items}
          loading={loading || !isMounted || !orgId}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          userTimezone={userTimezone}
          isMounted={isMounted}
          onEdit={(record) => {
            setEditTarget(record)
            setEditIn(record.checkIn ?? "")
            setEditOut(record.checkOut ?? "")
            setEditRemarks("")
            setEditOpen(true)
          }}
          onDelete={(id) => {
            setConfirmState({ mode: "single", id })
            setConfirmOpen(true)
          }}
        />

        {/* PAGINATION SECTION DIPERBARUI */}
        {!loading && (
          <div className="mt-4 border-t pt-4">
            <PaginationFooter
              page={queryParams.page}
              totalPages={Math.ceil(data.total / queryParams.limit) || 1}
              onPageChange={(p) => updateQueryParams({ page: p })} // Tidak perlu manual Math.max lagi
              isLoading={isFetching}
              // Agar tidak tampil "Showing 1-0 of 0" jika data kosong
              from={data.total === 0 ? 0 : (queryParams.page - 1) * queryParams.limit + 1}
              to={Math.min(queryParams.page * queryParams.limit, data.total)}
              total={data.total}
              pageSize={queryParams.limit}
              onPageSizeChange={(size) => updateQueryParams({ limit: size, page: 1 })}
              pageSizeOptions={[10, 20, 50]}
            />
          </div>
        )}
      </div>

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
                setSelectedIds(new Set())
                toast.success("Selected records deleted")
                queryClient.invalidateQueries({ queryKey: ['attendance'] })
              } else {
                toast.error(res.message || "Failed to delete records")
              }
            } else if (confirmState.mode === "single" && confirmState.id) {
              const res = await deleteAttendanceRecord(confirmState.id)
              if (res?.success) {
                toast.success("Record deleted")
                queryClient.invalidateQueries({ queryKey: ['attendance'] })
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

      <Dialog open={editOpen} onOpenChange={(open) => !isSubmitting && setEditOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit attendance record</DialogTitle>
            <DialogDescription>
              Perbarui waktu Check In/Out dan catatan. Biarkan kosong untuk menghapus nilai.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Check In (ISO)</label>
              <Input
                value={editIn}
                onChange={(e) => setEditIn(e.target.value)}
                placeholder="2026-01-15T08:30:00+07:00"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Check Out (ISO)</label>
              <Input
                value={editOut}
                onChange={(e) => setEditOut(e.target.value)}
                placeholder="2026-01-15T17:00:00+07:00"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Remarks</label>
              <Input
                value={editRemarks}
                onChange={(e) => setEditRemarks(e.target.value)}
                placeholder="Catatan..."
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

export default AttendanceListPage