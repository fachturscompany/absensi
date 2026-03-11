"use client"

import React, { useState, useMemo, useEffect } from "react"
import { DateRangePicker } from "@/components/insights/DateRangePicker"
export const dynamic = 'force-dynamic'
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { Button } from "@/components/ui/button"
import { Download, Search, CheckCircle2, XCircle, Eye, Settings, Pencil, ListFilter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/tables/pagination-footer"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { getTimesheetApprovals, updateTimesheetStatus, type TimesheetApprovalRow } from "@/action/timesheets"
import { useOrgStore } from "@/store/org-store"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useTimezone } from "@/components/providers/timezone-provider"
import { exportToCSV, generateFilename } from "@/lib/export-utils"
import { format } from "date-fns"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApprovalDetailDialog } from "@/components/timesheets/approvals/ApprovalDetailDialog"
import { ActionConfirmDialog } from "@/components/timesheets/approvals/ActionConfirmDialog"

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'approved':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">Approved</span>
        case 'submitted':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">Submitted</span>
        case 'open':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">Open</span>
        case 'rejected':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">Rejected</span>
        default:
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">{status}</span>
    }
}

const getPaymentBadge = (status?: string) => {
    switch (status) {
        case 'paid':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">Paid</span>
        case 'processing':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">Processing</span>
        case 'unpaid':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">Unpaid</span>
        default:
            return <span className="text-gray-400">-</span>
    }
}

export default function TimesheetApprovalsPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 31)
    })

    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    // Data State
    const [approvals, setApprovals] = useState<TimesheetApprovalRow[]>([])
    const [members, setMembers] = useState<{ id: string; name: string }[]>([])
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

    // Org State
    const organizationId = useOrgStore((s) => s.organizationId)

    // UI State
    const [filters, setFilters] = useState({
        status: "all",
        paymentStatus: "all"
    })

    // Dialog States
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)
    const [actionDialogOpen, setActionDialogOpen] = useState(false)
    const [actionMode, setActionMode] = useState<'approve' | 'reject'>('approve')
    const [activeApproval, setActiveApproval] = useState<TimesheetApprovalRow | null>(null)
    const [isBulkAction, setIsBulkAction] = useState(false)

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [visibleCols] = useState({
        checkbox: true,
        member: true,
        dateRange: true,
        totalHours: true,
        activityPct: true,
        paymentStatus: true,
        submittedDate: true,
        screenshots: true,
        status: true,
        notes: true,
        actions: true
    })

    const loadData = React.useCallback(async () => {
        setIsLoading(true)
        const filtersParams = {
            startDate: dateRange.startDate ? format(dateRange.startDate, "yyyy-MM-dd") : undefined,
            endDate: dateRange.endDate ? format(dateRange.endDate, "yyyy-MM-dd") : undefined,
            organizationId: organizationId || undefined
        }

        const res = await getTimesheetApprovals(filtersParams)
        if (res.success) {
            setApprovals(res.data)

            // Extract unique members for filter dropdown
            const uniqueMembers = Array.from(new Map(res.data.map((item: any) => [item.memberId, { id: item.memberId, name: item.memberName }])).values())
            setMembers(uniqueMembers as { id: string, name: string }[])
        } else {
            toast.error("Failed to load approvals")
        }
        setIsLoading(false)
    }, [dateRange, organizationId])

    useEffect(() => {
        loadData()
    }, [loadData])

    const filteredData = useMemo(() => {
        return approvals.filter(item => {
            // Header Filter
            if (!selectedFilter.all && selectedFilter.id !== 'all') {
                if (selectedFilter.type === 'members') {
                    if (item.memberId !== selectedFilter.id) return false
                }
            }

            // Filter Status
            if (filters.status !== 'all' && item.status !== filters.status) return false
            // Filter Payment Status
            if (filters.paymentStatus !== 'all' && item.paymentStatus !== filters.paymentStatus) return false

            // Date Range Filter (Check if range overlaps)
            if (dateRange.startDate && dateRange.endDate) {
                const itemStart = new Date(item.dateStart)
                const itemEnd = new Date(item.dateEnd)
                if (itemEnd < dateRange.startDate || itemStart > dateRange.endDate) return false
            }

            if (searchQuery) {
                const lower = searchQuery.toLowerCase()
                if (!item.memberName.toLowerCase().includes(lower) &&
                    (!item.comments || !item.comments.toLowerCase().includes(lower))) return false
            }

            return true
        })
    }, [approvals, selectedFilter, filters, dateRange, searchQuery])

    const totalPages = Math.ceil(filteredData.length / pageSize)
    const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize)

    // Selection Handlers
    const toggleRow = (id: string) => {
        const newSelected = new Set(selectedRows)
        if (newSelected.has(id)) newSelected.delete(id)
        else newSelected.add(id)
        setSelectedRows(newSelected)
    }

    const toggleAll = () => {
        if (selectedRows.size === paginatedData.length) {
            setSelectedRows(new Set())
        } else {
            setSelectedRows(new Set(paginatedData.map(d => d.id)))
        }
    }

    // Action Handlers
    // Action Handlers
    const handleApproveClick = (id: string) => {
        const approval = approvals.find(a => a.id === id)
        if (approval) {
            setActiveApproval(approval)
            setActionMode('approve')
            setIsBulkAction(false)
            setActionDialogOpen(true)
        }
    }

    const handleRejectClick = (approval: TimesheetApprovalRow) => {
        setActiveApproval(approval)
        setActionMode('reject')
        setIsBulkAction(false)
        setActionDialogOpen(true)
    }

    const handleConfirmAction = async (reason: string) => {
        const newStatus = actionMode === 'approve' ? 'approved' : 'rejected'
        const successConfig = actionMode === 'approve'
            ? { status: 'approved', submittedDate: new Date().toISOString(), comments: reason }
            : { status: 'rejected', comments: reason }

        if (isBulkAction) {
            // Bulk update
            const ids = Array.from(selectedRows)
            let successCount = 0
            for (const id of ids) {
                const res = await updateTimesheetStatus(id, newStatus as any, reason)
                if (res.success) successCount++
            }
            if (successCount > 0) {
                setApprovals(prev => prev.map(a => selectedRows.has(a.id) ? { ...a, ...successConfig } as TimesheetApprovalRow : a))
                toast.success(`${successCount} timesheets ${newStatus}`)
                setSelectedRows(new Set())
            } else {
                toast.error(`Failed to update timesheets`)
            }
        } else if (activeApproval) {
            const res = await updateTimesheetStatus(activeApproval.id, newStatus as any, reason)
            if (res.success) {
                setApprovals(prev => prev.map(a => a.id === activeApproval.id ? { ...a, ...successConfig } as TimesheetApprovalRow : a))
                toast.success(`Timesheet ${newStatus}`)
            } else {
                toast.error(`Failed to update timesheet: ${res.message}`)
            }
        }
        setDetailDialogOpen(false)
        setActionDialogOpen(false)
    }

    const handleBulkApprove = () => {
        setActionMode('approve')
        setIsBulkAction(true)
        setActionDialogOpen(true)
    }

    const handleBulkRejectClick = () => {
        setActionMode('reject')
        setIsBulkAction(true)
        setActionDialogOpen(true)
    }

    const handleViewDetails = (approval: TimesheetApprovalRow) => {
        setActiveApproval(approval)
        setDetailDialogOpen(true)
    }



    const handleBulkExport = () => {
        const selectedData = filteredData.filter(item => selectedRows.has(item.id))

        exportToCSV({
            filename: generateFilename('selected-timesheets'),
            columns: [
                { key: 'memberName', label: 'Member' },
                { key: 'dateStart', label: 'Start Date' },
                { key: 'dateEnd', label: 'End Date' },
                { key: 'totalHours', label: 'Total Hours' },
                { key: 'activityPct', label: 'Activity %' },
                { key: 'paymentStatus', label: 'Payment Status' },
                { key: 'submittedDate', label: 'Submitted On' },
                { key: 'status', label: 'Status' },
                { key: 'comments', label: 'Comments' }
            ],
            data: selectedData
        })
        toast.success(`Exported ${selectedData.length} timesheets`)
        setSelectedRows(new Set())
    }

    const summaryCards = useMemo(() => {
        const submitted = approvals.filter(i => i.status === 'submitted').length
        const approved = approvals.filter(i => i.status === 'approved').length
        const rejected = approvals.filter(i => i.status === 'rejected').length
        const open = approvals.filter(i => i.status === 'open').length
        return [
            { label: "Submitted", value: submitted },
            { label: "Approved", value: approved },
            { label: "Rejected", value: rejected },
            { label: "Open (Draft)", value: open },
        ]
    }, [approvals])

    return (
        <div className="px-6 pb-6 space-y-3">
            <h1 className="text-xl font-semibold">Timesheet Approvals</h1>

            {/* 1. Settings Link */}
            <div>
                <Link href="/settings/timesheets" className="inline-flex items-center text-gray-900 hover:text-blue-700 font-medium text-sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage timesheet approvals
                </Link>
            </div>

            {/* 2. Date Range Picker */}
            <div className="w-full md:w-1/2 lg:w-1/3">
                <DateRangePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                    timezone={timezone}
                />
            </div>

            {/* 3. Members Filter */}
            <div className="w-full md:w-64 space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">MEMBERS</label>
                    <button
                        onClick={() => setSelectedFilter({ type: "members", all: true, id: "all" })}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >

                    </button>
                </div>
                <SearchableSelect
                    value={selectedFilter.id === 'all' || !selectedFilter.id ? "" : selectedFilter.id}
                    onValueChange={(val) => setSelectedFilter({ type: "members", all: !val, id: val || "all" })}
                    options={members.map(m => ({ value: m.id, label: m.name }))}
                    placeholder="Select members"
                    searchPlaceholder="Search members..."
                    className="w-full"
                />
            </div>

            {/* Toolbar: Search, Export, Bulk Actions */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="flex w-full md:w-64">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search..."
                                className="pl-9 h-10 bg-white w-full rounded-r-none border-r-0 focus-visible:ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="h-10 rounded-l-none border-l-0 px-3 bg-gray-50 text-gray-600 hover:bg-gray-100"
                                >
                                    <ListFilter className="w-4 h-4 mr-2" />
                                    Filter
                                    {(filters.status !== 'all' || filters.paymentStatus !== 'all') && (
                                        <span className="ml-2 flex h-2 w-2 rounded-full bg-gray-900" />
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4" align="end">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Filters</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Refine approvals by status.
                                        </p>
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="grid gap-1">
                                            <Label htmlFor="status">Approval Status</Label>
                                            <Select
                                                value={filters.status}
                                                onValueChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
                                            >
                                                <SelectTrigger id="status" className="h-8">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Statuses</SelectItem>
                                                    <SelectItem value="submitted">Submitted</SelectItem>
                                                    <SelectItem value="approved">Approved</SelectItem>
                                                    <SelectItem value="rejected">Rejected</SelectItem>
                                                    <SelectItem value="open">Open (Draft)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1">
                                            <Label htmlFor="payment">Payment Status</Label>
                                            <Select
                                                value={filters.paymentStatus}
                                                onValueChange={(val) => setFilters(prev => ({ ...prev, paymentStatus: val }))}
                                            >
                                                <SelectTrigger id="payment" className="h-8">
                                                    <SelectValue placeholder="Select payment status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Payment Statuses</SelectItem>
                                                    <SelectItem value="paid">Paid</SelectItem>
                                                    <SelectItem value="unpaid">Unpaid</SelectItem>
                                                    <SelectItem value="processing">Processing</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {(filters.status !== 'all' || filters.paymentStatus !== 'all') && (
                                        <Button
                                            variant="ghost"
                                            className="w-full h-8 text-white bg-gray-900 hover:cursor-pointer"
                                            onClick={() => setFilters({ status: "all", paymentStatus: "all" })}
                                        >
                                            Reset Filters
                                        </Button>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>


            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x border rounded-lg shadow-sm bg-white">
                {summaryCards.map((card, idx) => (
                    <div key={idx} className="p-4">
                        <p className="text-sm font-medium text-gray-500">{card.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                            <tr>
                                {visibleCols.checkbox && (
                                    <th className="p-3 w-10">
                                        <Checkbox
                                            checked={paginatedData.length > 0 && selectedRows.size === paginatedData.length}
                                            onCheckedChange={toggleAll}
                                        />
                                    </th>
                                )}
                                {visibleCols.member && <th className="p-3 pl-4 font-semibold">Member</th>}
                                {visibleCols.dateRange && <th className="p-3 font-semibold min-w-[170px]">Period</th>}
                                {visibleCols.totalHours && <th className="p-3 font-semibold">Total Hours</th>}
                                {visibleCols.activityPct && <th className="p-3 font-semibold">Activity %</th>}
                                {visibleCols.paymentStatus && <th className="p-3 font-semibold">Payment St.</th>}
                                {visibleCols.submittedDate && <th className="p-3 font-semibold min-w-[130px]">Submitted On</th>}
                                {visibleCols.screenshots && <th className="p-3 font-semibold">Screenshots</th>}
                                {visibleCols.status && <th className="p-3 font-semibold">Status</th>}
                                {visibleCols.notes && <th className="p-3 font-semibold">Reason</th>}
                                {visibleCols.actions && <th className="p-3 font-semibold text-center">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No approvals found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-100 even:bg-gray-50 transition-colors">
                                        {visibleCols.checkbox && (
                                            <td className="p-3">
                                                <Checkbox
                                                    checked={selectedRows.has(row.id)}
                                                    onCheckedChange={() => toggleRow(row.id)}
                                                />
                                            </td>
                                        )}
                                        {visibleCols.member && (
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600 font-bold shrink-0">
                                                        {row.memberName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{row.memberName}</div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        {visibleCols.dateRange && (
                                            <td className="p-4 text-gray-600">
                                                {format(new Date(row.dateStart), 'MMM dd')} - {format(new Date(row.dateEnd), 'MMM dd, yyyy')}
                                            </td>
                                        )}
                                        {visibleCols.totalHours && <td className="p-4 text-gray-900 font-mono font-bold">{row.totalHours}</td>}
                                        {visibleCols.activityPct && (
                                            <td className="p-4">
                                                <span className="font-medium text-gray-600">
                                                    {row.activityPct ? `${row.activityPct}%` : '-'}
                                                </span>
                                            </td>
                                        )}
                                        {visibleCols.paymentStatus && <td className="p-4">{getPaymentBadge(row.paymentStatus)}</td>}
                                        {visibleCols.submittedDate && (
                                            <td className="p-4 text-sm text-gray-500">
                                                {row.submittedDate ? format(new Date(row.submittedDate), 'MMM dd, HH:mm') : '-'}
                                            </td>
                                        )}
                                        {visibleCols.screenshots && (
                                            <td className="p-4">
                                                <Link href={`/activity/screenshots?memberId=${row.memberId}`}>
                                                    <Button variant="outline" size="sm" className="hover:cursor-pointer h-7 text-xs text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:text-blue-700 rounded-full">
                                                        Screens
                                                    </Button>
                                                </Link>
                                            </td>
                                        )}
                                        {visibleCols.status && <td className="p-4">{getStatusBadge(row.status)}</td>}
                                        {visibleCols.notes && <td className="p-4 text-sm text-gray-500 italic max-w-xs truncate" title={row.comments}>{row.comments || "-"}</td>}

                                        {visibleCols.actions && (
                                            <td className="p-4 text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleViewDetails(row)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        {row.status === 'submitted' && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleApproveClick(row.id)} className="text-green-600 focus:text-green-600 focus:bg-green-50">
                                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                    Approve
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleRejectClick(row)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                                                    <XCircle className="mr-2 h-4 w-4" />
                                                                    Reject
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-4">
                <PaginationFooter
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    from={filteredData.length > 0 ? (page - 1) * pageSize + 1 : 0}
                    to={Math.min(page * pageSize, filteredData.length)}
                    total={filteredData.length}
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                    isLoading={isLoading}
                />
            </div>

            <ApprovalDetailDialog
                open={detailDialogOpen}
                onOpenChange={setDetailDialogOpen}
                approval={activeApproval}
                onApprove={handleApproveClick}
                onReject={() => activeApproval && handleRejectClick(activeApproval)}
            />

            <ActionConfirmDialog
                open={actionDialogOpen}
                onOpenChange={setActionDialogOpen}
                onConfirm={handleConfirmAction}
                mode={actionMode}
            />
            {selectedRows.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border shadow-lg rounded-full px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-4 z-50 animate-in slide-in-from-bottom-5 max-w-[calc(100vw-2rem)] overflow-x-auto">
                    <span className="text-sm font-medium text-gray-900 border-r pr-3 sm:pr-4 whitespace-nowrap">
                        {selectedRows.size} selected
                    </span>
                    <div className="flex items-center gap-2">
                        {Array.from(selectedRows).every(id => approvals.find(a => a.id === id)?.status === 'submitted') && (
                            <>
                                <Button size="sm" onClick={handleBulkApprove} className="h-8 bg-white hover:bg-gray-900 text-gray-900 hover:text-white cursor-pointer border-gray-900 px-2 sm:px-3">
                                    <CheckCircle2 className="w-4 h-4 mr-0 sm:mr-2" />
                                    <span className="hidden sm:inline">Approve</span>
                                </Button>
                                <Button size="sm" variant="destructive" onClick={handleBulkRejectClick} className="h-8 bg-white text-red-600 hover:bg-red-600 hover:text-white hover:cursor-pointer px-2 sm:px-3">
                                    <XCircle className="w-4 h-4 mr-0 sm:mr-2" />
                                    <span className="hidden sm:inline">Reject</span>
                                </Button>
                            </>
                        )}
                        <Button size="sm" variant="default" onClick={handleBulkExport} className="h-8 cursor-pointer px-2 sm:px-3">
                            <Download className="w-4 h-4 mr-0 sm:mr-2" />
                            <span className="hidden sm:inline">Export</span>
                        </Button>
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 ml-2 rounded-full hover:bg-gray-100"
                        onClick={() => setSelectedRows(new Set())}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div >
    )
}
