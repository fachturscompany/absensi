"use client"

import { useState, useEffect } from "react"
import { columns } from "./columns"
import { DUMMY_CLIENT_BUDGETS, ClientBudgetEntry } from "@/lib/data/dummy-client-budgets"
import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_CLIENTS } from "@/lib/data/dummy-data"
import { DataTable } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { useTimezone } from "@/components/providers/timezone-provider"
import { ClientBudgetsFilterSidebar } from "@/components/report/ClientBudgetsFilterSidebar"
import { Input } from "@/components/ui/input"
import { Filter, Search, Download, Settings2, Layers } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { VisibilityState } from "@tanstack/react-table"


type GroupByOption = "none" | "member" | "month"

export default function ClientBudgetsPage() {
    const timezone = useTimezone()
    const [filterSidebarOpen, setFilterSidebarOpen] = useState(false)
    const [sidebarFilters, setSidebarFilters] = useState({
        client: "all",
        budgetType: "all"
    })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(),
        endDate: new Date()
    })
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [groupBy, setGroupBy] = useState<GroupByOption>("none")

    const [data] = useState(DUMMY_CLIENT_BUDGETS)
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
    // State for client-side simulated data to prevent hydration mismatch
    const [filteredData, setFilteredData] = useState<ClientBudgetEntry[]>(data)

    // Update derived data in useEffect (Client Only)
    useEffect(() => {
        const now = new Date()

        const transformedData = data.map(item => {
            // Simulation Logic: 
            // We assume the DUMMY_CLIENT_BUDGETS represent the TOTAL budget/usage.
            // When a date range is selected, we scale the "Time Tracked" and "Cost Incurred"
            // based on the proportion of the range overlap against a hypothetical "Year".
            // Implementation similar to Project Budgets but simplified since Clients don't have explicit start/end dates in this view.

            const client = DUMMY_CLIENTS.find(c => c.name === item.clientName)
            // If client has createdAt, use it. Otherwise assume generic start.
            const created = client ? new Date(client.createdAt) : new Date(now.getFullYear(), 0, 1)

            const rangeStart = new Date(dateRange.startDate)
            const rangeEnd = new Date(dateRange.endDate)
            rangeEnd.setHours(23, 59, 59, 999)

            // Calculate overlap between "Client Active Period" vs "Selected Range"
            // For demo purposes, we treat "Client Active" as "Created -> Now"
            const activeEnd = new Date(now)
            const activeStart = created
            const totalDuration = activeEnd.getTime() - activeStart.getTime()

            const overlapStart = new Date(Math.max(activeStart.getTime(), rangeStart.getTime()))
            const overlapEnd = new Date(Math.min(activeEnd.getTime(), rangeEnd.getTime()))

            let ratio = 1
            if (overlapStart < overlapEnd && totalDuration > 0) {
                const overlapDuration = overlapEnd.getTime() - overlapStart.getTime()
                ratio = overlapDuration / totalDuration
            } else {
                ratio = 0
            }

            // Apply ratio to usage stats
            const newTime = item.timeTracked * ratio
            const newCost = item.costIncurred * ratio

            // Recalc status
            let newStatus: ClientBudgetEntry['status'] = 'Within Budget'
            const limit = item.budgetTotal
            const used = item.budgetType === 'cost' ? newCost : newTime
            const pct = limit > 0 ? (used / limit) * 100 : 0

            if (pct > 100) newStatus = 'Exceeded'
            else if (pct > 80) newStatus = 'Approaching Limit'

            return {
                ...item,
                timeTracked: newTime,
                costIncurred: newCost,
                status: newStatus
            }
        }).filter((item): item is ClientBudgetEntry => {
            if (!item) return false
            const matchesClient = sidebarFilters.client === "all" || item.clientName === sidebarFilters.client
            const matchesType = sidebarFilters.budgetType === "all" || item.budgetType === sidebarFilters.budgetType
            const matchesSearch = item.clientName.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesClient && matchesType && matchesSearch
        })

        setFilteredData(transformedData)
    }, [data, sidebarFilters, dateRange, searchQuery])


    // Grouping Logic
    const groupedData = (() => {
        if (groupBy === "none") return null

        // Group by Member (Mock implementation since we don't have member data in this flat view)
        // Group by Month (Dynamic)

        if (groupBy === 'month') {
            // Dynamically generate months based on the selected dateRange
            const months: string[] = []
            const start = new Date(dateRange.startDate)
            const end = new Date(dateRange.endDate)

            const current = new Date(start)
            current.setDate(1)

            while (current <= end) {
                const monthStr = current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                if (!months.includes(monthStr)) {
                    months.push(monthStr)
                }
                current.setMonth(current.getMonth() + 1)
            }

            if (months.length === 0) {
                months.push(start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
            }

            const monthGroups: Record<string, ClientBudgetEntry[]> = {}
            months.forEach(m => {
                const splitFactor = (1 / months.length)
                monthGroups[m] = filteredData.map(p => ({
                    ...p,
                    timeTracked: p.timeTracked * (splitFactor * (0.8 + Math.random() * 0.4)),
                    costIncurred: p.costIncurred * (splitFactor * (0.8 + Math.random() * 0.4))
                }))
            })
            return monthGroups
        }

        // Placeholder for future grouping
        return {} as Record<string, ClientBudgetEntry[]>
    })()

    const handleApplyFilters = (filters: typeof sidebarFilters) => {
        setSidebarFilters(filters)
        setFilterSidebarOpen(false)
        console.log("Filters applied:", filters)
    }

    const handleExport = () => {
        const headers = ["Client,Type,Budget Limit,Time Tracked,Cost Incurred,Remaining,Status"]
        const rows = filteredData.map(item => {
            const isCost = item.budgetType === 'cost'
            const used = isCost ? item.costIncurred : item.timeTracked
            const remaining = item.budgetTotal - used

            return [
                item.clientName,
                item.budgetType,
                item.budgetTotal,
                item.timeTracked.toFixed(2),
                item.costIncurred.toFixed(2),
                remaining.toFixed(2),
                item.status
            ].join(",")
        })

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "client_budgets_report.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="px-6 pb-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold">Client Budgets Report</h1>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search clients..."
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
                hideFilter={true}
            >
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-9 gap-2">
                                <Layers className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                    Group by: {groupBy === "none" ? "None" : groupBy === "month" ? "Month" : "Member"}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                            <DropdownMenuLabel>Group data by</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
                                <DropdownMenuRadioItem value="none">None</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="month">Month</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="member" disabled>Member (Coming Soon)</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

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
                                        clientName: "Client",
                                        budgetType: "Type",
                                        budgetTotal: "Budget",
                                        timeTracked: "Time Tracked",
                                        costIncurred: "Cost",
                                        budgetUsed: "Used %",
                                        remaining: "Remaining",
                                        status: "Status"
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

            {/* Main Content */}
            {groupBy === "none" ? (
                <DataTable
                    columns={columns}
                    data={filteredData}
                    isLoading={isLoading}
                    showColumnToggle={false}
                    columnVisibility={columnVisibility}
                    onColumnVisibilityChange={setColumnVisibility}
                />
            ) : (
                <div className="space-y-6">
                    {(() => {
                        const finalGroupedData = groupedData;

                        if (groupBy === "month") {
                            // Render logic logic is handled in derived state 'groupedData' above,
                            // but we check output here.
                        }

                        if (!finalGroupedData || Object.keys(finalGroupedData).length === 0) {
                            if (!isLoading) {
                                return (
                                    <div className="py-10 text-center text-gray-500 bg-white rounded-lg border border-dashed">
                                        No data found for the current filters.
                                    </div>
                                )
                            }
                            return null
                        }

                        return Object.entries(finalGroupedData).map(([groupName, items]) => (
                            <div key={groupName} className="space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="font-semibold text-lg text-gray-800">{groupName}</h3>
                                    <span className="text-sm text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
                                        {items.length} Clients
                                    </span>
                                </div>
                                <DataTable
                                    columns={columns}
                                    data={items}
                                    isLoading={isLoading}
                                    showColumnToggle={false}
                                    showPagination={false}
                                    columnVisibility={columnVisibility}
                                />
                            </div>
                        ))
                    })()}
                </div>
            )}

            <ClientBudgetsFilterSidebar
                open={filterSidebarOpen}
                onOpenChange={setFilterSidebarOpen}
                onApply={handleApplyFilters}
            />
        </div>
    )
}
