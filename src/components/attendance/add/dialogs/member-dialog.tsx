import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/toolbar/search-bar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { MemberOption, BatchEntry } from "@/types/attendance"
import type { UseFormReturn } from "react-hook-form"
import type { SingleFormValues } from "@/types/attendance" // Adjust path
import { UserAvatar } from "@/components/profile&image/user-avatar"

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
            <SearchBar
              placeholder="Search member name or department..."
              initialQuery={batch.memberSearch}
              onSearch={batch.setMemberSearch}
            />
          </div>

          {/* Members List - MONOLITH */}
          <div className="max-h-72 overflow-y-auto space-y-1">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <Button
                  key={member.id}
                  variant="ghost"
                  className="w-full justify-start text-left font-normal h-auto py-2 pr-4 pl-3 rounded-xl transition-all hover:bg-muted"
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
                  <div className="flex items-center gap-3 w-full">
                    <UserAvatar
                      name={member.label}
                      photoUrl={member.avatar}
                      userId={member.userId}
                      className="h-9 w-9 border border-border shadow-sm shrink-0"
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-semibold truncate">{member.label}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{member.department}</span>
                    </div>
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
