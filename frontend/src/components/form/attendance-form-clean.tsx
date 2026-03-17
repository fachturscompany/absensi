"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Loader2, X } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { createManualAttendance } from "@/action/attendance"
import { getAllOrganization_member } from "@/action/members"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import type { IOrganization_member } from "@/interface"
import { toast } from "sonner"

type AttendanceEntry = {
  organization_member_id: string
  attendance_date: string
  actual_check_in: string
  actual_check_out: string | null
  status: string
  remarks?: string
}

type MemberOption = {
  id: string
  label: string
  department: string
}

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const MINUTES = Array.from({ length: 12 }, (_, idx) => idx * 5)

const STATUSES = [
  { value: "present", label: "Present", color: "bg-green-100 text-green-800" },
  { value: "absent", label: "Absent", color: "bg-red-100 text-red-800" },
  { value: "late", label: "Late", color: "bg-yellow-100 text-yellow-800" },
  { value: "excused", label: "Excused", color: "bg-blue-100 text-blue-800" },
  { value: "early_leave", label: "Early Leave", color: "bg-purple-100 text-purple-800" },
]

const formSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  checkInDate: z.date(),
  checkInHour: z.number().min(0).max(23),
  checkInMinute: z.number(),
  checkOutDate: z.date().optional(),
  checkOutHour: z.number().min(0).max(23).optional(),
  checkOutMinute: z.number().optional(),
  status: z.string().min(1, "Status is required"),
  remarks: z.string().max(500).optional(),
})

type FormValues = z.infer<typeof formSchema>

export function AttendanceFormClean() {
  const router = useRouter()
  const [members, setMembers] = useState<MemberOption[]>([])
  const [loading, setLoading] = useState(true)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      checkInHour: 8,
      checkInMinute: 0,
      status: "present",
      remarks: "",
    },
  })

  // Load members once on mount
  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true)
        const res = await getAllOrganization_member()

        if (!res.success) {
          throw new Error(res.message || "Failed to load members")
        }

        const membersData = (res.data || []) as IOrganization_member[]

        // Transform and filter members strictly
        const options: MemberOption[] = membersData
          .filter((member) => member.id && member.user?.id)
          .map((member) => {
            const displayName = member.user?.display_name?.trim()
            const fullName = [member.user?.first_name, member.user?.last_name]
              .filter(Boolean)
              .join(" ")
            const label = displayName || fullName || member.user?.email || "Unknown"

            return {
              id: String(member.id),
              label,
              department: member.departments?.name || "No Department",
            }
          })

        setMembers(options)
      } catch (error) {
        const message = error instanceof Error ? error.message : "An error occurred"
        toast.error(message)
      } finally {
        setLoading(false)
      }
    }

    loadMembers()
  }, [])

  const onSubmit = async (values: FormValues) => {
    try {
      const checkInDateTime = new Date(values.checkInDate)
      checkInDateTime.setHours(values.checkInHour, values.checkInMinute, 0, 0)

      const checkOutDateTime = values.checkOutDate
        ? (() => {
            const dt = new Date(values.checkOutDate)
            dt.setHours(values.checkOutHour || 17, values.checkOutMinute || 0, 0, 0)
            return dt
          })()
        : null

      const payload: AttendanceEntry = {
        organization_member_id: values.memberId,
        attendance_date: values.checkInDate.toISOString().split("T")[0] || "",
        actual_check_in: toTimestampWithTimezone(checkInDateTime),
        actual_check_out: checkOutDateTime ? toTimestampWithTimezone(checkOutDateTime) : null,
        status: values.status,
        remarks: values.remarks?.trim() || undefined,
      }

      const res = await createManualAttendance(payload)

      if (res.success) {
        toast.success("Attendance recorded successfully")
        router.push("/attendance")
      } else {
        toast.error(res.message || "Failed to save attendance")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred"
      toast.error(message)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Attendance</CardTitle>
            <CardDescription>Record attendance for a team member</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Member Selection */}
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Member *</FormLabel>
                  <Select disabled={loading} value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={loading ? "Loading members..." : "Choose a member"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-72">
                      {members.length > 0 ? (
                        members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-3">
                              <span>{member.label}</span>
                              <span className="text-xs text-muted-foreground">({member.department})</span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                          {loading ? "Loading..." : "No members found"}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Selection */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {STATUSES.map((status) => (
                      <Button
                        key={status.value}
                        type="button"
                        variant={field.value === status.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => field.onChange(status.value)}
                      >
                        {status.label}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Check-in Date and Time */}
            <div className="space-y-3">
              <FormLabel>Check-in Date & Time *</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="checkInDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "MMM dd, yyyy") : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("2024-01-01")
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="checkInHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Hour</FormLabel>
                      <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-48">
                          {HOURS.map((hour) => (
                            <SelectItem key={hour} value={String(hour)}>
                              {String(hour).padStart(2, "0")}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="checkInMinute"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Minute</FormLabel>
                      <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-48">
                          {MINUTES.map((minute) => (
                            <SelectItem key={minute} value={String(minute)}>
                              {String(minute).padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Check-out (Optional) */}
            <div className="space-y-3">
              <FormLabel className="text-sm">Check-out Date & Time (Optional)</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="checkOutDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "MMM dd, yyyy") : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("2024-01-01")
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="checkOutHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Hour</FormLabel>
                      <Select value={String(field.value || 17)} onValueChange={(v) => field.onChange(Number(v))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-48">
                          {HOURS.map((hour) => (
                            <SelectItem key={hour} value={String(hour)}>
                              {String(hour).padStart(2, "0")}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="checkOutMinute"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Minute</FormLabel>
                      <Select value={String(field.value || 0)} onValueChange={(v) => field.onChange(Number(v))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-48">
                          {MINUTES.map((minute) => (
                            <SelectItem key={minute} value={String(minute)}>
                              {String(minute).padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      placeholder="Add any notes or remarks..."
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
            Save Attendance
          </Button>
        </div>
      </form>
    </Form>
  )
}
