"use client"

// src/app/attendance/add/page.tsx (atau sesuai path Anda)

import { useCallback, useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SingleForm } from "@/components/attendance/add/single-form"
import { BatchForm } from "@/components/attendance/add/batch-form"
import { MemberDialog } from "@/components/attendance/add/dialogs/member-dialog"
import {
  singleFormSchema,
  type SingleFormValues,
} from "@/types/attendance"
import { useRouter } from "next/navigation"
import { useMembers } from "@/hooks/attendance/add/use-members"
import { useBatchAttendance } from "@/hooks/attendance/add/use-batch-attendance"
import { createManualAttendance } from "@/action/attendance"
import { toast } from "sonner"

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
  const router = useRouter()

  // ✅ Form tetap dipakai — MemberDialog masih set via form.setValue
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

  // ✅ State lokal untuk diteruskan ke SingleForm
  // Ini adalah "jembatan" antara MemberDialog (yang set form)
  // dan SingleForm baru (yang tidak pakai form)
  const [selectedMemberId, setSelectedMemberId] = useState<string>("")

  // ✅ Sync: setiap kali form.memberId berubah (diset oleh MemberDialog),
  // update selectedMemberId agar SingleForm ikut ter-update
  const watchedMemberId = singleForm.watch("memberId")
  useEffect(() => {
    if (watchedMemberId && watchedMemberId !== selectedMemberId) {
      setSelectedMemberId(watchedMemberId)
    }
  }, [watchedMemberId, selectedMemberId])

  const { members, departments, loading: membersLoading } = useMembers()
  const batch = useBatchAttendance()

  // Legacy submit — tidak dipakai di SingleForm baru tapi dibiarkan
  // agar tidak break jika ada komponen lain yang masih pakai
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
    <div className="">
      <div className="flex items-center justify-between">
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
          // ✅ Prop baru: member yang dipilih dari MemberDialog
          // diteruskan ke SingleForm via state yang di-sync dari form
          selectedMemberId={selectedMemberId}
          onMemberSelect={setSelectedMemberId}
        />

        <BatchForm
          onSubmit={async () => { await batch.submitBatch() }}
          onCancel={() => router.back()}
          batch={batch}
        />
      </Tabs>

      {/* MemberDialog tidak perlu diubah — tetap set via form.setValue */}
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