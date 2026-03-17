"use client"

import React, { useState, useMemo, useEffect } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import { DUMMY_MEMBERS, DUMMY_PROJECTS, DUMMY_TEAMS, DUMMY_MANUAL_TIME_EDITS } from "@/lib/data/dummy-data"
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
import { ManualTimeEditsFilterSidebar } from "@/components/report/ManualTimeEditsFilterSidebar"

const getActionBadge = (action: string) => {
    switch (action) {
        case 'add':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">Added</span>
        case 'edit':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Edited</span>
        case 'delete':
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">Deleted</span>
        default:
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">{action}</span>
    }
}

export default function ManualTimeEditsPage() {
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
        projectId: "all",
        action: "all"
    })

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [visibleCols, setVisibleCols] = useState({
        member: true,
        date: true,
        project: true,
        activity: true,
        originalTime: true,
        editedTime: true,
        action: true,
        editedBy: true,
        editDate: true,
        notes: true,
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
        return DUMMY_MANUAL_TIME_EDITS.filter(item => {
            // Header Filter
            if (!selectedFilter.all && selectedFilter.id !== 'all') {
                if (selectedFilter.type === 'members') {
                    if (item.memberId !== selectedFilter.id) return false
                }
            }

            // Sidebar Filters
            if (sidebarFilters.memberId !== 'all' && item.memberId !== sidebarFilters.memberId) return false
            if (sidebarFilters.projectId !== 'all' && item.project !== sidebarFilters.projectId) { // Assuming project name matches or need ID mapping. Using Name for dummy simple match
                // Check if project matches name in DUMMY_PROJECTS if we had IDs, but dummy data has project name string. 
                // Let's assume sidebar passes ID but data has Name. Need mapping or simplify.
                // Simplification: In data `project` is string name. In sidebar we pass Project ID. 
                // We should fix this mapping. 
                const proj = DUMMY_PROJECTS.find(p => p.id === sidebarFilters.projectId)
                if (proj && proj.name !== item.project) return false
            }
            if (sidebarFilters.action !== 'all' && item.action !== sidebarFilters.action) return false

            if (dateRange.startDate && dateRange.endDate) {
                const itemDate = new Date(item.date)
                if (itemDate < dateRange.startDate || itemDate > dateRange.endDate) return false
            }

            if (searchQuery) {
                const lower = searchQuery.toLowerCase()
                if (!item.memberName.toLowerCase().includes(lower) &&
                    !item.reason.toLowerCase().includes(lower) &&
                    !item.project.toLowerCase().includes(lower)) return false
            }

            return true
        })
    }, [selectedFilter, sidebarFilters, dateRange, searchQuery])

    const totalPages = Math.ceil(filteredData.length / pageSize)
    const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize)

    const handleExport = () => {
        exportToCSV({
            filename: generateFilename('manual-time-edits'),
            columns: [
                { key: 'memberName', label: 'Member' },
                { key: 'date', label: 'Date' },
                { key: 'project', label: 'Project' },
                { key: 'activity', label: 'Activity' },
                { key: 'originalTime', label: 'Original Time' },
                { key: 'editedTime', label: 'Edited Time' },
                { key: 'action', label: 'Action' },
                { key: 'editedBy', label: 'Edited By' },
                { key: 'editDate', label: 'Edit Date' },
                { key: 'reason', label: 'Notes' }
            ],
            data: filteredData.map(item => ({ ...item, activity: '0%' }))
        })
        toast.success("Exported successfully")
    }

    const summaryCards = useMemo(() => {
        const totalEdits = filteredData.length
        const totalAdds = filteredData.filter(i => i.action === 'add').length
        const totalEditsAction = filteredData.filter(i => i.action === 'edit').length


        return [
            { label: "Total Edits/Changes", value: totalEdits },
            { label: "Added Entries", value: totalAdds },
            { label: "Modified Entries", value: totalEditsAction },
            // { label: "Deleted Entries", value: totalDeletes }, // Optional, maybe fit in 3 cards
        ]
    }, [filteredData])

    return (
        <div className="px-6 pb-6 space-y-6">
            <h1 className="text-xl font-semibold">Manual Time Edit Report</h1>

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
                            placeholder="Search edits..."
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
                            <DropdownMenuCheckboxItem checked={visibleCols.date} onCheckedChange={(v) => toggleCol('date', !!v)}>Date</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.project} onCheckedChange={(v) => toggleCol('project', !!v)}>Project</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.activity} onCheckedChange={(v) => toggleCol('activity', !!v)}>Activity</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.originalTime} onCheckedChange={(v) => toggleCol('originalTime', !!v)}>Original Time</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.editedTime} onCheckedChange={(v) => toggleCol('editedTime', !!v)}>Edited Time</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.action} onCheckedChange={(v) => toggleCol('action', !!v)}>Action</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.editedBy} onCheckedChange={(v) => toggleCol('editedBy', !!v)}>Edited By</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.editDate} onCheckedChange={(v) => toggleCol('editDate', !!v)}>Edit Date</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={visibleCols.notes} onCheckedChange={(v) => toggleCol('notes', !!v)}>Notes</DropdownMenuCheckboxItem>
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
                                {visibleCols.date && <th className="p-3 font-semibold">Date of Entry</th>}
                                {visibleCols.project && <th className="p-3 font-semibold">Project/Task</th>}
                                {visibleCols.activity && <th className="p-3 font-semibold">Activity</th>}
                                {visibleCols.originalTime && <th className="p-3 font-semibold">Original</th>}
                                {visibleCols.editedTime && <th className="p-3 font-semibold">Edited</th>}
                                {visibleCols.action && <th className="p-3 font-semibold">Action</th>}
                                {visibleCols.editedBy && <th className="p-3 font-semibold">Edited By</th>}
                                {visibleCols.editDate && <th className="p-3 font-semibold">Edit Date</th>}
                                {visibleCols.notes && <th className="p-3 font-semibold">Notes</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-gray-500">
                                        No edits found.
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
                                        {visibleCols.date && <td className="p-4 text-gray-600 dark:text-gray-400">{format(new Date(row.date), 'MMM dd, yyyy')}</td>}
                                        {visibleCols.project && (
                                            <td className="p-4">
                                                <div className="font-medium text-gray-900 dark:text-gray-100">{row.project}</div>
                                                {row.task && <div className="text-xs text-gray-500 dark:text-gray-400">{row.task}</div>}
                                            </td>
                                        )}
                                        {visibleCols.activity && <td className="p-4 text-gray-500 dark:text-gray-400 font-mono">0%</td>}
                                        {visibleCols.originalTime && <td className="p-4 text-gray-500 dark:text-gray-400 font-mono">{row.originalTime || '-'}</td>}
                                        {visibleCols.editedTime && <td className="p-4 text-gray-900 dark:text-gray-100 font-mono font-medium">{row.editedTime}</td>}
                                        {visibleCols.action && <td className="p-4">{getActionBadge(row.action)}</td>}
                                        {visibleCols.editedBy && (
                                            <td className="p-4">
                                                {row.editedBy ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
                                                            {row.editedBy.charAt(0)}
                                                        </div>
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">{row.editedBy}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-600">-</span>
                                                )}
                                            </td>
                                        )}
                                        {visibleCols.editDate && <td className="p-4 text-gray-500 dark:text-gray-400 text-xs">{format(new Date(row.editDate), 'MMM dd, HH:mm')}</td>}
                                        {visibleCols.notes && <td className="p-4 text-gray-500 dark:text-gray-400 italic max-w-xs truncate" title={row.reason}>{row.reason}</td>}
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


            <ManualTimeEditsFilterSidebar
                open={filterSidebarOpen}
                onOpenChange={setFilterSidebarOpen}
                members={DUMMY_MEMBERS}
                projects={DUMMY_PROJECTS}
                onApply={setSidebarFilters}
            />
        </div >
    )
}
