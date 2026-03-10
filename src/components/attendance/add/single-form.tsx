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
                          variant="secondary"
                          size="sm"
                          className="text-[10px] h-8 px-1"
                          disabled={!field.value}
                          onClick={async () => {
                            const res = await getMemberSchedule(field.value, form.getValues("checkInDate"))
                            if (res.success && res.data) {
                              form.setValue("checkInTime", res.data.start_time.slice(0, 5))
                              toast.success("Applied check-in time")
                            } else {
                              toast.error("Schedule not found")
                            }
                          }}
                        >
                          Check-in
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="text-[10px] h-8 px-1"
                          disabled={!field.value}
                          onClick={async () => {
                            const res = await getMemberSchedule(field.value, form.getValues("checkInDate"))
                            if (res.success && res.data) {
                              form.setValue("checkOutTime", res.data.end_time.slice(0, 5))
                              if (!form.getValues("checkOutDate")) {
                                form.setValue("checkOutDate", form.getValues("checkInDate"))
                              }
                              toast.success("Applied check-out time")
                            } else {
                              toast.error("Schedule not found")
                            }
                          }}
                        >
                          Check-out
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="text-[10px] h-8 px-1"
                          disabled={!field.value}
                          onClick={async () => {
                            const res = await getMemberSchedule(field.value, form.getValues("checkInDate"))
                            if (res.success && res.data?.break_start) {
                              form.setValue("breakStartTime", res.data.break_start.slice(0, 5))
                              toast.success("Applied break start")
                            } else {
                              toast.error("Break schedule not found")
                            }
                          }}
                        >
                          Break In
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="text-[10px] h-8 px-1"
                          disabled={!field.value}
                          onClick={async () => {
                            const res = await getMemberSchedule(field.value, form.getValues("checkInDate"))
                            if (res.success && res.data?.break_end) {
                              form.setValue("breakEndTime", res.data.break_end.slice(0, 5))
                              toast.success("Applied break end")
                            } else {
                              toast.error("Break schedule not found")
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
                        <FormLabel className="text-sm">Break Start</FormLabel>
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
                        <FormLabel className="text-sm">Break End</FormLabel>
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

