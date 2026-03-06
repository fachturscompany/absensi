"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, X, Search, Plus, Minus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"

import { createManualAttendance, checkExistingAttendance } from "@/action/attendance"
import { getAllOrganization_member } from "@/action/members"
// groups in UI = departments in backend; we derive names from member.departments
import { useOrgStore } from "@/store/org-store"
import { toTimestampWithTimezone } from "@/lib/timezone"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

type AttendanceEntry = {
  organization_member_id: string
  attendance_date: string
  actual_check_in: string
  actual_check_out: string | null
  status: string
  remarks?: string
  check_in_method?: string
  check_out_method?: string
}

type MemberOption = {
  id: string
  label: string
  department: string
}

type BatchEntry = {
  id: string
  memberId: string
  checkInDate: string
  checkInTime: string
  checkOutDate?: string
  checkOutTime?: string
  status: string
  remarks?: string
}

const singleFormSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkInTime: z.string().min(1, "Check-in time is required"),
  checkOutDate: z.string().optional(),
  checkOutTime: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  remarks: z.string().max(500).optional(),
})

type SingleFormValues = z.infer<typeof singleFormSchema>

export function AttendanceFormBatch() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const orgStore = useOrgStore()
  const [members, setMembers] = useState<MemberOption[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("single")
  const [batchEntries, setBatchEntries] = useState<BatchEntry[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [departments, setDepartments] = useState<string[]>([])
  const [memberDialogOpen, setMemberDialogOpen] = useState(false)
  const [activeBatchEntryId, setActiveBatchEntryId] = useState<string | null>(null)
  const [memberSearch, setMemberSearch] = useState("")
  // Master date/time for Batch mode (applies to all selected members)
  const [batchCheckInDate, setBatchCheckInDate] = useState<string>("")
  const [batchCheckInTime, setBatchCheckInTime] = useState<string>("08:00")
  const [batchCheckOutDate, setBatchCheckOutDate] = useState<string>("")
  const [batchCheckOutTime, setBatchCheckOutTime] = useState<string>("")
  // Master status & notes for Batch mode
  const [batchStatus] = useState<string>("present")
  const [batchRemarks, setBatchRemarks] = useState<string>("")

  const form = useForm<SingleFormValues>({
    resolver: zodResolver(singleFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      memberId: "",
      checkInDate: "",
      checkInTime: "",
      checkOutDate: "",
      checkOutTime: "",
      status: "present",
      remarks: "",
    },
  })

  const singleCheckInDate = form.watch('checkInDate')
  useEffect(() => {
    form.setValue('checkOutDate', singleCheckInDate || '')
  }, [singleCheckInDate])

  // Initialize current date and time on client side only
  useEffect(() => {
    const now = new Date();
    const date = format(now, 'yyyy-MM-dd');
    const time = format(now, 'HH:mm');
    form.reset({
      memberId: "",
      checkInDate: date,
      checkInTime: time,
      checkOutDate: date,
      checkOutTime: time,
      status: "present",
      remarks: "",
    });
  }, [])

  useEffect(() => {
    const now = new Date();
    const date = format(now, 'yyyy-MM-dd');
    const time = format(now, 'HH:mm');
    setBatchCheckInDate(date)
    setBatchCheckInTime(time)
    setBatchCheckOutDate(date)
    setBatchCheckOutTime("")
  }, [])

  useEffect(() => {
    setBatchCheckOutDate(batchCheckInDate)
  }, [batchCheckInDate])

  // Keep all batch entries in sync with master date/time
  useEffect(() => {
    setBatchEntries(prev => prev.map(e => ({
      ...e,
      checkInDate: batchCheckInDate || e.checkInDate,
      checkInTime: batchCheckInTime || e.checkInTime,
      checkOutDate: batchCheckInDate || "",
      checkOutTime: batchCheckOutTime || "",
    })))
  }, [batchCheckInDate, batchCheckInTime, batchCheckOutDate, batchCheckOutTime])

  // Keep all batch entries in sync with master status & notes
  useEffect(() => {
    setBatchEntries(prev => prev.map(e => ({
      ...e,
      status: batchStatus || e.status,
      remarks: batchRemarks,
    })))
  }, [batchStatus, batchRemarks])

  // Load members and derive groups(departments) on mount and when org changes
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true)

        // Fetch members and departments with proper organization scoping
        const rawOrgId = orgStore.organizationId
        let safeOrgId: number | undefined = undefined
        if (typeof rawOrgId === 'number' && Number.isFinite(rawOrgId)) {
          safeOrgId = rawOrgId
        } else if (typeof rawOrgId === 'string') {
          const parsed = Number(rawOrgId)
          if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
            safeOrgId = parsed
          }
        }

        // When safeOrgId undefined, server action will fallback to user's organization
        const membersRes = await getAllOrganization_member(safeOrgId)

        // Check if members fetch succeeded
        if (!membersRes.success) {
          const errorMessage = membersRes.message || "Failed to load members"
          console.error("Failed to load members:", errorMessage)
          toast.error(errorMessage)
          // Still set empty arrays to prevent UI issues
          setMembers([])
          return
        }

        // Ensure we have valid data
        const membersData = Array.isArray(membersRes.data) ? membersRes.data : []

        if (membersData.length === 0) {
          setMembers([])
          return
        }

        // Normalize department structure for all members (departments = groups in UI)
        const normalizedMembers = membersData.map((member: any) => {
          // Handle departments that might be an array or object
          if (member.departments) {
            if (Array.isArray(member.departments) && member.departments.length > 0) {
              member.departments = member.departments[0]
            } else if (Array.isArray(member.departments) && member.departments.length === 0) {
              member.departments = null
            }
          }
          return member
        })

        // Build member options similar to attendance-form.tsx
        const options: MemberOption[] = normalizedMembers
          .filter((member: any) => {
            // valid if it has numeric id
            if (!member.id) return false
            const memberIdNum = Number(member.id)
            return !isNaN(memberIdNum) && memberIdNum > 0
          })
          .map((member: any) => {
            const user = member.user
            let resolvedLabel = "No Name"
            if (user) {
              const displayName = user.display_name?.trim()
              const concatenated = [user.first_name, user.last_name]
                .filter(Boolean)
                .join(" ")
              const fullName = concatenated.trim()
              resolvedLabel = displayName || fullName || user.email || "No Name"
            }
            return {
              id: String(Number(member.id)),
              label: resolvedLabel,
              department: member.departments?.name || member.groups?.name || "",
            } as MemberOption
          })

        // Derive departments (groups) from options
        const deptNames = Array.from(new Set(options.map((m) => m.department).filter(Boolean))).sort() as string[]
        setDepartments(deptNames)

        setMembers(options)
      } catch (error) {
        const message = error instanceof Error ? error.message : "An error occurred while loading data"
        console.error("Error loading members:", error)
        toast.error(message)
        // Set empty arrays to prevent UI issues
        setMembers([])
        setDepartments([])
      } finally {
        setLoading(false)
      }
    }

    // Always attempt load; server will fallback org when not provided
    loadMembers()
  }, [orgStore.organizationId])

  // Parse date and time to DateTime
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

  // Single Mode Submit
  const onSubmitSingle = async (values: SingleFormValues) => {
    try {
      const checkInDateTime = parseDateTime(values.checkInDate, values.checkInTime)
      const checkOutDateTime = values.checkOutDate && values.checkOutTime
        ? parseDateTime(values.checkOutDate, values.checkOutTime)
        : null

      // Validate: check-out must not be earlier than check-in
      if (checkOutDateTime && checkOutDateTime < checkInDateTime) {
        toast.error("Check-out cannot be earlier than check-in")
        return
      }

      const payload: AttendanceEntry = {
        organization_member_id: values.memberId,
        attendance_date: values.checkInDate,
        actual_check_in: toTimestampWithTimezone(checkInDateTime),
        actual_check_out: checkOutDateTime ? toTimestampWithTimezone(checkOutDateTime) : null,
        status: values.status,
        remarks: values.remarks?.trim() || undefined,
        check_in_method: "MANUAL",
        check_out_method: checkOutDateTime ? "MANUAL" : undefined,
      }

      const res = await createManualAttendance(payload)

      if (res.success) {
        // Invalidate all dashboard-related queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        toast.success("Attendance recorded successfully")
        router.push("/attendance/list")
      } else {
        toast.error(res.message || "Failed to save attendance")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred"
      toast.error(message)
    }
  }

  // Batch Mode: Add Entry
  const addBatchEntry = (memberId?: string) => {
    const newEntry: BatchEntry = {
      id: Date.now().toString(),
      memberId: memberId || "",
      checkInDate: batchCheckInDate || new Date().toISOString().slice(0, 10),
      checkInTime: batchCheckInTime || "08:00",
      checkOutDate: batchCheckOutDate || "",
      checkOutTime: batchCheckOutTime || "",
      status: batchStatus || "present",
      remarks: batchRemarks || "",
    }
    setBatchEntries([...batchEntries, newEntry])
  }

  // Batch Mode: Update Entry
  const updateBatchEntry = (id: string, field: string, value: string) => {
    setBatchEntries(
      batchEntries.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    )
  }

  // Batch Mode: Submit All
  const onSubmitBatch = async () => {
    if (batchEntries.length === 0) {
      toast.error("Please add at least one attendance record")
      return
    }

    // Validate all entries
    const invalidEntries: string[] = []
    const invalidTimeEntries: string[] = []
    for (const [i, entry] of batchEntries.entries()) {
      if (!entry.memberId || !entry.checkInDate || !entry.checkInTime) {
        const selectedMember = members.find((m) => m.id === entry.memberId)
        const memberName = selectedMember?.label || `Entry ${i + 1}`
        invalidEntries.push(memberName)
      }

      // Validate time ordering per entry when check-out provided
      const hasOut = Boolean(entry.checkOutDate && entry.checkOutTime)
      if (hasOut) {
        const inDT = parseDateTime(entry.checkInDate, entry.checkInTime)
        const outDT = parseDateTime(entry.checkOutDate!, entry.checkOutTime!)
        if (outDT < inDT) {
          const selectedMember = members.find((m) => m.id === entry.memberId)
          const memberName = selectedMember?.label || `Entry ${i + 1}`
          invalidTimeEntries.push(memberName)
        }
      }
    }

    if (invalidEntries.length > 0) {
      toast.error(`Incomplete entries: ${invalidEntries.slice(0, 3).join(", ")}${invalidEntries.length > 3 ? ` and ${invalidEntries.length - 3} more` : ""}`)
      return
    }

    if (invalidTimeEntries.length > 0) {
      toast.error(`Time is not valid: ${invalidTimeEntries.slice(0, 3).join(", ")}${invalidTimeEntries.length > 3 ? ` and ${invalidTimeEntries.length - 3} more` : ""}`)
      return
    }

    // Check for duplicates within batch itself
    const duplicateCheck = new Map<string, string[]>()
    for (const entry of batchEntries) {
      // use a safe delimiter that won't appear in IDs or date
      const key = `${entry.memberId}::${entry.checkInDate}`
      if (!duplicateCheck.has(key)) {
        duplicateCheck.set(key, [])
      }
      duplicateCheck.get(key)!.push(entry.memberId)
    }

    for (const [key, memberIds] of duplicateCheck.entries()) {
      if (memberIds.length > 1) {
        const [memberId, date] = key.split("::")
        const selectedMember = members.find((m) => m.id === memberId)
        const memberName = selectedMember?.label || `Member ${memberId}`
        toast.error(`${memberName} has duplicate entries for ${date}`)
        return
      }
    }

    try {
      setIsSubmitting(true)
      let successCount = 0
      let skipCount = 0
      const errors: string[] = []

      for (const entry of batchEntries) {
        const selectedMember = members.find((m) => m.id === entry.memberId)
        const memberName = selectedMember?.label || `Member ${entry.memberId}`

        // Validate member ID is a valid number
        const memberIdNum = Number(entry.memberId)
        if (isNaN(memberIdNum)) {
          skipCount++
          errors.push(`${memberName}: Invalid member ID format`)
          continue
        }

        // Check if attendance already exists for this member and date
        const checkRes = await checkExistingAttendance(String(memberIdNum), entry.checkInDate)

        // Only skip if check was successful AND exists is true
        if (checkRes.success && checkRes.exists) {
          skipCount++
          errors.push(`${memberName} already has attendance recorded for ${entry.checkInDate}`)
          continue
        } else if (!checkRes.success) {
          // Log warning but continue - we'll let the insert fail if duplicate
          console.warn(`Could not check existing attendance for ${memberName}:`, checkRes)
        }

        const checkInDateTime = parseDateTime(entry.checkInDate, entry.checkInTime)
        const checkOutDateTime = entry.checkOutDate && entry.checkOutTime
          ? parseDateTime(entry.checkOutDate, entry.checkOutTime)
          : null

        const payload: AttendanceEntry = {
          organization_member_id: entry.memberId,
          attendance_date: entry.checkInDate,
          actual_check_in: toTimestampWithTimezone(checkInDateTime),
          actual_check_out: checkOutDateTime ? toTimestampWithTimezone(checkOutDateTime) : null,
          status: entry.status,
          remarks: entry.remarks?.trim() || undefined,
          check_in_method: "MANUAL",
          check_out_method: checkOutDateTime ? "MANUAL" : undefined,
        }

        const res = await createManualAttendance(payload)
        if (res.success) {
          successCount++
        } else {
          skipCount++
          errors.push(`${memberName}: ${res.message}`)
        }
      }

      if (successCount === batchEntries.length) {
        // Invalidate dashboard cache to refresh data
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        toast.success(`${successCount} attendance records saved successfully`)
        router.push("/attendance/list")
      } else if (successCount > 0) {
        // Invalidate dashboard cache even for partial success
        await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        toast.success(`${successCount} records saved`)
        if (skipCount > 0) {
          toast.error(`${skipCount} records skipped (duplicates or errors)`)
          errors.forEach((err) => toast.info(err))
        }
        setTimeout(() => router.push("/attendance"), 2000)
      } else {
        toast.error("No records could be saved")
        errors.forEach((err) => toast.error(err))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Entry</TabsTrigger>
          <TabsTrigger value="batch">Batch Entry</TabsTrigger>
        </TabsList>

        {/* SINGLE MODE */}
        <TabsContent value="single" className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitSingle)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add Single Attendance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* Member Selection */}
                  <FormField
                    control={form.control}
                    name="memberId"
                    render={({ field }) => {
                      const selectedMember = members.find(m => m.id === field.value);

                      return (
                        <FormItem className="flex flex-col">
                          <FormControl>
                            {/* Hidden input to properly register the field with RHF and keep it a string */}
                            <input type="hidden" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormLabel>Select Member *</FormLabel>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={`w-full justify-between font-normal ${!field.value && "text-muted-foreground"}`}
                            disabled={loading}
                            onClick={() => {
                              setActiveBatchEntryId(null);
                              setMemberDialogOpen(true);
                            }}
                          >
                            {selectedMember ? `${selectedMember.label} (${selectedMember.department})` : "Choose a member..."}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />

                  {/* Check-in */}
                  <div className="space-y-3">
                    <FormLabel>Check-in Date & Time *</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="checkInDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="checkInTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Check-out */}
                  <div className="space-y-3">
                    <FormLabel>Check-out Date & Time</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="checkOutDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} value={singleCheckInDate || ""} disabled />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="checkOutTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Remarks */}
                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any notes..."
                            rows={3}
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormDescription>Max 500 characters</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* BATCH MODE */}
        <TabsContent value="batch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Batch Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">


              {/* Master Date & Time for Batch Entries */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Batch Date & Time</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Check-in Date</label>
                      <Input type="date" value={batchCheckInDate} onChange={(e) => setBatchCheckInDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Check-in Time</label>
                      <Input type="time" value={batchCheckInTime} onChange={(e) => setBatchCheckInTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Check-out Date</label>
                      <Input type="date" value={batchCheckInDate} disabled placeholder="Follows check-in date" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Check-out Time </label>
                      <Input type="time" value={batchCheckOutTime} onChange={(e) => setBatchCheckOutTime(e.target.value)} placeholder="Optional" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Master Status & Notes for Batch Entries */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Batch Notes</label>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                  <div>
                    <Textarea
                      placeholder="Add notes for all selected members..."
                      rows={2}
                      value={batchRemarks}
                      onChange={(e) => setBatchRemarks(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Add Buttons */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Quick Add Members</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addBatchEntry()}
                    disabled={isSubmitting}
                  >
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="relative pb-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search member to add..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="pl-8 pb-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto pt-2">
                    {members.filter(m =>
                      m.label.toLowerCase().includes(memberSearch.toLowerCase()) ||
                      m.department.toLowerCase().includes(memberSearch.toLowerCase())
                    ).map((member) => (
                      <Button
                        key={member.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const exists = batchEntries.some((e) => e.memberId === member.id)
                          if (!exists) {
                            addBatchEntry(member.id)

                          } else {
                            toast.info(`${member.label} already in batch`)
                          }
                        }}
                        disabled={isSubmitting}
                        className="text-left truncate"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        <span className="truncate text-xs">{member.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Batch Entries List */}
              <div className="space-y-3">
                <label className="text-sm font-medium block">
                  Attendance Records ({batchEntries.length})
                </label>

                {batchEntries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    No entries yet. Click "Add Empty Entry" or quick add a member above.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto pt-2">
                    {batchEntries.map((entry) => {
                      const selectedMember = members.find((m) => m.id === entry.memberId)
                      return (
                        <Button
                          key={entry.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBatchEntries((prev) => prev.filter((e) => e.id !== entry.id));
                          }}
                          disabled={isSubmitting}
                          className="text-left truncate"
                        >
                          <Minus className="mr-1 h-3 w-3" />
                          <span className="truncate text-xs">{selectedMember ? selectedMember.label : 'Select member...'}</span>
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Batch Submit */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button
              onClick={onSubmitBatch}
              disabled={isSubmitting || batchEntries.length === 0}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save {batchEntries.length} Records
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Shared Member Selection Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={(open) => {
        setMemberDialogOpen(open);
        if (!open) {
          setMemberSearch("");
          setActiveBatchEntryId(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium gap-2">Filter by Department</label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter} disabled={loading}>
                <SelectTrigger className="w-full pt-2">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {departments.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search member name or department..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="max-h-72 overflow-y-auto space-y-1">
              {(departmentFilter === "all"
                ? members
                : members.filter((m) => m.department === departmentFilter)
              ).filter(m =>
                m.label.toLowerCase().includes(memberSearch.toLowerCase()) ||
                m.department.toLowerCase().includes(memberSearch.toLowerCase())
              ).length > 0 ? (
                (departmentFilter === "all"
                  ? members
                  : members.filter((m) => m.department === departmentFilter)
                ).filter(m =>
                  m.label.toLowerCase().includes(memberSearch.toLowerCase()) ||
                  m.department.toLowerCase().includes(memberSearch.toLowerCase())
                ).map((member) => (
                  <Button
                    key={member.id}
                    variant="ghost"
                    className="w-full justify-start text-left font-normal h-auto py-2"
                    onClick={() => {
                      if (activeBatchEntryId) {
                        updateBatchEntry(activeBatchEntryId, "memberId", member.id);
                      } else {
                        form.setValue("memberId", member.id, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                        form.clearErrors("memberId");
                        form.trigger("memberId");
                      }
                      setMemberDialogOpen(false);
                      setMemberSearch("");
                      setActiveBatchEntryId(null);
                    }}
                  >
                    <div className="flex flex-col">
                      <span>{member.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {member.department}
                      </span>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                  {loading ? "Loading..." : "No members found"}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
