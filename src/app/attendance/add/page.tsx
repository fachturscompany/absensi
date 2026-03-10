"use client"

import { useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SingleForm } from "@/components/attendance/add/single-form"
import { BatchForm } from "@/components/attendance/add/batch-form"
import { MemberDialog } from "@/components/attendance/add/dialogs/member-dialog"  // ✅ FIXED path
import {
  singleFormSchema,
  type SingleFormValues,
} from "@/types/attendance"
import { useRouter } from "next/navigation"
import { useMembers } from "@/hooks/attendance/use-members"
import { useBatchAttendance } from "@/hooks/attendance/use-batch-attendance"
import { createManualAttendance } from "@/action/attendance"
import { toast } from "sonner"

// REMOVE local DialogHandlers interface

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

export default function AttendancePage() {
  const router = useRouter()  // ✅ DECLARED!

  // ✅ SINGLE FORM - DECLARED PERTAMA!
  const singleForm = useForm<SingleFormValues>({
    resolver: zodResolver(singleFormSchema),
    defaultValues: {
      memberId: "",
      checkInDate: new Date().toISOString().split("T")[0],
      checkInTime: new Date().toTimeString().slice(0, 5),
      checkOutDate: "",
      checkOutTime: "",
      status: "present",
      remarks: ""
    }
  })

  // ✅ HOOKS - SINGLE SOURCE OF TRUTH
  const { members, departments, loading: membersLoading } = useMembers()
  const batch = useBatchAttendance()

  // ✅ SINGLE FORM SUBMIT
  const handleSingleSubmit = useCallback(async (values: SingleFormValues) => {
    try {
      const res = await createManualAttendance({
        organization_member_id: values.memberId,
        attendance_date: values.checkInDate,
        actual_check_in: parseDateTime(values.checkInDate, values.checkInTime).toISOString(),
        actual_check_out: values.checkOutDate && values.checkOutTime
          ? parseDateTime(values.checkOutDate, values.checkOutTime).toISOString()
          : null,
        status: values.status,
        remarks: values.remarks,
        check_in_method: "MANUAL",
        check_out_method: values.checkOutDate ? "MANUAL" : undefined,
        actual_break_start: values.breakStartTime && values.checkInDate
          ? parseDateTime(values.checkInDate, values.breakStartTime).toISOString()
          : null,
        actual_break_end: values.breakEndTime && values.checkInDate
          ? parseDateTime(values.checkInDate, values.breakEndTime).toISOString()
          : null,
      })

      if (res.success) {
        toast.success("Attendance record saved")
        singleForm.reset()
        router.push("/attendance")
      } else {
        toast.error(res.message || "Failed to save record")
      }
    } catch (error) {
      console.error("Submit error:", error)
      toast.error("An unexpected error occurred")
    }
  }, [singleForm, router])

  const loading = membersLoading || batch.isSubmitting


  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Add Attendance</h1>
      </div>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Entry</TabsTrigger>
          <TabsTrigger value="batch">Batch Entry</TabsTrigger>
        </TabsList>

        <SingleForm
          activeTab="single"
          form={singleForm}
          members={members}
          loading={loading}
          singleCheckInDate={singleForm.watch("checkInDate")}
          onSubmit={handleSingleSubmit}
          dialogHandlers={batch}
        />

        <BatchForm
          onSubmit={async () => { await batch.submitBatch() }}
          onCancel={() => router.back()}
          batch={batch}
        />
      </Tabs>

      {/* ✅ MEMBER DIALOG */}
      <MemberDialog
        members={members}
        departments={departments}
        loading={loading}
        form={singleForm}
        batch={batch}
      />
    </div>
  )
}
