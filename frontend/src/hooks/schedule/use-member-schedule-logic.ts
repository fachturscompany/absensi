"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { IMemberSchedule } from "@/interface"
import { toast } from "sonner"
import { deleteMemberSchedule, getMemberSchedulesPage } from "@/action/member-schedule"

interface UseMemberScheduleLogicProps {
    organizationId?: string | number | null
}

export function useMemberScheduleLogic({ organizationId }: UseMemberScheduleLogicProps) {
    const [schedules, setSchedules] = useState<IMemberSchedule[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [pageIndex, setPageIndex] = useState(0)
    const [pageSize, setPageSize] = useState(10)
    const [totalRecords, setTotalRecords] = useState(0)
    const [refreshKey, setRefreshKey] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const onRefresh = useCallback(() => setRefreshKey(k => k + 1), [])

    useEffect(() => {
        if (!organizationId) {
            setSchedules([])
            setIsLoading(false)
            return
        }

        const fetchSchedules = async () => {
            try {
                setIsLoading(true)
                const schedulesRes = await getMemberSchedulesPage(organizationId, pageIndex, pageSize)

                if (schedulesRes?.success && Array.isArray(schedulesRes.data)) {
                    setSchedules(schedulesRes.data as IMemberSchedule[])
                    setTotalRecords(typeof schedulesRes.total === "number" ? schedulesRes.total : 0)
                } else {
                    setSchedules([])
                    setTotalRecords(0)
                }
            } catch (error) {
                toast.error('Failed to load member schedules')
                setSchedules([])
                setTotalRecords(0)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSchedules()
    }, [organizationId, pageIndex, pageSize, refreshKey])

    const handleDelete = async (id: string) => {
        try {
            setIsDeleting(true)
            const result = await deleteMemberSchedule(id)
            if (result.success) {
                toast.success("Schedule deleted successfully")
                setSchedules((prev) => prev.filter((s) => s.id !== id))
                onRefresh()
            } else {
                toast.error(result.message || "Failed to delete schedule")
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred")
        } finally {
            setIsDeleting(false)
        }
    }

    const filteredSchedules = useMemo(() => {
        if (!searchQuery.trim()) return schedules;
        const lower = searchQuery.toLowerCase();
        return schedules.filter(s => {
            const member = s.organization_member as any;
            const ws = s.work_schedule as any;
            const firstName = member?.user?.first_name || "";
            const lastName = member?.user?.last_name || "";
            const email = member?.user?.email || "";
            const wsName = ws?.name || "";

            return (
                firstName.toLowerCase().includes(lower) ||
                lastName.toLowerCase().includes(lower) ||
                email.toLowerCase().includes(lower) ||
                wsName.toLowerCase().includes(lower)
            )
        })
    }, [schedules, searchQuery]);

    return {
        schedules: filteredSchedules,
        isLoading,
        isDeleting,
        pageIndex,
        setPageIndex,
        pageSize,
        setPageSize,
        totalRecords,
        searchQuery,
        setSearchQuery,
        onRefresh,
        handleDelete
    }
}
