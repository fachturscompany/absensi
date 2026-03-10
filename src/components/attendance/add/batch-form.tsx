"use client"

import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Minus, Search, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { QUICK_STATUSES } from "@/types/attendance"
import { useMembers } from "@/hooks/attendance/use-members"
import { useBatchAttendance } from "@/hooks/attendance/use-batch-attendance"
import { type BatchAttendanceReturn } from "@/types/attendance"

interface BatchAttendanceFormProps {
  onSubmit: () => Promise<void>
  onCancel: () => void
  batch?: BatchAttendanceReturn
}

export function BatchForm({ onSubmit, onCancel, batch: externalBatch }: BatchAttendanceFormProps) {
  const { members, departments, loading } = useMembers()
  const localBatch = useBatchAttendance()
  const batch = externalBatch || localBatch

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Check-in Date</label>
                  <Input
                    type="date"
                    value={batch.batchCheckInDate}
                    onChange={(e) => batch.setBatchCheckInDate(e.target.value)}
                    disabled={batch.isSubmitting || loading}
                  />
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
                    value={batch.batchCheckInDate}
                    disabled
                    placeholder="Follows check-in date"
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

          {/* Batch Status & Notes */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Batch Status & Notes</label>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Default Status</label>
                <Select
                  disabled={batch.isSubmitting || loading}
                  value={batch.batchStatus}
                  onValueChange={(value: any) => batch.setBatchStatus(value)}
                >
                  <SelectTrigger className="w-full md:w-1/2">
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
                <label className="text-xs text-muted-foreground block mb-2">Default Notes</label>
                <Textarea
                  placeholder="Notes for all records (optional)..."
                  rows={2}
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
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={batch.memberSearch}
                  onChange={(e) => batch.setMemberSearch(e.target.value)}
                  className="pl-8"
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
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {batch.batchEntries.map(entry => {
                  const member = members.find(m => m.id === entry.memberId)
                  return (
                    <div key={entry.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {member?.label || 'Unknown Member'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.checkInDate} {entry.checkInTime}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${entry.status === 'present' ? 'bg-green-100 text-green-800' :
                          entry.status === 'absent' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                          {entry.status}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => batch.removeBatchEntry(entry.id)}
                          disabled={batch.isSubmitting || loading}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
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
