"use client"

import { useState, useEffect } from "react"
import { columns } from "./columns"
import { DUMMY_DAILY_LIMITS } from "@/lib/data/dummy-daily-limits"
import { DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { DataTable } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { useTimezone } from "@/components/providers/timezone-provider"
import { DailyLimitsFilterSidebar } from "@/components/report/DailyLimitsFilterSidebar"
import { Input } from "@/components/ui/input"
import { Filter, Search, Download, Settings2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { VisibilityState } from "@tanstack/react-table"

export default function DailyLimitsPage() {
    const timezone = useTimezone()
    const [filterSidebarOpen, setFilterSidebarOpen] = useState(false)
    const [sidebarFilters, setSidebarFilters] = useState({
        role: "all",
        status: "all",
        day: "today"
    })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(),
        endDate: new Date()
    })
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })

    const [data] = useState(DUMMY_DAILY_LIMITS)
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    // Simulate loading
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false)
        }, 1000)
        return () => clearTimeout(timer)
    }, [])

    // Filter Logic
    const filteredData = data.filter((item) => {
        const matchesRole = sidebarFilters.role === "all" || item.role === sidebarFilters.role
        const matchesStatus = sidebarFilters.status === "all" ||
            (sidebarFilters.status === "exceeded" && item.status === "Exceeded") ||
            (sidebarFilters.status === "approaching" && item.status === "Approaching Limit") ||
            (sidebarFilters.status === "within" && item.status === "Within Limit")

        const matchesMember = selectedFilter.all || item.memberId === selectedFilter.id



        const matchesSearch = item.memberName.toLowerCase().includes(searchQuery.toLowerCase())

        const itemDateObj = new Date(item.date)
        itemDateObj.setHours(0, 0, 0, 0)

        const start = new Date(dateRange.startDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(dateRange.endDate)
        end.setHours(23, 59, 59, 999)

        const matchesDateRange = itemDateObj >= start && itemDateObj <= end

        return matchesRole && matchesStatus && matchesSearch && matchesMember && matchesDateRange
    })

    // Handlers
    const handleApplyFilters = (filters: typeof sidebarFilters) => {
        setSidebarFilters(filters)
        setFilterSidebarOpen(false)
        console.log("Filters applied:", filters)
    }

    const handleExport = () => {
        const headers = ["Member,Role,Daily Limit,Time Spent,Remaining,Status,Date"]
        const rows = filteredData.map(item => {
            const remaining = item.dailyLimit - item.hoursTracked
            return [
                item.memberName,
                item.role,
                item.dailyLimit,
                item.hoursTracked.toFixed(2),
                remaining.toFixed(2),
                item.status,
                item.date
            ].join(",")
        })

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "daily_limits_report.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="px-6 pb-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold">Daily Limits Report</h1>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 ps-9 h-9 bg-white dark:bg-gray-950 dark:border-gray-800 dark:text-gray-200"
                        />
                    </div>
                </div>
            </div>

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
                    <Button
                        variant="outline"
                        className="h-9 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 font-medium"
                        onClick={() => setFilterSidebarOpen(true)}
                    >
                        <Filter className="w-4 h-4 mr-2" /> Filter
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9 bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300">
                                <Settings2 className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                            {columns
                                .map((col) => {
                                    const id = col.id || (col as any).accessorKey
                                    const label = {
                                        memberName: "Member",
                                        role: "Role",
                                        dailyLimit: "Daily Limit",
                                        hoursTracked: "Time spent",
                                        percentageUsed: "Percentage used",
                                        remaining: "Remaining",
                                        status: "Status",
                                        date: "Date"
                                    }[id as string] || id

                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={id}
                                            className="capitalize"
                                            checked={columnVisibility[id] !== false}
                                            onCheckedChange={(value) =>
                                                setColumnVisibility((prev) => ({
                                                    ...prev,
                                                    [id]: !!value,
                                                }))
                                            }
                                        >
                                            {label}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" className="h-9" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                </div>
            </InsightsHeader>

            {/* Main Table */}
            <DataTable
                columns={columns}
                data={filteredData}
                isLoading={isLoading}
                showColumnToggle={false}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={setColumnVisibility}
            />

            <DailyLimitsFilterSidebar
                open={filterSidebarOpen}
                onOpenChange={setFilterSidebarOpen}
                onApply={handleApplyFilters}
            />
        </div>
    )
}
