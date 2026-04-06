"use client"

import React, { useState, useMemo, useEffect } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_SHIFT_ATTENDANCE } from "@/lib/data/dummy-data"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { Button } from "@/components/ui/button"
import { Download, SlidersHorizontal, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTimezone } from "@/components/providers/timezone-provider"
import { exportToCSV, generateFilename } from "@/lib/export-utils"
import { format } from "date-fns"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const statusLabels: Record<string, { label: string; color: string }> = {
    completed: { label: 'Completed', color: 'bg-slate-100 text-green-800' },
    late: { label: 'Late', color: 'bg-yellow-100 text-yellow-800' },
    early_leave: { label: 'Early Leave', color: 'bg-slate-100 text-orange-800' },
    missed: { label: 'Missed', color: 'bg-red-100 text-red-800' },
    upcoming: { label: 'Upcoming', color: 'bg-slate-100 text-blue-800' },
}

const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return '-'
    const [startH = 0, startM = 0] = start.split(':').map(Number)
    const [endH = 0, endM = 0] = end.split(':').map(Number)

    let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM)
    if (diffMinutes < 0) diffMinutes += 24 * 60 // Handle overnight shifts if necessary

    const h = Math.floor(diffMinutes / 60)
    const m = diffMinutes % 60

    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
}

export default function ShiftAttendancePage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(),
        endDate: new Date()
    })

    const [statusFilter, setStatusFilter] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [visibleCols, setVisibleCols] = useState({
        member: true,
        date: true,
        time: true,
        hours: true,
        status: true,
        notes: true,
    })

    useEffect(() => {
        setDateRange({
            startDate: new Date(2026, 0, 1),
            endDate: new Date(2026, 0, 31)
        })
    }, [])

    const toggleCol = (key: keyof typeof visibleCols, value: boolean) => {
        setVisibleCols((prev) => ({ ...prev, [key]: value }))
    }

    const filteredData = useMemo(() => {
        return DUMMY_SHIFT_ATTENDANCE.filter(item => {
            if (!selectedFilter.all && selectedFilter.id !== 'all') {
                if (selectedFilter.type === 'members') {
                    if (item.memberId !== selectedFilter.id) return false
                } else if (selectedFilter.type === 'teams') {
                    const team = DUMMY_TEAMS.find(t => t.id === selectedFilter.id)
                    if (!team || !team.members.includes(item.memberId)) return false
                }
            }

            if (statusFilter !== 'all' && item.status !== statusFilter) return false

            if (dateRange.startDate && dateRange.endDate) {
                const shiftDate = new Date(item.shiftDate)
                if (shiftDate < dateRange.startDate || shiftDate > dateRange.endDate) return false
            }

            if (searchQuery) {
                const lower = searchQuery.toLowerCase()
                if (!item.memberName.toLowerCase().includes(lower)) return false
            }

            return true
        })
    }, [selectedFilter, statusFilter, dateRange, searchQuery])

    const stats = useMemo(() => {
        const total = filteredData.length
        const completed = filteredData.filter(s => s.status === 'completed').length
        const late = filteredData.filter(s => s.status === 'late').length
        const missed = filteredData.filter(s => s.status === 'missed').length

        return { total, completed, late, missed }
    }, [filteredData])

    const totalPages = Math.ceil(filteredData.length / pageSize)
    const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize)

    const handleExport = () => {
        exportToCSV({
            filename: generateFilename('shift-attendance'),
            columns: [
                { key: 'memberName', label: 'Member' },
                { key: 'shiftDate', label: 'Date' },
                { key: 'scheduledStart', label: 'Scheduled Start' },
                { key: 'scheduledEnd', label: 'Scheduled End' },
                { key: 'actualStart', label: 'Actual Start' },
                { key: 'actualEnd', label: 'Actual End' },
                { key: 'status', label: 'Status' }
            ],
            data: filteredData
        })
        toast.success("Exported successfully")
    }

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <style jsx global>{`
                html body .custom-hover-row:hover,
                html body .custom-hover-row:hover > td {
                    background-color: #f9fafb !important;
                }
            `}</style>
            <div className="sticky z-20 bg-white">
                <div className="px-6">
                    <h1 className="text-xl font-semibold mb-5">Shift Attendance Report</h1>

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
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search member..."
                                    className="ps-9 pl-9 h-9 bg-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[150px] h-9 bg-white border-gray-300">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    {Object.entries(statusLabels).map(([val, { label }]) => (
                                        <SelectItem key={val} value={val}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 bg-white">
                                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                                        Columns
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuCheckboxItem checked={visibleCols.member} onCheckedChange={(v) => toggleCol('member', !!v)}>Member</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={visibleCols.date} onCheckedChange={(v) => toggleCol('date', !!v)}>Date</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={visibleCols.time} onCheckedChange={(v) => toggleCol('time', !!v)}>Time (Start/End)</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={visibleCols.hours} onCheckedChange={(v) => toggleCol('hours', !!v)}>Hours</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={visibleCols.status} onCheckedChange={(v) => toggleCol('status', !!v)}>Status</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={visibleCols.notes} onCheckedChange={(v) => toggleCol('notes', !!v)}>Notes</DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button variant="outline" className="h-9" onClick={handleExport}>
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </InsightsHeader>
                </div>
            </div>

            <main className="flex-1 bg-gray-50/50 p-6">

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x border rounded-lg shadow-sm bg-white mb-6">
                    {[
                        { label: "Total Shifts", value: stats.total, color: "text-gray-900" },
                        { label: "Completed", value: stats.completed, color: "text-gray-600" },
                        { label: "Late", value: stats.late, color: "text-gray-600" },
                        { label: "Missed", value: stats.missed, color: "text-gray-600" },
                    ].map((card, idx) => (
                        <div key={idx} className="p-4">
                            <p className="text-sm font-medium text-gray-500">{card.label}</p>
                            <p className={cn("text-2xl font-bold mt-1", card.color)}>
                                {card.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                {visibleCols.member && <th className="p-4 font-semibold">Member</th>}
                                {visibleCols.date && <th className="p-4 font-semibold">Shift Date</th>}
                                {visibleCols.time && <th className="p-4 font-semibold">Scheduled / Actual Time</th>}
                                {visibleCols.hours && <th className="p-4 font-semibold">Hours (Sch / Act)</th>}
                                {visibleCols.status && <th className="p-4 font-semibold text-center">Status</th>}
                                {visibleCols.notes && <th className="p-4 font-semibold">Notes</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No shifts found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors custom-hover-row">
                                        {visibleCols.member && (
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                                                        {row.memberName.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-gray-900">{row.memberName}</span>
                                                </div>
                                            </td>
                                        )}
                                        {visibleCols.date && <td className="p-4 text-gray-600 font-medium">{format(new Date(row.shiftDate), 'MMM dd, yyyy')}</td>}
                                        {visibleCols.time && (
                                            <td className="p-4">
                                                <div className="text-xs text-gray-500 mb-1">Sch: <span className="text-gray-900 font-mono">{row.scheduledStart} - {row.scheduledEnd}</span></div>
                                                <div className="text-xs text-gray-500">Act: <span className="text-gray-900 font-mono">{row.actualStart || '--:--'} - {row.actualEnd || '--:--'}</span></div>
                                            </td>
                                        )}
                                        {visibleCols.hours && (
                                            <td className="p-4">
                                                <div className="text-xs text-gray-500 mb-1">Sch: <span className="text-gray-900 font-medium">{calculateDuration(row.scheduledStart, row.scheduledEnd)}</span></div>
                                                <div className="text-xs text-gray-500">Act: <span className="text-gray-900 font-medium">{row.actualStart && row.actualEnd ? calculateDuration(row.actualStart, row.actualEnd) : '-'}</span></div>
                                            </td>
                                        )}
                                        {visibleCols.status && (
                                            <td className="p-4 text-center">
                                                {statusLabels[row.status] ? (
                                                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", statusLabels[row.status]?.color)}>
                                                        {statusLabels[row.status]?.label}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500">{row.status}</span>
                                                )}
                                                {row.lateMinutes ? (
                                                    <div className="text-xs text-red-600 mt-1">{row.lateMinutes}m late</div>
                                                ) : null}
                                            </td>
                                        )}
                                        {visibleCols.notes && (
                                            <td className="p-4 text-gray-500 text-xs italic">
                                                {row.status === 'late' ? 'Traffic delay' : row.status === 'missed' ? 'Sick leave' : '-'}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
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
                        className="mt-5"
                    />
                </div>
            </main>
        </div>
    )
}
