"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezonePlugin from "dayjs/plugin/timezone"
import {
  getMemberSchedule,
  checkExistingAttendance,
  bulkCreateAttendance,
} from "@/action/attendance"

import type { MemberOption } from "@/types/attendance"

dayjs.extend(utc)
dayjs.extend(timezonePlugin)

// ----------------------------------------------------------
// Types
// ----------------------------------------------------------
export type BatchMode = "realtime" | "retroactive"

export type MemberScheduleStatus = "loading" | "ok" | "no_schedule" | "holiday" | "duplicate"

export interface BatchMemberRow {
  memberId: string
  label: string
  department: string
  avatar?: string | null
  userId?: string | null
  // Schedule
  scheduleStatus: MemberScheduleStatus
  scheduleName?: string
  startTime?: string   // HH:mm:ss
  endTime?: string
  breakStart?: string | null
  breakEnd?: string | null
  // Attendance
  isDuplicate: boolean
  // Override (retroactive mode)
  overrideCheckIn?: string   // HH:mm
  overrideCheckOut?: string
  overrideBreakIn?: string
  overrideBreakOut?: string
  // Computed
  computedStatus: "present" | "late" | "absent"
  isSelected: boolean
  // Warning tapi masih bisa disimpan
  hasWarning: boolean
  warningMessage?: string
}

export interface BatchPreviewItem {
  memberId: string
  label: string
  department: string
  checkIn: string       // ISO
  checkOut: string | null
  breakStart: string | null
  breakEnd: string | null
  status: "present" | "late" | "absent"
  isDuplicate: boolean
  hasWarning: boolean
  warningMessage?: string
  include: boolean      // admin bisa uncheck di preview
}

export interface BatchSubmitResult {
  success: boolean
  saved: number
  skipped: number
  errors: string[]
}

// ----------------------------------------------------------
// Hook
// ----------------------------------------------------------
export function useBatchAttendanceV2(
  members: MemberOption[],
  timezone: string,
) {
  const queryClient = useQueryClient()
  const router = useRouter()

  const [mode, setMode] = useState<BatchMode>("realtime")
  const [date, setDate] = useState(() => dayjs().tz(timezone).format("YYYY-MM-DD"))
  const [rows, setRows] = useState<BatchMemberRow[]>([])
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewItems, setPreviewItems] = useState<BatchPreviewItem[]>([])
  const [showPreview, setShowPreview] = useState(false)

  // Search + filter state
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("all")

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------
  const toISO = useCallback(
    (dateStr: string, timeStr: string): string => {
      return dayjs.tz(`${dateStr} ${timeStr}`, timezone).toISOString()
    },
    [timezone],
  )

  const computeStatus = useCallback(
    (
      checkInTime: string,   // HH:mm:ss
      scheduleStartTime: string,
    ): "present" | "late" => {
      const ciMinutes =
        parseInt(checkInTime.split(":")[0] ?? "0") * 60 +
        parseInt(checkInTime.split(":")[1] ?? "0")
      const schedMinutes =
        parseInt(scheduleStartTime.split(":")[0] ?? "0") * 60 +
        parseInt(scheduleStartTime.split(":")[1] ?? "0")
      return ciMinutes > schedMinutes ? "late" : "present"
    },
    [],
  )

  // ----------------------------------------------------------
  // Load schedules + duplicate check untuk semua rows
  // ----------------------------------------------------------
  const loadSchedulesForRows = useCallback(
    async (targetRows: BatchMemberRow[], targetDate: string) => {
      if (targetRows.length === 0) return

      setIsLoadingSchedules(true)

      const updated = await Promise.all(
        targetRows.map(async (row) => {
          const schedRes = await getMemberSchedule(row.memberId, targetDate)
          const dupRes = await checkExistingAttendance(row.memberId, targetDate)
          const isDuplicate = dupRes.exists === true

          if (!schedRes.success || !schedRes.data) {
            return {
              ...row,
              scheduleStatus: "no_schedule" as MemberScheduleStatus,
              isDuplicate,
              computedStatus: "absent" as const,
              hasWarning: true,
              warningMessage: schedRes.message || "No schedule assigned",
            }
          }

          const rule = schedRes.data as any
          if (!rule.start_time) {
            return {
              ...row,
              scheduleStatus: "holiday" as MemberScheduleStatus,
              isDuplicate,
              computedStatus: "absent" as const,
              hasWarning: true,
              warningMessage: "Non-working day",
            }
          }

          const ciTime = row.overrideCheckIn
            ? `${row.overrideCheckIn}:00`
            : mode === "realtime"
              ? dayjs().tz(timezone).format("HH:mm:ss")
              : rule.start_time

          const status = computeStatus(ciTime, rule.start_time)

          return {
            ...row,
            scheduleStatus: "ok" as MemberScheduleStatus,
            scheduleName: rule.name || rule.schedule_name || rule.title,
            startTime: rule.start_time,
            endTime: rule.end_time,
            breakStart: rule.break_start ?? null,
            breakEnd: rule.break_end ?? null,
            isDuplicate,
            computedStatus: status,
            hasWarning: isDuplicate,
            warningMessage: isDuplicate ? "Already has attendance record" : undefined,
          }
        }),
      )

      setRows((prev) => {
        const updatedMap = new Map(updated.map((r) => [r.memberId, r]))
        return prev.map((row) => updatedMap.get(row.memberId) || row)
      })

      setIsLoadingSchedules(false)
    },
    [mode, timezone, computeStatus],
  )

  useEffect(() => {
    if (rows.length > 0) {
      loadSchedulesForRows(rows, date)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  useEffect(() => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.scheduleStatus !== "ok" || !row.startTime) return row
        const ciTime =
          mode === "realtime"
            ? dayjs().tz(timezone).format("HH:mm:ss")
            : row.overrideCheckIn
              ? `${row.overrideCheckIn}:00`
              : row.startTime
        return {
          ...row,
          computedStatus: computeStatus(ciTime, row.startTime),
        }
      }),
    )
  }, [mode, timezone, computeStatus])

  const addMembers = useCallback(
    async (memberIds: string[]) => {
      const newIds = memberIds.filter(
        (id) => !rows.some((r) => r.memberId === id),
      )
      if (newIds.length === 0) return

      const newRows: BatchMemberRow[] = newIds.map((id) => {
        const member = members.find((m) => m.id === id)
        return {
          memberId: id,
          label: member?.label ?? id,
          department: member?.department ?? "",
          avatar: member?.avatar,
          userId: member?.userId,
          scheduleStatus: "loading",
          isDuplicate: false,
          computedStatus: "present",
          isSelected: true,
          hasWarning: false,
        }
      })

      setRows((prev) => [...prev, ...newRows])
      await loadSchedulesForRows(newRows, date)
    },
    [rows, members, date, loadSchedulesForRows],
  )

  const removeMember = useCallback((memberId: string) => {
    setRows((prev) => prev.filter((r) => r.memberId !== memberId))
  }, [])

  const toggleSelect = useCallback((memberId: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.memberId === memberId ? { ...r, isSelected: !r.isSelected } : r,
      ),
    )
  }, [])

  const toggleSelectAll = useCallback(
    (filtered: BatchMemberRow[]) => {
      const filteredIds = new Set(filtered.map((r) => r.memberId))
      const allSelected = filtered.every((r) => r.isSelected)
      setRows((prev) =>
        prev.map((r) =>
          filteredIds.has(r.memberId) ? { ...r, isSelected: !allSelected } : r,
        ),
      )
    },
    [],
  )

  const updateOverride = useCallback(
    (
      memberId: string,
      field: "overrideCheckIn" | "overrideCheckOut" | "overrideBreakIn" | "overrideBreakOut",
      value: string,
    ) => {
      setRows((prev) =>
        prev.map((r) => {
          if (r.memberId !== memberId) return r
          const updated = { ...r, [field]: value }
          if (field === "overrideCheckIn" && r.startTime) {
            updated.computedStatus = computeStatus(
              `${value}:00`,
              r.startTime,
            )
          }
          return updated
        }),
      )
    },
    [computeStatus],
  )

  const filteredRows = rows.filter((r) => {
    const matchSearch =
      !search ||
      r.label.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter === "all" || r.department === deptFilter
    return matchSearch && matchDept
  })

  const groupedRows = filteredRows.reduce<
    Record<string, { label: string; rows: BatchMemberRow[] }>
  >((acc, row) => {
    let key: string
    let label: string
    if (row.scheduleStatus === "no_schedule") {
      key = "__no_schedule__"
      label = "No Schedule Assigned"
    } else if (row.scheduleStatus === "holiday") {
      key = "__holiday__"
      label = "Non-Working Day"
    } else if (row.scheduleStatus === "loading") {
      key = "__loading__"
      label = "Loading..."
    } else {
      key = `${row.startTime ?? "?"}-${row.endTime ?? "?"}`
      label = `${(row.startTime ?? "").slice(0, 5)} – ${(row.endTime ?? "").slice(0, 5)}`
    }
    if (!acc[key]) acc[key] = { label, rows: [] }
    acc[key]!.rows.push(row)
    return acc
  }, {})

  const buildPreview = useCallback(() => {
    const now = dayjs().tz(timezone).toISOString()

    const items: BatchPreviewItem[] = rows
      .filter((r) => r.isSelected && !r.isDuplicate)
      .map((row) => {
        let checkIn: string
        let checkOut: string | null = null
        let breakStart: string | null = null
        let breakEnd: string | null = null

        if (mode === "realtime") {
          checkIn = now
        } else {
          checkIn = toISO(date, row.overrideCheckIn ?? (row.startTime ?? "07:00").slice(0, 5))
          checkOut = row.overrideCheckOut || row.endTime
            ? toISO(date, row.overrideCheckOut ?? (row.endTime ?? "17:00").slice(0, 5))
            : null
          breakStart = row.overrideBreakIn || row.breakStart
            ? toISO(date, row.overrideBreakIn ?? (row.breakStart ?? "").slice(0, 5))
            : null
          breakEnd = row.overrideBreakOut || row.breakEnd
            ? toISO(date, row.overrideBreakOut ?? (row.breakEnd ?? "").slice(0, 5))
            : null
        }

        return {
          memberId: row.memberId,
          label: row.label,
          department: row.department,
          checkIn,
          checkOut,
          breakStart,
          breakEnd,
          status: row.computedStatus,
          isDuplicate: row.isDuplicate,
          hasWarning: row.hasWarning && !row.isDuplicate,
          warningMessage: row.warningMessage,
          include: true,
        }
      })

    setPreviewItems(items)
    setShowPreview(true)
  }, [rows, mode, date, timezone, toISO])

  const togglePreviewItem = useCallback((memberId: string) => {
    setPreviewItems((prev) =>
      prev.map((item) =>
        item.memberId === memberId
          ? { ...item, include: !item.include }
          : item,
      ),
    )
  }, [])

  const updatePreviewStatus = useCallback(
    (memberId: string, status: "present" | "late" | "absent") => {
      setPreviewItems((prev) =>
        prev.map((item) =>
          item.memberId === memberId ? { ...item, status } : item,
        ),
      )
    },
    [],
  )

  const submitBatch = useCallback(async (): Promise<BatchSubmitResult> => {
    const toSubmit = previewItems.filter((item) => item.include)
    if (toSubmit.length === 0) {
      toast.error("No records to submit")
      return { success: false, saved: 0, skipped: 0, errors: [] }
    }

    setIsSubmitting(true)
    try {
      const payload = toSubmit.map((item) => ({
        organization_member_id: item.memberId,
        attendance_date: date,
        actual_check_in: item.checkIn,
        actual_check_out: item.checkOut ?? null,
        actual_break_start: item.breakStart ?? null,
        actual_break_end: item.breakEnd ?? null,
        status: item.status,
        check_in_method: "MANUAL" as const,
        check_out_method: item.checkOut ? ("MANUAL" as const) : undefined,
      }))

      const res = await bulkCreateAttendance(payload as any)

      if (res.success) {
        const skipped = previewItems.filter((i) => !i.include).length

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["attendance"] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        ])

        toast.success(`${res.count ?? toSubmit.length} records saved!`)
        router.push("/attendance")

        return {
          success: true,
          saved: res.count ?? toSubmit.length,
          skipped,
          errors: [],
        }
      } else {
        toast.error(res.message || "Failed to save batch")
        return {
          success: false,
          saved: 0,
          skipped: 0,
          errors: [res.message ?? "Unknown error"],
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error"
      toast.error(msg)
      return { success: false, saved: 0, skipped: 0, errors: [msg] }
    } finally {
      setIsSubmitting(false)
      setShowPreview(false)
    }
  }, [previewItems, date, queryClient, router])

  const stats = {
    total: rows.length,
    selected: rows.filter((r) => r.isSelected && !r.isDuplicate).length,
    duplicates: rows.filter((r) => r.isDuplicate).length,
    noSchedule: rows.filter(
      (r) => r.scheduleStatus === "no_schedule" || r.scheduleStatus === "holiday",
    ).length,
    warnings: rows.filter((r) => r.hasWarning && !r.isDuplicate).length,
  }

  return {
    mode, setMode,
    date, setDate,
    rows,
    filteredRows,
    groupedRows,
    isLoadingSchedules,
    isSubmitting,
    search, setSearch,
    deptFilter, setDeptFilter,
    stats,
    showPreview, setShowPreview,
    previewItems,
    buildPreview,
    togglePreviewItem,
    updatePreviewStatus,
    addMembers,
    removeMember,
    toggleSelect,
    toggleSelectAll,
    updateOverride,
    submitBatch,
  }
}