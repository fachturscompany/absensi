"use client"

import React, { useState, useMemo, useEffect } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_TIMESHEET_APPROVALS } from "@/lib/data/dummy-data"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { Button } from "@/components/ui/button"
import { Download, SlidersHorizontal, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

import { useTimezone } from "@/components/providers/timezone-provider"
import { exportToCSV, generateFilename } from "@/lib/export-utils"
import { format } from "date-fns"
import { TimesheetApprovalsFilterSidebar } from "@/components/report/TimesheetApprovalsFilterSidebar"
const getStatusBadge = (status: string) => {
    switch (status) {
        case 'approved':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">Approved</span>
        case 'pending':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Pending</span>
        case 'rejected':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">Rejected</span>
        default:
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">{status}</span>
    }
}

export default function TimesheetApprovalsPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(),
        endDate: new Date()
    })

    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    const [filterSidebarOpen, setFilterSidebarOpen] = useState(false)
    const [sidebarFilters, setSidebarFilters] = useState({
        memberId: "all",
        status: "all"
    })

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [visibleCols, setVisibleCols] = useState({
        member: true,
        dateRange: true,
        totalHours: true,
        status: true,
        approver: true,
        approvalDate: true,
        comments: true,
    })

    useEffect(() => {
        setDateRange({
            startDate: new Date(2026, 0, 1),
            endDate: new Date(2026, 0, 31)
        })
        const timer = setTimeout(() => setIsLoading(false), 800)
        return () => clearTimeout(timer)
    }, [])

    const toggleCol = (key: keyof typeof visibleCols, value: boolean) => {
        setVisibleCols((prev) => ({ ...prev, [key]: value }))
    }

    const filteredData = useMemo(() => {
        return DUMMY_TIMESHEET_APPROVALS.filter(item => {
            // Header Filter
            if (!selectedFilter.all && selectedFilter.id !== 'all') {
                if (selectedFilter.type === 'members') {
                    if (item.memberId !== selectedFilter.id) return false
                }
            }

            // Sidebar Filters
            if (sidebarFilters.memberId !== 'all' && item.memberId !== sidebarFilters.memberId) return false
            if (sidebarFilters.status !== 'all' && item.status !== sidebarFilters.status) return false

            // Date Range Filter (Check if range overlaps)
            if (dateRange.startDate && dateRange.endDate) {
                const itemStart = new Date(item.dateStart)
                const itemEnd = new Date(item.dateEnd)
                // If item ends before range starts, OR item starts after range ends -> No Overlap
                if (itemEnd < dateRange.startDate || itemStart > dateRange.endDate) return false
            }

            if (searchQuery) {
                const lower = searchQuery.toLowerCase()
                if (!item.memberName.toLowerCase().includes(lower) &&
                    (!item.comments || !item.comments.toLowerCase().includes(lower))) return false
            }

            return true
        })
    }, [selectedFilter, sidebarFilters, dateRange, searchQuery])

    const totalPages = Math.ceil(filteredData.length / pageSize)
    const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize)

    const handleExport = () => {
        exportToCSV({
            filename: generateFilename('timesheet-approvals'),
            columns: [
                { key: 'memberName', label: 'Member' },
                { key: 'dateStart', label: 'Start Date' },
                { key: 'dateEnd', label: 'End Date' },
                { key: 'totalHours', label: 'Total Hours' },
                { key: 'status', label: 'Status' },
                { key: 'approver', label: 'Approver' },
                { key: 'approvalDate', label: 'Approval Date' },
                { key: 'comments', label: 'Comments' }
            ],
            data: filteredData
        })
        toast.success("Exported successfully")
    }

    const summaryCards = useMemo(() => {
        const open = filteredData.filter(i => i.status === 'open').length
        const approved = filteredData.filter(i => i.status === 'approved').length
        const rejected = filteredData.filter(i => i.status === 'rejected').length

        return [
            { label: "Open (Draft)", value: open },
            { label: "Approved Timesheets", value: approved },
            { label: "Rejected Timesheets", value: rejected },
        ]
    }, [filteredData])

    return (
        <div className="px-6 pb-6 space-y-6">
            <h1 className="text-xl font-semibold">Timesheet Approval Report</h1>

            <InsightsHeader
                selectedFilter={selectedFilter}
                onSelectedFilterChange={setSelectedFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                members={DUMMY_MEMBERS}
                teams={DUMMY_TEAMS}
                timezone={timezone}
            >
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search approvals..."
                            className="pl-9 h-10 bg-white dark:bg-gray-950 dark:border-gray-800 dark:text-gray-200 max-w-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Button
                        variant="outline"
                        className="h-9 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 font-medium"
                        onClick={() => setFilterSidebarOpen(true)}
                    >
                        <Filter className="w-4 h-4 mr-2" /> Filter
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700">
                                <SlidersHorizontal className="w-4 h-4 mr-2" />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuCheckboxItem checked={visibleCols.member} onCheckedChange={(v) => toggleCol('member', !!v)}>Member</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.dateRange} onCheckedChange={(v) => toggleCol('dateRange', !!v)}>Date Range</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.totalHours} onCheckedChange={(v) => toggleCol('totalHours', !!v)}>Total Hours</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.status} onCheckedChange={(v) => toggleCol('status', !!v)}>Status</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.approver} onCheckedChange={(v) => toggleCol('approver', !!v)}>Approver</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.approvalDate} onCheckedChange={(v) => toggleCol('approvalDate', !!v)}>Approval Date</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.comments} onCheckedChange={(v) => toggleCol('comments', !!v)}>Comments</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" className="h-9" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </InsightsHeader>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm bg-white dark:bg-gray-950">
                {summaryCards.map((card, idx) => (
                    <div key={idx} className="p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-semibold border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                {visibleCols.member && <th className="p-3 pl-4 font-semibold">Member</th>}
                                {visibleCols.dateRange && <th className="p-3 font-semibold">Date Range</th>}
                                {visibleCols.totalHours && <th className="p-3 font-semibold">Total Hours</th>}
                                {visibleCols.status && <th className="p-3 font-semibold">Status</th>}
                                {visibleCols.approver && <th className="p-3 font-semibold">Approver</th>}
                                {visibleCols.approvalDate && <th className="p-3 font-semibold">Approval Date</th>}
                                {visibleCols.comments && <th className="p-3 font-semibold">Comments</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        No approvals found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-100 dark:hover:bg-gray-800 even:bg-gray-50 dark:even:bg-gray-900/50 transition-colors">
                                        {visibleCols.member && (
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
                                                        {row.memberName.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">{row.memberName}</span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleCols.dateRange && (
                                            <td className="p-4 text-gray-600 dark:text-gray-400">
                                                {format(new Date(row.dateStart), 'MMM dd')} - {format(new Date(row.dateEnd), 'MMM dd, yyyy')}
                                            </td>
                                        )}
                                        {visibleCols.totalHours && <td className="p-4 text-gray-900 dark:text-gray-100 font-mono font-medium">{row.totalHours}</td>}
                                        {visibleCols.status && <td className="p-4">{getStatusBadge(row.status)}</td>}
                                        {visibleCols.approver && (
                                            <td className="p-4">
                                                {row.approver && row.approver !== '-' ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
                                                            {row.approver.charAt(0)}
                                                        </div>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">{row.approver}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-600 dark:text-gray-400">-</span>
                                                )}
                                            </td>
                                        )}
                                        {visibleCols.approvalDate && <td className="p-4 text-gray-500 dark:text-gray-400 text-xs">{row.approvalDate ? format(new Date(row.approvalDate), 'MMM dd, HH:mm') : '-'}</td>}
                                        {visibleCols.comments && <td className="p-4 text-gray-500 dark:text-gray-400 italic max-w-xs truncate" title={row.comments}>{row.comments || '-'}</td>}
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


            <TimesheetApprovalsFilterSidebar
                open={filterSidebarOpen}
                onOpenChange={setFilterSidebarOpen}
                members={DUMMY_MEMBERS}
                onApply={setSidebarFilters}
            />
        </div >
    )
}
