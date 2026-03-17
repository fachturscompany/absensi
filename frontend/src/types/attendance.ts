import { z } from "zod"

export const singleFormSchema = z.object({

  memberId: z.string().min(1, "Member is required"),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkInTime: z.string().min(1, "Check-in time is required"),
  checkOutDate: z.string().optional(),
  checkOutTime: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  remarks: z.string().max(500).optional(),
  breakStartTime: z.string().optional(),
  breakEndTime: z.string().optional(),
})

export type SingleFormValues = z.infer<typeof singleFormSchema>

import { Control, UseFormHandleSubmit } from "react-hook-form"

export interface FormMethods {
  control: Control<SingleFormValues>
  handleSubmit: UseFormHandleSubmit<SingleFormValues>
  formState: {
    isSubmitting: boolean
  }
  setValue: (name: keyof SingleFormValues, value: SingleFormValues[keyof SingleFormValues]) => void
  clearErrors: (name: keyof SingleFormValues) => void
  trigger: (name: keyof SingleFormValues) => Promise<boolean>
}

export interface StatusOption {
  value: string
  label: string
  color: string
}

export const QUICK_STATUSES = [
  { value: "present", label: "Present", color: "bg-green-100 text-green-800" },
  { value: "absent", label: "Absent", color: "bg-red-100 text-red-800" },
  { value: "late", label: "Late", color: "bg-yellow-100 text-yellow-800" },
  { value: "excused", label: "Excused", color: "bg-blue-100 text-blue-800" },
] as const

export interface AttendanceEntry {
  organization_member_id: string
  attendance_date: string
  actual_check_in: string
  actual_check_out: string | null
  status: string
  remarks?: string
  check_in_method?: string
  check_out_method?: string
  actual_break_start?: string | null
  actual_break_end?: string | null
}

export interface MemberOption {
  id: string
  label: string
  department: string
}

export interface RawMember {
  id?: string | number
  user?: {
    first_name?: string
    last_name?: string
    display_name?: string
    email?: string
  }
  departments?: { name: string } | null | any[]
}

export interface BatchEntry {
  id: string
  memberId: string
  checkInDate: string
  checkInTime: string
  checkOutDate?: string
  checkOutTime?: string
  status: string
  remarks?: string
  breakStartTime?: string
  breakEndTime?: string
}

export interface BatchAttendanceReturn {
  batchEntries: BatchEntry[]
  setBatchEntries: (entries: BatchEntry[]) => void
  addBatchEntry: (memberId?: string) => void
  updateBatchEntry: (id: string, field: keyof BatchEntry, value: string) => void
  removeBatchEntry: (id: string) => void
  clearAllEntries: () => void
  getStatusCount: (status: string) => number
  batchCheckInDate: string
  setBatchCheckInDate: (date: string) => void
  batchCheckInTime: string
  setBatchCheckInTime: (time: string) => void
  batchCheckOutDate: string
  setBatchCheckOutDate: (date: string) => void
  batchCheckOutTime: string
  setBatchCheckOutTime: (time: string) => void
  batchStatus: string
  setBatchStatus: (status: string) => void
  batchRemarks: string
  setBatchRemarks: (remarks: string) => void
  batchBreakStartTime: string
  setBatchBreakStartTime: (time: string) => void
  batchBreakEndTime: string
  setBatchBreakEndTime: (time: string) => void
  isSubmitting: boolean
  setIsSubmitting: (submitting: boolean) => void
  departmentFilter: string
  setDepartmentFilter: (filter: string) => void
  memberDialogOpen: boolean
  setMemberDialogOpen: (open: boolean) => void
  activeBatchEntryId: string | null
  setActiveBatchEntryId: (id: string | null) => void
  memberSearch: string
  setMemberSearch: (search: string) => void
  submitBatch: () => Promise<{ success: boolean; message?: string; count?: number }>
}
