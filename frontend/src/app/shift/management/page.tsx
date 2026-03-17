"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { getShiftsPage } from "@/action/shift"
import type { IShift } from "@/interface"
import { useHydration } from "@/hooks/useHydration"
import { useOrgStore } from "@/store/org-store"
import ShiftManagementClient from "./shift-management-client"

export default function ShiftManagementPage() {
  const { isReady, organizationId } = useHydration()
  const { organizationName } = useOrgStore()
  const [shifts, setShifts] = useState<IShift[]>([])
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
      setShifts([])
      setTotalRecords(0)
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const res = await getShiftsPage(organizationId, pageIndex, pageSize)

        if (res?.success && Array.isArray(res.data)) {
          setShifts(res.data as IShift[])
          setTotalRecords(typeof (res as any).total === "number" ? (res as any).total : 0)
        } else {
          setShifts([])
          setTotalRecords(0)
        }
      } catch (error) {
        toast.error("Failed to load shifts")
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
            <p className="text-muted-foreground">Loading shifts...</p>
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
              Please select an organization to view shifts.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 w-full">
      <ShiftManagementClient
        initialShifts={shifts}
        organizationId={String(organizationId)}
        organizationName={organizationName || ""}
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
