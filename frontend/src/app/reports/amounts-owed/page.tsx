"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, SlidersHorizontal, Send, Calendar as CalendarIcon } from "lucide-react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { exportToCSV, generateFilename, formatCurrencyForExport, formatHoursForExport } from "@/lib/export-utils"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { toast } from "sonner"
import { DUMMY_AMOUNTS_OWED, DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { useTimezone } from "@/components/providers/timezone-provider"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts"
import { format } from "date-fns"

export default function AmountsOwedPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2025, 11, 29),
        endDate: new Date(2026, 0, 29),
    })

    const [visibleCols, setVisibleCols] = useState({
        member: true,
        currentRate: true,
        totalHours: true,
        amount: true,
    })

    const toggleCol = (key: keyof typeof visibleCols, value: boolean) => {
        setVisibleCols(prev => ({ ...prev, [key]: value }))
    }

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Filter Logic
    const filteredData = useMemo(() => {
        let data = DUMMY_AMOUNTS_OWED

        // Member/Team Filter
        if (!selectedFilter.all && selectedFilter.id !== 'all') {
            if (selectedFilter.type === 'members') {
                data = data.filter(item => item.name === DUMMY_MEMBERS.find(m => m.id === selectedFilter.id)?.name)
            } else if (selectedFilter.type === 'teams') {
                // Simplified matching for dummy data
                data = data.filter(item => item.team === DUMMY_TEAMS.find(t => t.id === selectedFilter.id)?.name)
            }
        }

        // Search Filter (if implemented)

        return data
    }, [selectedFilter])

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize
        return filteredData.slice(start, start + pageSize)
    }, [filteredData, page, pageSize])

    const totalPages = Math.ceil(filteredData.length / pageSize)

    // Grouping for Chart (Daily data)
    const chartData = useMemo(() => {
        const days: { date: string; amount: number }[] = []
        if (dateRange.startDate && dateRange.endDate) {
            const curr = new Date(dateRange.startDate)
            const end = new Date(dateRange.endDate)

            // Map of date string to total amount
            const amountsByDate: Record<string, number> = {}
            filteredData.forEach(item => {
                // Mock: distribute amount randomly across the date range for demo purposes
                // creating a pseudo-deterministic distribution based on name length
                const daysInRange = Math.floor((end.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24))
                const offset = item.name.length % (daysInRange + 1)
                const date = new Date(curr)
                date.setDate(date.getDate() + offset)
                const key = format(date, 'MMM dd')
                amountsByDate[key] = (amountsByDate[key] || 0) + (item.amountOwed / 5) // Split amount for smoother chart
            })

            while (curr <= end) {
                const dateStr = format(curr, 'MMM dd')
                days.push({
                    date: dateStr,
                    amount: amountsByDate[dateStr] || 0
                })
                curr.setDate(curr.getDate() + 1)
            }
        }
        return days
    }, [dateRange, filteredData])

    const totalOwed = filteredData.reduce((sum, item) => sum + item.amountOwed, 0)
    const totalHours = filteredData.reduce((sum, item) => sum + item.totalHours, 0)

    // Avoid hydration mismatch: compute today's string on client only
    const [todayStr, setTodayStr] = useState<string>("")
    useEffect(() => {
        setTodayStr(format(new Date(), "EEE, MMM dd, yyyy"))
    }, [])

    // Handlers
    const handleExport = () => {
        exportToCSV({
            filename: generateFilename('amounts-owed'),
            columns: [
                { key: 'name', label: 'Member' },
                { key: 'team', label: 'Team' },
                { key: 'hourlyRate', label: 'Hourly Rate', format: (v) => formatCurrencyForExport(v) },
                { key: 'totalHours', label: 'Total Hours', format: (v) => formatHoursForExport(v) },
                { key: 'amountOwed', label: 'Amount Owed', format: (v) => formatCurrencyForExport(v) },
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

            <div className="sticky top-0 z-20 border-b border-gray-200 bg-white">
                <div className="px-6 py-4">
                    <h1 className="text-xl font-semibold mb-5">Amounts owed report</h1>

                    <InsightsHeader
                        selectedFilter={selectedFilter}
                        onSelectedFilterChange={setSelectedFilter}
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                        members={DUMMY_MEMBERS}
                        teams={DUMMY_TEAMS}
                        timezone={timezone}
                    >
                        <div className="flex items-center gap-2 ml-2">
                            <Button variant="outline" className="h-9 text-gray-700">
                                <Send className="w-4 h-4 mr-2" /> Send
                            </Button>
                            <Button variant="outline" className="h-9 text-gray-700">
                                <CalendarIcon className="w-4 h-4 mr-2" /> Schedule
                            </Button>
                            <Button variant="outline" className="h-9 text-white bg-gray-900 hover:bg-gray-900 hover:text-white hover:cursor-pointer" onClick={handleExport}>
                                <Download className="w-4 h-4 mr-2" /> Export
                            </Button>
                        </div>
                    </InsightsHeader>
                </div>
            </div>

            <main className="flex-1 bg-gray-50/50 p-6">

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">HOURS</p>
                        <p className="text-3xl font-medium text-gray-800">{formatHoursForExport(totalHours)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">AMOUNT</p>
                            <p className="text-3xl font-medium text-gray-800">
                                {totalOwed > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalOwed) : '—'}
                            </p>
                        </div>
                        <div className="h-10 w-10 bg-[#2196F3] rounded flex items-center justify-center">
                            <span className="text-white font-bold text-xl">$</span>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                {/* Chart */}
                <div className="bg-white p-6 rounded-lg border border-gray-900 shadow-sm mb-6">
                    <p className="font-semibold text-gray-800 mb-4">Total amount per day</p>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#6B7280"
                                    strokeWidth={2}
                                    dot={{ fill: '#6B7280', r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Table Header Controls */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-800">
                        {selectedFilter.type === 'members' && !selectedFilter.all
                            ? DUMMY_MEMBERS.find(m => m.id === selectedFilter.id)?.name
                            : selectedFilter.type === 'teams' && !selectedFilter.all
                                ? DUMMY_TEAMS.find(t => t.id === selectedFilter.id)?.name
                                : "All Members"}
                        <span className="text-gray-400 text-sm font-normal ml-2">{timezone}</span>
                    </h2>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 h-8 text-sm px-3 border-l ml-1 rounded-none">
                                    <SlidersHorizontal className="w-4 h-4 mr-2" /> Columns
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuCheckboxItem checked={visibleCols.member} onCheckedChange={(v) => toggleCol('member', !!v)}>Member</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={visibleCols.currentRate} onCheckedChange={(v) => toggleCol('currentRate', !!v)}>Current rate</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={visibleCols.totalHours} onCheckedChange={(v) => toggleCol('totalHours', !!v)}>Total hours</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={visibleCols.amount} onCheckedChange={(v) => toggleCol('amount', !!v)}>Amount</DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
                    <div className="bg-gray-50 px-4 py-2 border-b font-medium text-sm text-gray-900">
                        <span suppressHydrationWarning>{todayStr}</span>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-800">
                            <tr>
                                {visibleCols.member && <th className="p-4 font-semibold">Member</th>}
                                {visibleCols.currentRate && <th className="p-4 font-semibold text-right">Current rate</th>}
                                {visibleCols.totalHours && <th className="p-4 font-semibold text-right">Total hours</th>}
                                {visibleCols.amount && <th className="p-4 font-semibold text-right">Amount</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {paginatedData.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors custom-hover-row">
                                    {visibleCols.member && (
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200">
                                                    {item.name.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-700">{item.name}</span>
                                            </div>
                                        </td>
                                    )}
                                    {visibleCols.currentRate && (
                                        <td className="p-4 text-right text-gray-500">
                                            {item.hourlyRate > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.hourlyRate) + '/hr' : 'No rate set'}
                                        </td>
                                    )}
                                    {visibleCols.totalHours && (
                                        <td className="p-4 text-right text-gray-700">{formatHoursForExport(item.totalHours)}</td>
                                    )}
                                    {visibleCols.amount && (
                                        <td className="p-4 text-right text-gray-900 font-medium">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.amountOwed)}
                                        </td>
                                    )}
                                </tr>
                            ))}

                            {/* Total Row */}
                            <tr className="bg-white font-semibold border-t">
                                {visibleCols.member && <td className="p-4 text-gray-900">Total</td>}
                                {visibleCols.currentRate && <td className="p-4"></td>}
                                {visibleCols.totalHours && <td className="p-4 text-right text-gray-900">{formatHoursForExport(totalHours)}</td>}
                                {visibleCols.amount && <td className="p-4 text-right text-gray-900">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalOwed)}</td>}
                            </tr>
                        </tbody>
                    </table>
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
                        className="bg-transparent shadow-none border-none p-0"
                    />
                </div>

            </main>
        </div>
    )
}
