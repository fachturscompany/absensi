"use client"

import { useEffect, useState, useCallback } from "react"
import { getWorkSchedulesPage } from "@/action/schedule"
import ScheduleTable from "@/components/schedule/schedule-table"
import { IWorkSchedule } from "@/interface"
import { useHydration } from "@/hooks/useHydration"
import { useOrgStore } from "@/store/org-store"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

// New Imports
import { useScheduleLogic } from "@/hooks/schedule/use-schedule-logic"
import ScheduleTableToolbar from "@/components/schedule/schedule-table-toolbar"
import ScheduleBatchActions from "@/components/schedule/schedule-batch-actions"
import ScheduleFormDialog from "@/components/schedule/dialogs/schedule-form-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export default function WorkSchedulesPage() {
  const { isReady, organizationId } = useHydration()
  const { organizationName } = useOrgStore()
  const [initialSchedules, setInitialSchedules] = useState<IWorkSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const onRefresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  const {
    searchQuery, setSearchQuery,
    typeFilter, setTypeFilter,
    statusFilter, setStatusFilter,
    currentPage, setCurrentPage,
    pageSize, setPageSize,
    isSubmitting,
    selectedIds,
    isEditOpen, setIsEditOpen,
    editingDetail, setEditingDetail,
    batchStatusOpen, setBatchStatusOpen,
    batchStatusValue, setBatchStatusValue,
    batchDeleteOpen, setBatchDeleteOpen,
    toggleSelect, toggleSelectAll, clearSelection,
    filteredItems, paginatedItems, totalPages, from, to,
    handleFormSuccess, handleDeleteSuccess,
    handleBatchStatusUpdate, handleBatchDelete
  } = useScheduleLogic({ initialSchedules, onRefresh })

  useEffect(() => {
    if (!isReady || !organizationId) {
      if (isReady && !organizationId) {
        setInitialSchedules([])
        setIsLoading(false)
      }
      return
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const schedulesRes = await getWorkSchedulesPage(organizationId, 0, 100)
        if (schedulesRes?.success && Array.isArray(schedulesRes.data)) {
          setInitialSchedules(schedulesRes.data as IWorkSchedule[])
        } else {
          setInitialSchedules([])
        }
      } catch (error) {
        toast.error("Failed to load work schedules")
        setInitialSchedules([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isReady, organizationId, refreshKey])

  if (!isReady) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1 max-w-sm" />
          <Skeleton className="h-10 w-32 ml-auto" />
        </div>
        <div className="border rounded-md">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4 bg-muted/20 rounded-lg border border-dashed p-12">
        <div className="text-4xl">🏢</div>
        <h2 className="text-xl font-semibold">No Organization Selected</h2>
        <p className="text-muted-foreground max-w-sm">
          Select an organization from the sidebar to manage work schedules.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Work schedules</h1>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <ScheduleTableToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          organizationId={String(organizationId)}
          organizationName={organizationName || ""}
          onAddSuccess={handleFormSuccess}
        />

        <ScheduleTable
          items={paginatedItems}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          allSelected={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
          onEdit={(ws) => {
            setEditingDetail(ws)
            setIsEditOpen(true)
          }}
          onDeleteSuccess={handleDeleteSuccess}
          // Pagination props
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          from={from}
          to={to}
          totalCount={filteredItems.length}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />

        <ScheduleBatchActions
          selectedCount={selectedIds.size}
          onClear={clearSelection}
          onEditStatus={() => {
            setBatchStatusValue(true)
            setBatchStatusOpen(true)
          }}
          onDelete={() => setBatchDeleteOpen(true)}
        />

        <ScheduleFormDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          organizationId={String(organizationId)}
          organizationName={organizationName || ""}
          editingDetail={editingDetail}
          onSuccess={handleFormSuccess}
        />

        {/* Batch Status Dialog */}
        <Dialog open={batchStatusOpen} onOpenChange={setBatchStatusOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Update Status</DialogTitle>
              <DialogDescription>
                Change the active status for {selectedIds.size} selected schedules.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <span className="text-sm font-medium">Active Status</span>
              <Switch
                checked={batchStatusValue}
                onCheckedChange={setBatchStatusValue}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBatchStatusOpen(false)}>Cancel</Button>
              <Button
                onClick={handleBatchStatusUpdate}
                disabled={isSubmitting}
                className="bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900"
              >
                {isSubmitting ? "Updating..." : "Update Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Batch Delete Confirmation */}
        <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {selectedIds.size} Schedules?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the selected schedules? This action cannot be undone and will remove all associated work hour configurations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBatchDelete}
                disabled={isSubmitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isSubmitting ? "Deleting..." : "Delete Permanently"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}
