"use client"

import { useState, useMemo } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_BREAKS, DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download, Settings, Search } from "lucide-react"
import { format } from "date-fns"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { useTimezone } from "@/components/providers/timezone-provider"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export default function WorkBreaksPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2026, 0, 19), // Jan 19, 2026
        endDate: new Date(2026, 0, 25)   // Jan 25, 2026
    })
    const [page, setPage] = useState(1)
    const pageSize = 10

    // Local Filters
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [policyFilter, setPolicyFilter] = useState("all")

    // Column Visibility State
    const [visibleColumns, setVisibleColumns] = useState({
        member: true,
        policy: true,
        status: true,
        started: true,
        ended: true,
        allotted: true,
        actual: true,
        paid: true,
        date: true,
        project: true
    })

    const filteredData = useMemo(() => {
        let data = DUMMY_BREAKS

        // Date Range
        if (dateRange.startDate && dateRange.endDate) {
            const startStr = format(dateRange.startDate, 'yyyy-MM-dd')
            const endStr = format(dateRange.endDate, 'yyyy-MM-dd')
            data = data.filter(item => item.date >= startStr && item.date <= endStr)
        }

        // Global Member/Team Filter (InsightsHeader)
        if (!selectedFilter.all && selectedFilter.id !== 'all') {
            if (selectedFilter.type === 'members') {
                data = data.filter(item => item.memberId === selectedFilter.id)
            }
        }

        // Search Query
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase()
            data = data.filter(item =>
                item.memberName.toLowerCase().includes(lowerQuery) ||
                (item.projectName && item.projectName.toLowerCase().includes(lowerQuery))
            )
        }

        // Status Filter
        if (statusFilter !== 'all') {
            data = data.filter(item => item.status && item.status.toLowerCase() === statusFilter.toLowerCase())
        }

        // Policy Filter
        if (policyFilter !== 'all') {
            data = data.filter(item => item.policy && item.policy === policyFilter)
        }

        return data
    }, [dateRange, selectedFilter, searchQuery, statusFilter, policyFilter])

    const paginatedItems = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredData.slice(start, start + pageSize)
    }, [filteredData, page])

    const totalPages = Math.ceil(filteredData.length / pageSize)

    // Summary calculation
    const totalDurationMinutes = useMemo(() => {
        return filteredData.reduce((sum, item) => sum + (item.actualDuration * 60), 0)
    }, [filteredData])

    const formatTotalDuration = (mins: number) => {
        const roundedMins = Math.round(mins)
        const h = Math.floor(roundedMins / 60)
        const m = roundedMins % 60
        return `${h}h ${m}m`
    }

    const handleExport = () => {
        const headers = ["Member", "Policy", "Status", "Started", "Ended", "Allotted (hrs)", "Actual (hrs)", "Paid (hrs)", "Date", "Project"]
        const csvContent = [
            headers.join(","),
            ...filteredData.map(item => [
                `"${item.memberName}"`,
                `"${item.policy || ''}"`,
                `"${item.status || ''}"`,
                `"${item.startTime}"`,
                `"${item.endTime}"`,
                item.allottedDuration,
                item.actualDuration,
                item.paidDuration,
                item.date,
                `"${item.projectName || ''}"`
            ].join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob)
            link.setAttribute("href", url)
            link.setAttribute("download", `work_breaks_${format(new Date(), 'yyyy-MM-dd')}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    // Unique Policies for Dropdown
    const policies = useMemo(() => {
        const unique = new Set(DUMMY_BREAKS.map(item => item.policy).filter(Boolean))
        return Array.from(unique)
    }, [])

    return (
        <div className="px-6 py-4">
            <h1 className="text-xl font-semibold mb-5">Break Report</h1>

            <InsightsHeader
                selectedFilter={selectedFilter}
                onSelectedFilterChange={setSelectedFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                members={DUMMY_MEMBERS}
                teams={DUMMY_TEAMS}
                timezone={timezone}
            >
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Table columns</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.member}
                                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, member: checked }))}
                            >
                                Member
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.policy}
                                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, policy: checked }))}
                            >
                                Policy
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.status}
                                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, status: checked }))}
                            >
                                Status
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.started}
                                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, started: checked }))}
                            >
                                Started
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.ended}
                                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, ended: checked }))}
                            >
                                Ended
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.allotted}
                                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, allotted: checked }))}
                            >
                                Allotted (hrs)
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.actual}
                                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, actual: checked }))}
                            >
                                Actual (hrs)
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.paid}
                                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, paid: checked }))}
                            >
                                Paid (hrs)
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.date}
                                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, date: checked }))}
                            >
                                Date
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={visibleColumns.project}
                                onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, project: checked }))}
                            >
                                Project
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" className="h-9" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </InsightsHeader>

            <style jsx global>{`
                html body .custom-hover-row:hover,
                html body .custom-hover-row:hover > td {
                    background-color: #d1d5db !important;
                }
            `}</style>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border rounded-lg p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Total Breaks</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{filteredData.length}</p>
                </div>
                <div className="bg-white border rounded-lg p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Total Duration</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{formatTotalDuration(totalDurationMinutes)}</p>
                </div>
            </div>

            <div className="mt-6 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
                <div className="p-4 border-b flex gap-4 flex-wrap bg-gray-50/50">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search member, project..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ps-9 pl-9 h-9"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 whitespace-nowrap">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border rounded-md px-3 py-1.5 text-sm bg-white h-9 focus:ring-2 focus:ring-black focus:outline-none"
                        >
                            <option value="all">All Status</option>
                            <option value="compliant">Compliant</option>
                            <option value="violation">Violation</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 whitespace-nowrap">Policy:</span>
                        <select
                            value={policyFilter}
                            onChange={(e) => setPolicyFilter(e.target.value)}
                            className="border rounded-md px-3 py-1.5 text-sm bg-white h-9 focus:ring-2 focus:ring-black focus:outline-none"
                        >
                            <option value="all">All Policies</option>
                            {policies.map(policy => (
                                <option key={policy} value={policy}>{policy}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                {visibleColumns.member && <th className="p-4 text-left">Member</th>}
                                {visibleColumns.policy && <th className="p-4">Policy</th>}
                                {visibleColumns.status && <th className="p-4">Status</th>}
                                {visibleColumns.started && <th className="p-4">Started</th>}
                                {visibleColumns.ended && <th className="p-4">Ended</th>}
                                {visibleColumns.allotted && <th className="p-4">Allotted (hrs)</th>}
                                {visibleColumns.actual && <th className="p-4">Actual (hrs)</th>}
                                {visibleColumns.paid && <th className="p-4">Paid (hrs)</th>}
                                {visibleColumns.date && <th className="p-4">Date</th>}
                                {visibleColumns.project && <th className="p-4 text-left">Project</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {paginatedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-gray-500">
                                        No breaks found for the selected criteria.
                                    </td>
                                </tr>
                            ) : (
                                paginatedItems.map((item, idx) => (
                                    <tr
                                        key={item.id}
                                        style={{ backgroundColor: idx % 2 === 1 ? '#f1f5f9' : '#ffffff' }}
                                        className="transition-colors custom-hover-row"
                                    >
                                        {visibleColumns.member && <td className="p-4 text-left font-medium text-gray-900">{item.memberName}</td>}
                                        {visibleColumns.policy && <td className="p-4 text-gray-600">{item.policy || '-'}</td>}
                                        {visibleColumns.status && (
                                            <td className="p-4">
                                                <span className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                                    item.status === 'Compliant' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                                )}>
                                                    {item.status || '-'}
                                                </span>
                                            </td>
                                        )}
                                        {visibleColumns.started && <td className="p-4 text-gray-600">{item.startTime}</td>}
                                        {visibleColumns.ended && <td className="p-4 text-gray-600">{item.endTime}</td>}
                                        {visibleColumns.allotted && <td className="p-4 text-gray-600">{item.allottedDuration}</td>}
                                        {visibleColumns.actual && <td className="p-4 font-medium text-gray-900">{item.actualDuration}</td>}
                                        {visibleColumns.paid && <td className="p-4 text-gray-600">{item.paidDuration}</td>}
                                        {visibleColumns.date && <td className="p-4 text-gray-600">{item.date}</td>}
                                        {visibleColumns.project && <td className="p-4 text-left text-gray-600">{item.projectName || '-'}</td>}
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
                    onPageSizeChange={() => { }}
                    className="bg-transparent shadow-none border-none p-0"
                />
            </div>
        </div>
    )
}
