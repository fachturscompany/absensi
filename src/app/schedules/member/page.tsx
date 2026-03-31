"use client"

import { useHydration } from "@/hooks/useHydration"
import { useMemberScheduleLogic } from "@/hooks/schedule/use-member-schedule-logic"
import MemberScheduleTableToolbar from "@/components/schedule/member/member-schedule-table-toolbar"
import MemberScheduleTable from "@/components/schedule/member/member-schedule-table"

export default function MemberSchedulesPage() {
  const { organizationId, isReady } = useHydration()
  const logic = useMemberScheduleLogic({ organizationId })

  if (!isReady) {
    return (
      <div className="flex flex-1 flex-col gap-4 w-full p-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-[400px] w-full bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="flex flex-1 flex-col gap-4 w-full p-4">
        <div className="flex items-center justify-center min-h-[400px] bg-muted/20 border border-dashed rounded-lg">
          <div className="text-center space-y-4">
            <div className="text-6xl">🏢</div>
            <h2 className="text-2xl font-semibold">No Organization Selected</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Please select an organization to view member schedules.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Member Schedules</h1>
      </div>

      <MemberScheduleTableToolbar
        searchQuery={logic.searchQuery}
        onSearchChange={logic.setSearchQuery}
      />

      <MemberScheduleTable
        items={logic.schedules}
        isLoading={logic.isLoading}
        pageIndex={logic.pageIndex}
        pageSize={logic.pageSize}
        totalRecords={logic.totalRecords}
        onPageIndexChange={logic.setPageIndex}
        onPageSizeChange={logic.setPageSize}
        onDelete={logic.handleDelete}
      />
    </div>
  )
}

