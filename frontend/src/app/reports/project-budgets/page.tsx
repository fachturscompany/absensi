"use client"

import { useState, useEffect } from "react"
import { columns } from "./columns"
import { DUMMY_PROJECT_BUDGETS, ProjectBudgetEntry } from "@/lib/data/dummy-project-budgets"
// Using dummy members for the shared header filter if needed, though this report is project-centric
import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_PROJECTS } from "@/lib/data/dummy-data"
import { DataTable } from "@/components/tables/data-table"
import { Button } from "@/components/ui/button"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { useTimezone } from "@/components/providers/timezone-provider"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { ProjectBudgetsFilterSidebar } from "@/components/report/ProjectBudgetsFilterSidebar"
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


type GroupByOption = "none" | "client" | "status" | "month"

export default function ProjectBudgetsPage() {
    const timezone = useTimezone()
    const [filterSidebarOpen, setFilterSidebarOpen] = useState(false)
    const [sidebarFilters, setSidebarFilters] = useState({
        project: "all",
        client: "all",
        budgetType: "all"
    })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(),
        endDate: new Date()
    })
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [groupBy, setGroupBy] = useState<GroupByOption>("none")

    const [data] = useState(DUMMY_PROJECT_BUDGETS)
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

    const [filteredData, setFilteredData] = useState<ProjectBudgetEntry[]>(data)

    useEffect(() => {
        const now = new Date()

        const transformedData = data.map(item => {
            // 1. Get Project Details
            const project = DUMMY_PROJECTS.find(p => p.id === item.projectId)
            if (!project) return null

            const projectCreated = new Date(project.createdAt)
            const projectEnd = new Date(now) // Assume active until "now" (client time)
            const projectDuration = projectEnd.getTime() - projectCreated.getTime()

            // 2. Get Selected Range Details
            const rangeStart = new Date(dateRange.startDate)
            const rangeEnd = new Date(dateRange.endDate)
            rangeEnd.setHours(23, 59, 59, 999)

            // 3. Calculate Overlap
            const overlapStart = new Date(Math.max(projectCreated.getTime(), rangeStart.getTime()))
            const overlapEnd = new Date(Math.min(projectEnd.getTime(), rangeEnd.getTime()))

            let ratio = 1
            if (overlapStart < overlapEnd && projectDuration > 0) {
                const overlapDuration = overlapEnd.getTime() - overlapStart.getTime()
                ratio = overlapDuration / projectDuration
            } else {
                ratio = 0
            }

            const newTimeTracked = item.timeTracked * ratio
            const newCostIncurred = item.costIncurred * ratio

            // 4. Recalculate Status
            let newStatus: ProjectBudgetEntry['status'] = 'Within Budget'
            let usedAmount = 0
            if (item.budgetType === 'cost') {
                usedAmount = newCostIncurred
            } else {
                usedAmount = newTimeTracked
            }

            const usagePct = item.budgetTotal > 0 ? (usedAmount / item.budgetTotal) * 100 : 0
            if (usagePct > 100) newStatus = 'Exceeded'
            else if (usagePct > 80) newStatus = 'Approaching Limit'

            return {
                ...item,
                timeTracked: newTimeTracked,
                costIncurred: newCostIncurred,
                status: newStatus
            }
        }).filter((item): item is ProjectBudgetEntry => {
            if (!item) return false

            const matchesProject = sidebarFilters.project === "all" || item.projectName === sidebarFilters.project
            const matchesClient = sidebarFilters.client === "all" || item.clientName === sidebarFilters.client
            const matchesType = sidebarFilters.budgetType === "all" || item.budgetType === sidebarFilters.budgetType
            const matchesSearch = item.projectName.toLowerCase().includes(searchQuery.toLowerCase())

            const project = DUMMY_PROJECTS.find(p => p.id === item.projectId)
            if (!project) return false

            const projectCreated = new Date(project.createdAt)
            const rangeEnd = new Date(dateRange.endDate)
            rangeEnd.setHours(23, 59, 59, 999)
            const existsInPeriod = projectCreated <= rangeEnd

            return matchesProject && matchesClient && matchesType && matchesSearch && existsInPeriod
        })

        setFilteredData(transformedData)
    }, [data, sidebarFilters, dateRange, searchQuery])

    // Grouping Logic
    const groupedData = (() => {
        if (groupBy === "none") return null

        if (groupBy === "month") {
            // Dynamically generate months based on the selected dateRange
            const months: string[] = []
            const start = new Date(dateRange.startDate)
            const end = new Date(dateRange.endDate)

            // Iterate month by month
            const current = new Date(start)
            current.setDate(1) // Start from beginning of the month to avoid skipping feb 28 etc

            while (current <= end) {
                const monthStr = current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                if (!months.includes(monthStr)) {
                    months.push(monthStr)
                }
                current.setMonth(current.getMonth() + 1)
            }

            // If the range is very short or empty, ensure at least one month is shown (the start month)
            if (months.length === 0) {
                months.push(start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
            }

            const monthGroups: Record<string, ProjectBudgetEntry[]> = {}
            months.forEach(m => {
                // Determine usage factor:
                // If we have many months, split the total usage across them.
                // For dummy simulation, we'll just divide by the number of months 
                // and add some random variance so it doesn't look too artificial.

                const splitFactor = (1 / months.length)

                monthGroups[m] = filteredData.map(p => ({
                    ...p,
                    // Simulate split values: Base split + random variance (+/- 20% of the split)
                    timeTracked: p.timeTracked * (splitFactor * (0.8 + Math.random() * 0.4)),
                    costIncurred: p.costIncurred * (splitFactor * (0.8 + Math.random() * 0.4))
                }))
            })
            return monthGroups
        }

        return filteredData.reduce((acc, item) => {
            const key = groupBy === "client" ? item.clientName : item.status
            if (!acc[key]) {
                acc[key] = []
            }
            acc[key].push(item)
            return acc
        }, {} as Record<string, ProjectBudgetEntry[]>)
    })()

    // Handlers
    const handleApplyFilters = (filters: typeof sidebarFilters) => {
        setSidebarFilters(filters)
        setFilterSidebarOpen(false)
        console.log("Filters applied:", filters)
    }

    const handleExport = () => {
        const headers = ["Project,Client,Type,Budget Total,Time Tracked,Cost Incurred,Remaining,Status"]
        const rows = filteredData.map(item => {
            const isCost = item.budgetType === 'cost'
            const used = isCost ? item.costIncurred : item.timeTracked
            const remaining = item.budgetTotal - used

            return [
                item.projectName,
                item.clientName,
                item.budgetType,
                item.budgetTotal,
                item.timeTracked.toFixed(2),
                item.costIncurred,
                remaining.toFixed(2),
                item.status
            ].join(",")
        })

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "project_budgets_report.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="px-6 pb-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold">Project Budgets Report</h1>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search projects..."
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
                                    Group by: {groupBy === "none" ? "None" : groupBy === "client" ? "Client" : groupBy === "status" ? "Status" : "Month"}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                            <DropdownMenuLabel>Group data by</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
                                <DropdownMenuRadioItem value="none">None</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="client">Client</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="status">Status</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="month">Month</DropdownMenuRadioItem>
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
                                        projectName: "Project",
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
                        let finalGroupedData = groupedData;

                        if (groupBy === "month") {
                            const months: string[] = []
                            const start = new Date(dateRange.startDate)
                            const end = new Date(dateRange.endDate)

                            const current = new Date(start)
                            current.setDate(1) // Start from beginning of the month

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

                            finalGroupedData = months.reduce((acc, month) => {
                                // Determine usage factor
                                const splitFactor = (1 / months.length)

                                acc[month] = filteredData.map(item => ({
                                    ...item,
                                    // Simulate different usage per month
                                    timeTracked: item.timeTracked * (splitFactor * (0.8 + Math.random() * 0.4)),
                                    costIncurred: item.costIncurred * (splitFactor * (0.8 + Math.random() * 0.4)),
                                }));
                                return acc;
                            }, {} as Record<string, ProjectBudgetEntry[]>);
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
                                        {items.length} Projects
                                    </span>
                                </div>
                                <Card className="border shadow-sm rounded-lg">
                                    <CardContent className="p-0">
                                        <DataTable
                                            columns={columns}
                                            data={items}
                                            isLoading={isLoading}
                                            showColumnToggle={false}
                                            showPagination={false} // Disable pagination inside groups
                                            columnVisibility={columnVisibility}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                        ))
                    })()}
                </div>
            )}

            <ProjectBudgetsFilterSidebar
                open={filterSidebarOpen}
                onOpenChange={setFilterSidebarOpen}
                onApply={handleApplyFilters}
            />
        </div>
    )
}
