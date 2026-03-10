import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import type { MemberOption, BatchEntry } from "@/types/attendance"
import type { UseFormReturn } from "react-hook-form"
import type { SingleFormValues } from "@/types/attendance" // Adjust path

// ✅ PROPER TYPES - NO ANY!
export interface DialogHandlers {
  memberDialogOpen: boolean
  memberSearch: string
  departmentFilter: string
  activeBatchEntryId: string | null
  setMemberDialogOpen: (open: boolean) => void
  setMemberSearch: (search: string) => void
  setDepartmentFilter: (filter: string) => void
  setActiveBatchEntryId: (id: string | null) => void
  updateBatchEntry?: (id: string, field: keyof BatchEntry, value: string) => void
}

interface MemberDialogProps {
  members: MemberOption[]
  departments: string[]
  loading: boolean
  form: UseFormReturn<SingleFormValues> // ✅ Proper form type
  batch: DialogHandlers
}

export function MemberDialog({
  members,
  departments,
  loading,
  form,
  batch
}: MemberDialogProps) {
  const filteredMembers = (batch.departmentFilter === "all"
    ? members
    : members.filter((m) => m.department === batch.departmentFilter)
  ).filter(m =>
    m.label.toLowerCase().includes(batch.memberSearch.toLowerCase()) ||
    m.department.toLowerCase().includes(batch.memberSearch.toLowerCase())
  )

  return (
    <Dialog
      open={batch.memberDialogOpen}
      onOpenChange={(open) => {
        batch.setMemberDialogOpen(open)
        if (!open) {
          batch.setMemberSearch("")
          batch.setActiveBatchEntryId(null)
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {/* Department Filter - MONOLITH */}
          <div className="space-y-2">
            <label className="text-sm font-medium gap-2">Filter by Department</label>
            <Select
              value={batch.departmentFilter}
              onValueChange={batch.setDepartmentFilter}
              disabled={loading}
            >
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

          {/* Search - MONOLITH */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search member name or department..."
              value={batch.memberSearch}
              onChange={(e) => batch.setMemberSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Members List - MONOLITH */}
          <div className="max-h-72 overflow-y-auto space-y-1">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <Button
                  key={member.id}
                  variant="ghost"
                  className="w-full justify-start text-left font-normal h-auto py-2"
                  onClick={() => {
                    // ✅ MONOLITH EXACT - Proper single/batch logic
                    if (batch.activeBatchEntryId && batch.updateBatchEntry) {
                      batch.updateBatchEntry(batch.activeBatchEntryId, "memberId", member.id)
                    } else {
                      // Single mode - set form value
                      form.setValue("memberId", member.id, {
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true
                      })
                      form.clearErrors("memberId")
                      form.trigger("memberId")
                    }

                    // Close dialog
                    batch.setMemberDialogOpen(false)
                    batch.setMemberSearch("")
                    batch.setActiveBatchEntryId(null)
                  }}
                >
                  <div className="flex flex-col">
                    <span>{member.label}</span>
                    <span className="text-xs text-muted-foreground">{member.department}</span>
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
  )
}
