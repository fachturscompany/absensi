"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  getShiftAssignmentOptions,
  getShiftAssignmentsPage,
  type ShiftAssignmentMemberOption,
  type ShiftOption,
} from "@/action/shift-assignments"
import type { IShiftAssignment } from "@/interface"
import { useHydration } from "@/hooks/useHydration"
import { useOrgStore } from "@/store/org-store"
import ShiftAssignmentClient from "./shift-assignment-client"

type ApiSuccess<T> = { success: true; data: T }
type ApiFailure = { success: false; message?: string }
type ApiListPage<T> = (ApiSuccess<T[]> | ApiFailure) & { total?: number }

export default function ShiftAssignmentPage() {
  const { isReady, organizationId } = useHydration()
  const { organizationName: _organizationName } = useOrgStore()

  const [assignments, setAssignments] = useState<IShiftAssignment[]>([])
  const [shifts, setShifts] = useState<ShiftOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [totalRecords, setTotalRecords] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!isReady) return
    setPageIndex(0)
  }, [isReady, organizationId])

  useEffect(() => {
    if (!isReady) return

    if (!organizationId) {
      setAssignments([])
      setShifts([])
      setTotalRecords(0)
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)

        const [pageRes, optionsRes] = await Promise.all([
          getShiftAssignmentsPage(organizationId, pageIndex, pageSize),
          getShiftAssignmentOptions(organizationId),
        ])

        const page = pageRes as unknown as ApiListPage<IShiftAssignment>

        if (page?.success && Array.isArray(page.data)) {
          setAssignments(page.data)
          setTotalRecords(typeof page.total === "number" ? page.total : 0)
        } else {
          setAssignments([])
          setTotalRecords(0)
        }

        if (optionsRes?.success) {
          setShifts(Array.isArray(optionsRes.shifts) ? optionsRes.shifts : [])
        } else {
          setShifts([])
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load shift assignments")
        setAssignments([])
        setShifts([])
        setTotalRecords(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isReady, organizationId, pageIndex, pageSize, refreshKey])

  if (!isReady) {
    return (
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading shift assignments...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div className="flex flex-1 flex-col gap-4 w-full">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="text-6xl">🏢</div>
            <h2 className="text-2xl font-semibold">No Organization Selected</h2>
            <p className="text-muted-foreground max-w-md">
              Please select an organization to view shift assignments.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 w-full">
      <ShiftAssignmentClient
        organizationId={String(organizationId)}
        initialAssignments={assignments}
        members={[] as ShiftAssignmentMemberOption[]}
        shifts={shifts}
        isLoading={isLoading}
        pageIndex={pageIndex}
        pageSize={pageSize}
        totalRecords={totalRecords}
        onPageIndexChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onRefresh={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
