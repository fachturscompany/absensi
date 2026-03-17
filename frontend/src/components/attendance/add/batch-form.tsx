"use client"
import { useState, useEffect } from "react"

import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SearchBar } from "@/components/customs/search-bar"
import { Plus, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { QUICK_STATUSES } from "@/types/attendance"
import { useMembers } from "@/hooks/attendance/add/use-members"
import { useBatchAttendance } from "@/hooks/attendance/add/use-batch-attendance"
import { type BatchAttendanceReturn } from "@/types/attendance"
import { getMemberSchedule } from "@/action/attendance"
import { cn } from "@/lib/utils"
import { type BatchEntry } from "@/types/attendance"

interface BatchAttendanceFormProps {
  onSubmit: () => Promise<void>
  onCancel: () => void
  batch?: BatchAttendanceReturn
}

export function BatchForm({ onSubmit, onCancel, batch: externalBatch }: BatchAttendanceFormProps) {
  const { members, departments, loading } = useMembers()
  const localBatch = useBatchAttendance()
  const batch = externalBatch || localBatch
  const [entrySchedules, setEntrySchedules] = useState<Record<string, any>>({})

  // Fetch missing schedules reactive-ly
  useEffect(() => {
    const fetchMissing = async () => {
      const memberIds = batch.batchEntries
        .map(e => e.memberId)
        .filter(id => id && !entrySchedules[id]) as string[]

      if (memberIds.length === 0) return

      const updates: Record<string, any> = { ...entrySchedules }
      await Promise.all(memberIds.map(async id => {
        const res = await getMemberSchedule(id, batch.batchCheckInDate)
        if (res.success) {
          updates[id] = res.data
        } else {
          // Store error to show in toast later
          updates[id] = { _error: res.message || "No schedule" }
        }
      }))
      setEntrySchedules(updates)
    }
    fetchMissing()
  }, [batch.batchEntries, batch.batchCheckInDate, entrySchedules])

  const isMatch = (entry: BatchEntry, field: keyof BatchEntry, scheduleValue?: string | null) => {
    if (!scheduleValue) return false
    const val = (entry as any)[field]
    return val === scheduleValue.slice(0, 5)
  }

  return (
    <TabsContent value="batch" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Batch Attendance ({batch.batchEntries.length} records)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Batch Date & Time */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Batch Date & Time</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Check-in Date</label>
                  <Input
                    type="date"
                    value={batch.batchCheckInDate}
                    onChange={(e) => batch.setBatchCheckInDate(e.target.value)}
                    disabled={batch.isSubmitting || loading}
                  />
                  <p className="text-[9px] text-muted-foreground mt-1">
                    * Date for all entries
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Check-in Time</label>
                  <Input
                    type="time"
                    value={batch.batchCheckInTime}
                    onChange={(e) => batch.setBatchCheckInTime(e.target.value)}
                    disabled={batch.isSubmitting || loading}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Check-out Date</label>
                  <Input
                    type="date"
                    value={batch.batchCheckOutDate}
                    onChange={(e) => batch.setBatchCheckOutDate(e.target.value)}
                    disabled={batch.isSubmitting || loading}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Check-out Time</label>
                  <Input
                    type="time"
                    value={batch.batchCheckOutTime}
                    onChange={(e) => batch.setBatchCheckOutTime(e.target.value)}
                    disabled={batch.isSubmitting || loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Batch Breaks */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Batch Break Times (Default)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Break In</label>
                  <Input
                    type="time"
                    value={batch.batchBreakStartTime}
                    onChange={(e) => batch.setBatchBreakStartTime(e.target.value)}
                    disabled={batch.isSubmitting || loading}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Break Out</label>
                  <Input
                    type="time"
                    value={batch.batchBreakEndTime}
                    onChange={(e) => batch.setBatchBreakEndTime(e.target.value)}
                    disabled={batch.isSubmitting || loading}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-9 px-2"
                  onClick={() => {
                    // We don't have a single member for "Batch Default", 
                    // but maybe we can just apply from the first member's schedule if available?
                    // Or just leave it as is for individual presets.
                  }}
                  disabled={true}
                >
                  Load Default Schedule (Unavailable)
                </Button>
              </div>
            </div>
          </div>

          {/* Batch Status & Notes */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Batch Status & Notes</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Default Status</label>
                <Select
                  disabled={batch.isSubmitting || loading}
                  value={batch.batchStatus}
                  onValueChange={(value: any) => batch.setBatchStatus(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
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
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Default Notes</label>
                <Textarea
                  placeholder="Notes for all records (optional)..."
                  rows={1}
                  className="min-h-[38px] py-2"
                  value={batch.batchRemarks}
                  onChange={(e) => batch.setBatchRemarks(e.target.value)}
                  disabled={batch.isSubmitting || loading}
                />
              </div>
            </div>
          </div>

          {/* Quick Add Members */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Quick Add Members ({members.length} available)
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => batch.addBatchEntry()}
                disabled={batch.isSubmitting || loading}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Empty Row
              </Button>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <SearchBar
                  placeholder="Search members..."
                  initialQuery={batch.memberSearch}
                  onSearch={batch.setMemberSearch}
                  disabled={batch.isSubmitting || loading}
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Select
                  value={batch.departmentFilter}
                  onValueChange={batch.setDepartmentFilter}
                  disabled={batch.isSubmitting || loading}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Depts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                {members
                  .filter(m =>
                    (batch.departmentFilter === "all" || m.department === batch.departmentFilter) &&
                    (!batch.memberSearch ||
                      m.label.toLowerCase().includes(batch.memberSearch.toLowerCase()) ||
                      m.department.toLowerCase().includes(batch.memberSearch.toLowerCase()))
                  )
                  .slice(0, 12)
                  .map(member => {
                    const alreadyAdded = batch.batchEntries.some(e => e.memberId === member.id)
                    return (
                      <Button
                        key={member.id}
                        type="button"
                        variant={alreadyAdded ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (!alreadyAdded) {
                            batch.addBatchEntry(member.id)
                            toast.success(`Added ${member.label}`)
                          }
                        }}
                        disabled={batch.isSubmitting || loading}
                        className="h-auto py-1 text-xs truncate"
                      >
                        <Plus className={`mr-1 h-3 w-3 ${alreadyAdded ? 'opacity-50' : ''}`} />
                        <span className="truncate">{member.label}</span>
                      </Button>
                    )
                  })}
              </div>
            </div>
          </div>

          {/* Current Batch Entries */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              Current Batch ({batch.batchEntries.length})
              {batch.batchEntries.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => batch.clearAllEntries()}
                  disabled={batch.isSubmitting || loading}
                >
                  <X className="h-3 w-3" />
                  Clear All
                </Button>
              )}
            </label>

            {batch.batchEntries.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg text-muted-foreground">
                <Plus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm">No attendance records yet</p>
                <p className="text-xs">Click "Add Empty Row" or select members above</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {batch.batchEntries.map(entry => {
                  const member = members.find(m => m.id === entry.memberId)
                  const sched = entry.memberId ? entrySchedules[entry.memberId] : null
                  return (
                    <div key={entry.id} className="p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900/40 space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold">
                            {member?.label?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              {member?.label || 'Select Member...'}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase">{member?.department || '-'}</p>
                            {sched && (
                              <p className="text-[9px] text-emerald-600 font-medium">
                                📅 {sched.start_time?.slice(0, 5)} - {sched.end_time?.slice(0, 5)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => batch.removeBatchEntry(entry.id)}
                          disabled={batch.isSubmitting || loading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-medium text-muted-foreground uppercase">Check-in</label>
                          <Input
                            type="time"
                            className="h-8 text-xs"
                            value={entry.checkInTime}
                            onChange={(e) => batch.updateBatchEntry(entry.id, "checkInTime", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-medium text-muted-foreground uppercase">Check-out</label>
                          <Input
                            type="time"
                            className="h-8 text-xs"
                            value={entry.checkOutTime || ""}
                            onChange={(e) => batch.updateBatchEntry(entry.id, "checkOutTime", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-medium text-muted-foreground uppercase">Break In</label>
                          <Input
                            type="time"
                            className="h-8 text-xs"
                            value={entry.breakStartTime || ""}
                            onChange={(e) => batch.updateBatchEntry(entry.id, "breakStartTime", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-medium text-muted-foreground uppercase">Break Out</label>
                          <Input
                            type="time"
                            className="h-8 text-xs"
                            value={entry.breakEndTime || ""}
                            onChange={(e) => batch.updateBatchEntry(entry.id, "breakEndTime", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                          <Button
                            type="button"
                            variant={isMatch(entry, "checkInTime", sched?.start_time) ? "default" : "secondary"}
                            className={cn(
                              "h-6 px-2 text-[10px] whitespace-nowrap",
                              isMatch(entry, "checkInTime", sched?.start_time) && "bg-zinc-900 text-white hover:bg-zinc-900/90"
                            )}
                            onClick={() => {
                              if (sched?.start_time) {
                                const checkInTime = sched.start_time.slice(0, 5)
                                batch.updateBatchEntry(entry.id, "checkInTime", checkInTime)

                                // Auto-calculate status: if current time > schedule start time, set to late
                                const now = new Date()
                                const currentH = now.getHours()
                                const currentM = now.getMinutes()
                                const [schedH, schedM] = checkInTime.split(":").map(Number)

                                if (currentH > schedH || (currentH === schedH && currentM > schedM)) {
                                  batch.updateBatchEntry(entry.id, "status", "late")
                                } else {
                                  batch.updateBatchEntry(entry.id, "status", "present")
                                }

                                toast.info(`Status for ${member?.label}: ${currentH > schedH || (currentH === schedH && currentM > schedM) ? "Late" : "On-Time"}`)
                              } else if (sched?._error) {
                                toast.error(sched._error)
                              } else if (!sched) {
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
                            variant={isMatch(entry, "checkOutTime", sched?.core_hours_end) ? "default" : "secondary"}
                            className={cn(
                              "h-6 px-2 text-[10px] whitespace-nowrap",
                              isMatch(entry, "checkOutTime", sched?.core_hours_end) && "bg-zinc-900 text-white hover:bg-zinc-900/90"
                            )}
                            onClick={() => {
                              if (sched?.core_hours_end) {
                                batch.updateBatchEntry(entry.id, "checkOutTime", sched.core_hours_end.slice(0, 5))
                              } else if (sched?._error) {
                                toast.error(sched._error)
                              } else if (!sched) {
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
                            variant={isMatch(entry, "breakStartTime", sched?.break_start) ? "default" : "secondary"}
                            className={cn(
                              "h-6 px-2 text-[10px] whitespace-nowrap",
                              isMatch(entry, "breakStartTime", sched?.break_start) && "bg-zinc-900 text-white hover:bg-zinc-900/90"
                            )}
                            onClick={() => {
                              if (sched?.break_start) {
                                batch.updateBatchEntry(entry.id, "breakStartTime", sched.break_start.slice(0, 5))
                              } else if (sched?._error) {
                                toast.error(sched._error)
                              } else if (!sched) {
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
                            variant={isMatch(entry, "breakEndTime", sched?.break_end) ? "default" : "secondary"}
                            className={cn(
                              "h-6 px-2 text-[10px] whitespace-nowrap",
                              isMatch(entry, "breakEndTime", sched?.break_end) && "bg-zinc-900 text-white hover:bg-zinc-900/90"
                            )}
                            onClick={() => {
                              if (sched?.break_end) {
                                batch.updateBatchEntry(entry.id, "breakEndTime", sched.break_end.slice(0, 5))
                              } else if (sched?._error) {
                                toast.error(sched._error)
                              } else if (!sched) {
                                toast.error("No schedule assigned for this date")
                              } else {
                                toast.error("Break end is not set in schedule")
                              }
                            }}
                          >
                            Break Out
                          </Button>
                        </div>
                        <Select
                          value={entry.status}
                          onValueChange={(val) => batch.updateBatchEntry(entry.id, "status", val)}
                        >
                          <SelectTrigger className="h-6 w-24 text-[10px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {QUICK_STATUSES.map(s => (
                              <SelectItem key={s.value} value={s.value} className="text-[10px]">
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={batch.isSubmitting || loading}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          disabled={batch.isSubmitting || batch.batchEntries.length === 0 || loading}
        >
          {batch.isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {batch.isSubmitting ? 'Saving...' : `Save ${batch.batchEntries.length} Records`}
        </Button>
      </div>
    </TabsContent>
  )
}
