// hooks/attendance/use-batch-attendance.ts
"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { type BatchEntry } from "@/types/attendance"
import { bulkCreateAttendance } from "@/action/attendance"
import { toTimestampWithTimezone } from "@/lib/timezone"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

// Helper untuk parse date+time → Date object
const parseDateTime = (dateStr: string, timeStr: string): Date => {
  const [year, month, day] = dateStr.split("-")
  const [hour, minute] = timeStr.split(":")
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
    0
  )
}

export function useBatchAttendance() {
  const queryClient = useQueryClient()
  const router = useRouter()

  // Master batch states
  const [batchCheckInDate, setBatchCheckInDate] = useState("")
  const [batchCheckInTime, setBatchCheckInTime] = useState("08:00")
  const [batchCheckOutDate, setBatchCheckOutDate] = useState("")
  const [batchCheckOutTime, setBatchCheckOutTime] = useState("")
  const [batchStatus, setBatchStatus] = useState<"present" | "late" | "absent" | "excused">("present")
  const [batchRemarks, setBatchRemarks] = useState("")
  const [batchBreakStartTime, setBatchBreakStartTime] = useState("")
  const [batchBreakEndTime, setBatchBreakEndTime] = useState("")

  // Batch entries management
  const [batchEntries, setBatchEntries] = useState<BatchEntry[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // UI states
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [memberDialogOpen, setMemberDialogOpen] = useState(false)
  const [activeBatchEntryId, setActiveBatchEntryId] = useState<string | null>(null)
  const [memberSearch, setMemberSearch] = useState("")

  // Initialize dates to today
  useEffect(() => {
    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const time = now.toTimeString().slice(0, 5)
    setBatchCheckInDate(date)
    setBatchCheckInTime(time)
    setBatchCheckOutDate(date)
  }, [])

  // Sync checkout date with checkin date
  useEffect(() => {
    setBatchCheckOutDate(batchCheckInDate)
  }, [batchCheckInDate])

  // ✅ VALIDATION: Check entries before submit
  const validateBatchEntries = useCallback((entries: BatchEntry[]): string[] => {
    const errors: string[] = []

    // 1. Check required fields
    entries.forEach((entry, i) => {
      if (!entry.memberId) {
        errors.push(`Entry ${i + 1}: Member is required`)
      }
      if (!entry.checkInDate || !entry.checkInTime) {
        errors.push(`Entry ${i + 1}: Check-in date/time is required`)
      }
    })

    // 2. Check time logic (checkout > checkin)
    entries.forEach((entry, i) => {
      if (entry.checkOutDate && entry.checkOutTime) {
        const checkInDT = parseDateTime(entry.checkInDate, entry.checkInTime)
        const checkOutDT = parseDateTime(entry.checkOutDate, entry.checkOutTime)
        if (checkOutDT <= checkInDT) {
          errors.push(`Entry ${i + 1}: Check-out must be after check-in`)
        }
      }
    })

    // 3. Check duplicates (member + date)
    const seen = new Set<string>()
    entries.forEach(entry => {
      const key = `${entry.memberId}-${entry.checkInDate}`
      if (seen.has(key)) {
        errors.push(`Duplicate entry: ${entry.memberId} on ${entry.checkInDate}`)
      }
      seen.add(key)
    })

    return errors
  }, [])

  // ✅ CORE: Add new batch entry
  const addBatchEntry = useCallback((memberId?: string) => {
    if (!batchCheckInDate) {
      toast.error("Please set check-in date first")
      return
    }

    const newEntry: BatchEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      memberId: memberId || "",
      checkInDate: batchCheckInDate,
      checkInTime: batchCheckInTime,
      checkOutDate: batchCheckOutDate,
      checkOutTime: batchCheckOutTime,
      status: batchStatus,
      remarks: batchRemarks,
      breakStartTime: batchBreakStartTime,
      breakEndTime: batchBreakEndTime,
    }
    setBatchEntries(prev => [...prev, newEntry])
    toast.success("Entry added")
  }, [batchCheckInDate, batchCheckInTime, batchCheckOutDate, batchCheckOutTime, batchStatus, batchRemarks])

  // ✅ CORE: Update specific entry field
  const updateBatchEntry = useCallback((id: string, field: keyof BatchEntry, value: string) => {
    setBatchEntries(prev => prev.map(entry =>
      entry.id === id
        ? { ...entry, [field]: value }
        : entry
    ))
  }, [])

  // ✅ CORE: Remove entry
  const removeBatchEntry = useCallback((id: string) => {
    setBatchEntries(prev => {
      const newEntries = prev.filter(e => e.id !== id)
      toast.success(`${newEntries.length} entries remaining`)
      return newEntries
    })
  }, [])

  // ✅ CORE: SUBMIT BATCH - Full monolith logic ported
  const submitBatch = useCallback(async (): Promise<{ success: boolean; message?: string; count?: number }> => {
    if (batchEntries.length === 0) {
      toast.error("Please add at least one entry")
      return { success: false, message: "No entries" }
    }

    const errors = validateBatchEntries(batchEntries)
    if (errors.length > 0) {
      toast.error(errors[0]) // Show first error
      return { success: false, message: errors[0] }
    }

    setIsSubmitting(true)
    try {
      // Transform to server payload (SAME as monolith)
      const payload = batchEntries.map(entry => ({
        organization_member_id: entry.memberId! as string,
        attendance_date: entry.checkInDate!,
        actual_check_in: toTimestampWithTimezone(parseDateTime(entry.checkInDate!, entry.checkInTime!)),
        actual_check_out: entry.checkOutDate && entry.checkOutTime
          ? toTimestampWithTimezone(parseDateTime(entry.checkOutDate, entry.checkOutTime))
          : null,
        status: (entry.status || batchStatus) as any,
        remarks: (entry.remarks || batchRemarks || undefined) as string | undefined,
        check_in_method: "MANUAL" as const,
        check_out_method: entry.checkOutDate && entry.checkOutTime ? "MANUAL" as const : undefined,
        actual_break_start: entry.breakStartTime && entry.checkInDate
          ? toTimestampWithTimezone(parseDateTime(entry.checkInDate, entry.breakStartTime))
          : null,
        actual_break_end: entry.breakEndTime && entry.checkInDate
          ? toTimestampWithTimezone(parseDateTime(entry.checkInDate, entry.breakEndTime))
          : null,
      }))

      const res = await bulkCreateAttendance(payload)

      if (res.success) {
        // Invalidate ALL related queries (dashboard, members, etc)
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
          queryClient.invalidateQueries({ queryKey: ['members'] }),
          queryClient.invalidateQueries({ queryKey: ['attendance'] })
        ])

        toast.success(`${res.count || batchEntries.length} records saved! ⚡`)
        router.push("/attendance/list")
        // Reset form
        setBatchEntries([])
        return { success: true, count: batchEntries.length }
      } else {
        toast.error(res.message || "Failed to save batch")
        return { success: false, message: res.message }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network error"
      toast.error(`Batch submit failed: ${message}`)
      return { success: false, message }
    } finally {
      setIsSubmitting(false)
    }
  }, [batchEntries, batchStatus, batchRemarks, queryClient, router])

  // ✅ UTILITY: Clear all entries
  const clearAllEntries = useCallback(() => {
    setBatchEntries([])
  }, [])

  // ✅ UTILITY: Get entry count by status
  const getStatusCount = useCallback((status: string) => {
    return batchEntries.filter(e => e.status === status).length
  }, [batchEntries])

  return {
    batchEntries,
    setBatchEntries: (entries: BatchEntry[]) => setBatchEntries(entries),
    addBatchEntry,
    updateBatchEntry,
    removeBatchEntry,
    clearAllEntries,
    getStatusCount,

    // Master form states
    batchCheckInDate, setBatchCheckInDate,
    batchCheckInTime, setBatchCheckInTime,
    batchCheckOutDate, setBatchCheckOutDate,
    batchCheckOutTime, setBatchCheckOutTime,
    batchStatus,
    setBatchStatus: (status: string) => setBatchStatus(status as any),
    batchRemarks, setBatchRemarks,
    batchBreakStartTime, setBatchBreakStartTime,
    batchBreakEndTime, setBatchBreakEndTime,

    // Submit
    submitBatch,
    isSubmitting,
    setIsSubmitting: (submitting: boolean) => setIsSubmitting(submitting),

    // UI states
    departmentFilter, setDepartmentFilter,
    memberDialogOpen, setMemberDialogOpen,
    activeBatchEntryId, setActiveBatchEntryId,
    memberSearch, setMemberSearch,
  }
}
