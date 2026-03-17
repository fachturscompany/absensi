"use client"

import { useState, useMemo, Fragment } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_WORK_SESSIONS, DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download, Search, SlidersHorizontal, Clock, Coffee, Activity } from "lucide-react"
import { format } from "date-fns"
import { formatHoursForExport } from "@/lib/export-utils"
import { useTimezone } from "@/components/providers/timezone-provider"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts"

export default function WorkSessionsPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({
        type: "members",
        all: true,
        id: "all"
    })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2026, 0, 20),
        endDate: new Date(2026, 0, 22)
    })
    const [searchQuery, setSearchQuery] = useState("")

    // Filter data
    const filteredData = useMemo(() => {
        let data = DUMMY_WORK_SESSIONS || []

        // Filter by date range
        if (dateRange.startDate && dateRange.endDate) {
            const startStr = format(dateRange.startDate, 'yyyy-MM-dd')
            const endStr = format(dateRange.endDate, 'yyyy-MM-dd')
            data = data.filter(item => item.date >= startStr && item.date <= endStr)
        }

        // Filter by member/team
        if (!selectedFilter.all && selectedFilter.id !== 'all') {
            if (selectedFilter.type === 'members') {
                data = data.filter(item => item.memberId === selectedFilter.id)
            } else if (selectedFilter.type === 'teams') {
                const team = DUMMY_TEAMS.find(t => t.id === selectedFilter.id)
                if (team) {
                    data = data.filter(item => team.members.includes(item.memberId))
                }
            }
        }

        // Search filter
        const q = searchQuery.trim().toLowerCase()
        if (q) {
            data = data.filter(item => {
                const haystack = [
                    item.memberName || '',
                    item.projectName || '',
                    item.clientName || '',
                    item.todo || '',
                    item.session || '',
                    item.startTime || '',
                    item.endTime || '',
                    // tanggal terformat untuk pencarian seperti "21 Jan"
                    format(new Date(item.date), 'dd MMM yyyy')
                ].join(' ').toLowerCase()
                return haystack.includes(q)
            })
        }

        return data
    }, [dateRange, selectedFilter, searchQuery])

    // Summary calculations
    const summary = useMemo(() => {
        const totalMinutes = filteredData.reduce((sum, s) => sum + s.duration, 0)
        const avgActivity = filteredData.length > 0
            ? Math.round(filteredData.reduce((sum, s) => sum + (s.activityPercentage || 0), 0) / filteredData.length)
            : 0

        return {
            totalTime: formatHoursForExport(totalMinutes / 60),
            breakTime: '—', // Placeholder per design
            avgActivity: avgActivity + '%'
        }
    }, [filteredData])

    // Chart Data (Group by Date)
    const chartData = useMemo(() => {
        const days: Record<string, number> = {}
        if (dateRange.startDate && dateRange.endDate) {
            const curr = new Date(dateRange.startDate)
            const end = new Date(dateRange.endDate)
            while (curr <= end) {
                const dateStr = format(curr, 'yyyy-MM-dd')
                days[dateStr] = 0
                curr.setDate(curr.getDate() + 1)
            }
        }

        filteredData.forEach(item => {
            days[item.date] = (days[item.date] ?? 0) + item.duration / 60
        })

        return Object.entries(days).map(([date, hours]) => ({
            date: format(new Date(date), 'dd MMM'), // Simplified date axis
            hours
        }))
    }, [filteredData, dateRange])

    // Grouping by Date for Table
    const groupedData = useMemo(() => {
        const groups: Record<string, typeof filteredData> = {}
        filteredData.forEach(item => {
            (groups[item.date] ??= []).push(item)
        })
        // Sort dates descending
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
    }, [filteredData])

    // Column visibility state
    const [visibleCols, setVisibleCols] = useState({
        client: true,
        project: true,
        member: true,
        todo: true,
        manual: true,
        started: true,
        stopped: true,
        duration: true,
        activity: true,
    })

    const toggleCol = (key: keyof typeof visibleCols, value: boolean) => {
        setVisibleCols((prev) => ({ ...prev, [key]: value }))
    }

    const handleExport = () => {
        console.log('Exporting work sessions data...')
    }

    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
            <style jsx global>{`
                html body .custom-hover-row:hover,
                html body .custom-hover-row:hover > td {
                    background-color: #f9fafb !important;
                }
            `}</style>

            <div className="sticky top-0 z-20 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                <div className="px-6 py-4">
                    <h1 className="text-xl font-semibold mb-5 text-gray-700">Work sessions report</h1>

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
                            <Button
                                className="h-9 bg-gray-900 hover:bg-gray-800 text-white font-medium"
                                onClick={handleExport}
                            >
                                <Download className="w-4 h-4 mr-2" /> Export
                            </Button>
                        </div>
                    </InsightsHeader>
                </div>
            </div>

            <main className="flex-1 bg-gray-50/50 p-6">

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Time Card */}
                    <div className="bg-white dark:bg-gray-950 p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col justify-between h-24 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3 relative z-10">
                            <div className="p-2 bg-gray-50 rounded-md">
                                <Clock className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total time</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">{summary.totalTime}</p>
                            </div>
                        </div>
                    </div>

                    {/* Break Time Card */}
                    <div className="bg-white dark:bg-gray-950 p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col justify-between h-24 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3 relative z-10">
                            <div className="p-2 bg-gray-50 rounded-md">
                                <Coffee className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Break time</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">{summary.breakTime}</p>
                            </div>
                        </div>
                    </div>

                    {/* Avg Activity Card */}
                    <div className="bg-white dark:bg-gray-950 p-4 rounded-lg border border-gray-200 dark:border-gray-800 flex flex-col justify-between h-24 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3 relative z-10">
                            <div className="p-2 bg-gray-50 rounded-md">
                                <Activity className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Average activity</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">{summary.avgActivity}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white dark:bg-gray-950 p-6 rounded-lg border border-gray-200 dark:border-gray-800 mb-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-700">Chart</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase">Data grouped by</span>
                            {/* Mock Select for visual consistency */}
                            <div className="h-8 px-3 py-1 bg-gray-100 rounded text-xs text-gray-600 font-medium flex items-center">
                                Date per day
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="date"
                                    hide={false}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                    dy={10}
                                />
                                <YAxis
                                    hide={false}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                                    {chartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill="#9CA3AF" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-700">Table</h2>
                        <div className="flex items-center gap-2">
                            {/* Search within table header like some other reports or just columns */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                <Input
                                    className="h-8 ps-8 pl-8 w-[200px] text-xs"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900">
                                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                                        Columns
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuCheckboxItem checked={visibleCols.client} onCheckedChange={(v) => toggleCol('client', !!v)}>Client</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={visibleCols.project} onCheckedChange={(v) => toggleCol('project', !!v)}>Project</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={visibleCols.member} onCheckedChange={(v) => toggleCol('member', !!v)}>Member</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={visibleCols.todo} onCheckedChange={(v) => toggleCol('todo', !!v)}>Tasks</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={visibleCols.manual} onCheckedChange={(v) => toggleCol('manual', !!v)}>Manual</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={visibleCols.started} onCheckedChange={(v) => toggleCol('started', !!v)}>Started</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={visibleCols.stopped} onCheckedChange={(v) => toggleCol('stopped', !!v)}>Stopped</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={visibleCols.duration} onCheckedChange={(v) => toggleCol('duration', !!v)}>Duration</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={visibleCols.activity} onCheckedChange={(v) => toggleCol('activity', !!v)}>Activity</DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                            <tr>
                                {visibleCols.client && <th className="p-4 w-[10%]">Client</th>}
                                {visibleCols.project && <th className="p-4 w-[15%]">Project</th>}
                                {visibleCols.member && <th className="p-4 w-[15%]">Member</th>}
                                {visibleCols.todo && <th className="p-4 w-[15%]">Tasks</th>}
                                {visibleCols.manual && <th className="p-4 text-right w-[5%]">Manual</th>}
                                {visibleCols.started && <th className="p-4 text-right w-[10%]">Started</th>}
                                {visibleCols.stopped && <th className="p-4 text-right w-[10%]">Stopped</th>}
                                {visibleCols.duration && <th className="p-4 text-right w-[10%]">Duration</th>}
                                {visibleCols.activity && <th className="p-4 text-right w-[10%]">Activity</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {groupedData.map(([date, dateItems]) => (
                                <Fragment key={date}>
                                    {/* Group Header */}
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <td colSpan={Object.values(visibleCols).filter(Boolean).length} className="px-4 py-2 font-semibold text-gray-700">
                                            {format(new Date(date), "EEE, MMM dd, yyyy")}
                                        </td>
                                    </tr>
                                    {/* Items */}
                                    {dateItems.map((item) => {
                                        const hours = Math.floor(item.duration / 60)
                                        const minutes = Math.floor(item.duration % 60)
                                        const seconds = Math.floor((item.duration * 60) % 60)
                                        const formattedDuration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors custom-hover-row text-gray-600">
                                                {visibleCols.client && <td className="p-4">{item.clientName || 'No client'}</td>}
                                                {visibleCols.project && <td className="p-4"><span className="font-medium text-gray-700">{item.projectName}</span></td>}
                                                {visibleCols.member && <td className="p-4">{item.memberName}</td>}
                                                {visibleCols.todo && <td className="p-4 text-gray-500">{item.todo || ''}</td>}
                                                {visibleCols.manual && <td className="p-4 text-right">{item.manualPercentage}%</td>}
                                                {visibleCols.started && <td className="p-4 text-right">{item.startTime}</td>}
                                                {visibleCols.stopped && <td className="p-4 text-right">{item.endTime}</td>}
                                                {visibleCols.duration && <td className="p-4 text-right font-medium text-gray-900">{formattedDuration}</td>}
                                                {visibleCols.activity && <td className="p-4 text-right">{item.activityPercentage}%</td>}
                                            </tr>
                                        )
                                    })}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>

                </div>

                <div className="mt-4">
                    <PaginationFooter
                        page={1}
                        totalPages={1}
                        onPageChange={() => { }}
                        from={1}
                        to={filteredData.length}
                        total={filteredData.length}
                        pageSize={10}
                        onPageSizeChange={() => { }}
                        className="bg-transparent border-none p-0"
                    />
                </div>
            </main>
        </div>
    )
}
