"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { IWorkSchedule } from "@/interface"
import { toast } from "sonner"
import { deleteMultipleWorkSchedules, updateMultipleWorkSchedulesStatus } from "@/action/schedule"

interface UseScheduleLogicProps {
    initialSchedules: IWorkSchedule[]
    onRefresh?: () => void
}

export function useScheduleLogic({ initialSchedules, onRefresh }: UseScheduleLogicProps) {
    const [schedules, setSchedules] = useState(initialSchedules)
    const [searchQuery, setSearchQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set())

    // Dialog States
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingDetail, setEditingDetail] = useState<IWorkSchedule | null>(null)
    const [batchStatusOpen, setBatchStatusOpen] = useState(false)
    const [batchStatusValue, setBatchStatusValue] = useState(true)
    const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)

    // Sync schedules from props
    useEffect(() => {
        setSchedules(initialSchedules)
    }, [initialSchedules])

    // Filter logic
    const filteredItems = useMemo(() => {
        let result = schedules
        if (searchQuery.trim()) {
            const lower = searchQuery.toLowerCase()
            result = result.filter(s =>
                s.name?.toLowerCase().includes(lower) ||
                s.description?.toLowerCase().includes(lower)
            )
        }
        if (typeFilter !== "all") {
            result = result.filter(s => s.schedule_type === typeFilter)
        }
        if (statusFilter !== "all") {
            const isActive = statusFilter === "active"
            result = result.filter(s => s.is_active === isActive)
        }
        return result
    }, [schedules, searchQuery, typeFilter, statusFilter])

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, typeFilter, statusFilter, pageSize])

    // Selection Helpers
    const toggleSelect = useCallback((id: string | number) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }, [])

    const toggleSelectAll = useCallback(() => {
        const allSelected = filteredItems.length > 0 && selectedIds.size === filteredItems.length
        if (allSelected) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredItems.map(s => s.id)))
        }
    }, [filteredItems, selectedIds.size])

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set())
    }, [])

    // Pagination outputs
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filteredItems.slice(start, start + pageSize)
    }, [filteredItems, currentPage, pageSize])

    const totalPages = Math.ceil(filteredItems.length / pageSize)
    const from = filteredItems.length > 0 ? (currentPage - 1) * pageSize + 1 : 0
    const to = Math.min(currentPage * pageSize, filteredItems.length)

    // Actions
    const handleFormSuccess = useCallback((data: IWorkSchedule, isEdit: boolean) => {
        if (isEdit) {
            setSchedules((prev) => prev.map((s) => (s.id === data.id ? data : s)))
        } else {
            setSchedules((prev) => [data, ...prev])
        }
        onRefresh?.()
    }, [onRefresh])

    const handleDeleteSuccess = useCallback((id: string | number) => {
        setSchedules((prev) => prev.filter((s) => s.id !== id))
        setSelectedIds(prev => {
            const next = new Set(prev)
            next.delete(id)
            return next
        })
        onRefresh?.()
    }, [onRefresh])

    const handleBatchStatusUpdate = async () => {
        try {
            setIsSubmitting(true)
            const ids = Array.from(selectedIds)
            const res = await updateMultipleWorkSchedulesStatus(ids, batchStatusValue)
            if (res.success) {
                toast.success(res.message)
                setSchedules(prev => prev.map(s => ids.includes(s.id) ? { ...s, is_active: batchStatusValue } : s))
                setSelectedIds(new Set())
                setBatchStatusOpen(false)
                onRefresh?.()
                return true
            }
            toast.error(res.message || "Failed to update status")
        } catch (err) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
        return false
    }

    const handleBatchDelete = async () => {
        try {
            setIsSubmitting(true)
            const ids = Array.from(selectedIds)
            const res = await deleteMultipleWorkSchedules(ids)
            if (res.success) {
                toast.success(res.message)
                setSchedules(prev => prev.filter(s => !ids.includes(s.id)))
                setSelectedIds(new Set())
                setBatchDeleteOpen(false)
                onRefresh?.()
                return true
            }
            toast.error(res.message || "Failed to delete schedules")
        } catch (err) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
        return false
    }

    return {
        // State
        schedules,
        searchQuery,
        setSearchQuery,
        typeFilter,
        setTypeFilter,
        statusFilter,
        setStatusFilter,
        currentPage,
        setCurrentPage,
        pageSize,
        setPageSize,
        isSubmitting,
        selectedIds,

        // Dialog States
        isEditOpen,
        setIsEditOpen,
        editingDetail,
        setEditingDetail,
        batchStatusOpen,
        setBatchStatusOpen,
        batchStatusValue,
        setBatchStatusValue,
        batchDeleteOpen,
        setBatchDeleteOpen,

        // Selection Helpers
        toggleSelect,
        toggleSelectAll,
        clearSelection,

        // Items and pagination
        filteredItems,
        paginatedItems,
        totalPages,
        from,
        to,

        // Event handlers
        handleFormSuccess,
        handleDeleteSuccess,
        handleBatchStatusUpdate,
        handleBatchDelete,
    }
}
