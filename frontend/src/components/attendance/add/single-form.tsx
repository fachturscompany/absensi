import { useState, useEffect } from "react"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X, Loader2 } from "lucide-react"
import { TabsContent } from "@/components/ui/tabs"
import type { UseFormReturn } from "react-hook-form"
import type { SingleFormValues, MemberOption } from "@/types/attendance"
import { QUICK_STATUSES } from "@/types/attendance"
import { useRouter } from "next/navigation"
import type { DialogHandlers } from "@/components/attendance/add/dialogs/member-dialog"
import { getMemberSchedule } from "@/action/attendance"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface SingleFormProps {
  activeTab: "single" | "batch"
  form: UseFormReturn<SingleFormValues>
  members: MemberOption[]
  loading: boolean
  singleCheckInDate: string | null
  onSubmit: (values: SingleFormValues) => Promise<void>
  dialogHandlers: DialogHandlers
}

export function SingleForm({
  form,
  members,
  loading,
  onSubmit,
  dialogHandlers  // ✅ Props OK!
}: SingleFormProps) {
  const router = useRouter()
  const [localSchedule, setLocalSchedule] = useState<any>(null)
  const [scheduleError, setScheduleError] = useState<string | null>(null)

  const memberId = form.watch("memberId")
  const checkInDate = form.watch("checkInDate")

  // Auto-fetch schedule when member or date changes
  useEffect(() => {
    if (memberId && checkInDate) {
      // Ensure date is string if it's a Date object
      const dateStr = typeof checkInDate === 'string' ? checkInDate : (checkInDate && (checkInDate as any).toISOString ? (checkInDate as any).toISOString().split('T')[0] : String(checkInDate))

      if (dateStr) {
        getMemberSchedule(memberId, dateStr).then(res => {
          if (res.success) {
            setLocalSchedule(res.data)
            setScheduleError(null)
          } else {
            setLocalSchedule(null)
            setScheduleError(res.message || "Failed to fetch schedule")
          }
        })
      }
    } else {
      setLocalSchedule(null)
      setScheduleError(null)
    }
  }, [memberId, checkInDate])

  // Helper to check if value matches preset
  const isMatch = (fieldName: keyof SingleFormValues, scheduleValue?: string | null) => {
    if (!scheduleValue) return false
    const formValue = form.getValues(fieldName)
    return formValue === scheduleValue.slice(0, 5)
  }

  return (
    <TabsContent value="single" className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Single Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* ✅ MEMBER BUTTON - PERFECT */}
              <FormField
                control={form.control}
                name="memberId"
                render={({ field }) => {
                  const selectedMember = members.find(m => m.id === field.value)
                  return (
                    <FormItem className="flex flex-col">
                      <FormControl>
                        <input type="hidden" {...field} />
                      </FormControl>
                      <FormLabel>Select Member *</FormLabel>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={`w-full justify-between font-normal ${!field.value && "text-muted-foreground"}`}
                        disabled={loading}
                        type="button"
                        onClick={() => {
                          dialogHandlers.setActiveBatchEntryId(null)
                          dialogHandlers.setMemberDialogOpen(true)
                        }}
                      >
                        {selectedMember ? `${selectedMember.label} (${selectedMember.department})` : "Choose a member..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>

                      <div className="grid grid-cols-4 gap-2 mt-2">
                        <Button
                          type="button"
                          variant={isMatch("checkInTime", localSchedule?.start_time) ? "default" : "secondary"}
                          size="sm"
                          className={cn(
                            "text-[10px] h-8 px-1",
                            isMatch("checkInTime", localSchedule?.start_time) && "bg-zinc-900 text-white hover:bg-zinc-900/90"
                          )}
                          disabled={loading || !field.value}
                          onClick={() => {
                            if (localSchedule?.start_time) {
                              const checkInTime = localSchedule.start_time.slice(0, 5)
                              form.setValue("checkInTime", checkInTime)

                              // Auto-calculate status: if current time > schedule start time, set to late
                              // Simplified client-side logic for manual preset
                              const now = new Date()
                              const currentH = now.getHours()
                              const currentM = now.getMinutes()
                              const [schedH, schedM] = checkInTime.split(":").map(Number)

                              if (currentH > schedH || (currentH === schedH && currentM > schedM)) {
                                form.setValue("status", "late")
                              } else {
                                form.setValue("status", "present")
                              }

                              toast.info(`Status set based on schedule: ${currentH > schedH || (currentH === schedH && currentM > schedM) ? "Late" : "On-Time"}`)
                            } else if (scheduleError) {
                              toast.error(scheduleError)
                            } else if (!localSchedule) {
                              toast.error("No schedule assigned for this date")
                            } else {
                              toast.error("Start time is not set in schedule")
                            }
                          }}
                        >
                          Check-in
                        </Button>
                        <Button
                          type="button"
                          variant={isMatch("checkOutTime", localSchedule?.core_hours_end) ? "default" : "secondary"}
                          size="sm"
                          className={cn(
                            "text-[10px] h-8 px-1",
                            isMatch("checkOutTime", localSchedule?.core_hours_end) && "bg-zinc-900 text-white hover:bg-zinc-900/90"
                          )}
                          disabled={loading || !field.value}
                          onClick={() => {
                            if (localSchedule?.core_hours_end) {
                              form.setValue("checkOutTime", localSchedule.core_hours_end.slice(0, 5))
                            } else if (scheduleError) {
                              toast.error(scheduleError)
                            } else if (!localSchedule) {
                              toast.error("No schedule assigned for this date")
                            } else {
                              toast.error("Core hours end is not set in schedule")
                            }
                          }}
                        >
                          Check-out
                        </Button>
                        <Button
                          type="button"
                          variant={isMatch("breakStartTime", localSchedule?.break_start) ? "default" : "secondary"}
                          size="sm"
                          className={cn(
                            "text-[10px] h-8 px-1",
                            isMatch("breakStartTime", localSchedule?.break_start) && "bg-zinc-900 text-white hover:bg-zinc-900/90"
                          )}
                          disabled={loading || !field.value}
                          onClick={() => {
                            if (localSchedule?.break_start) {
                              form.setValue("breakStartTime", localSchedule.break_start.slice(0, 5))
                            } else if (!localSchedule) {
                              toast.error("No schedule assigned for this date")
                            } else {
                              toast.error("Break start is not set in schedule")
                            }
                          }}
                        >
                          Break In
                        </Button>
                        <Button
                          type="button"
                          variant={isMatch("breakEndTime", localSchedule?.break_end) ? "default" : "secondary"}
                          size="sm"
                          className={cn(
                            "text-[10px] h-8 px-1",
                            isMatch("breakEndTime", localSchedule?.break_end) && "bg-zinc-900 text-white hover:bg-zinc-900/90"
                          )}
                          disabled={loading || !field.value}
                          onClick={() => {
                            if (localSchedule?.break_end) {
                              form.setValue("breakEndTime", localSchedule.break_end.slice(0, 5))
                            } else if (!localSchedule) {
                              toast.error("No schedule assigned for this date")
                            } else {
                              toast.error("Break end is not set in schedule")
                            }
                          }}
                        >
                          Break Out
                        </Button>
                      </div>

                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              {/* ✅ CHECK-IN - CORRECT */}
              <div className="space-y-3">
                <FormLabel>Check-in Date & Time *</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="checkInDate"  // ✅ CORRECT!
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        {localSchedule && (
                          <p className="text-[10px] text-emerald-600 font-medium mt-1">
                            📅 Work Hours: {localSchedule.start_time?.slice(0, 5)} - {localSchedule.end_time?.slice(0, 5)}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="checkInTime"  // ✅ CORRECT!
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

              {/* ✅ CHECK-OUT - CORRECT */}
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
                          <Input type="date" {...field} />
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
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* ✅ BREAK TIMES */}
              <div className="space-y-3">
                <FormLabel>Break Times (Optional)</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="breakStartTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Break In</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="breakEndTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Break Out</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>


              {/* Status + Remarks - IDENTICAL (sudah benar) */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select
                      disabled={form.formState.isSubmitting}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full md:w-1/2">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {QUICK_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
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
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes..."
                        rows={3}
                        {...field}
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
            <Button type="submit" disabled={form.formState.isSubmitting || !form.watch("memberId")}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </Form>
    </TabsContent>
  )
}

