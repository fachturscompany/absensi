"use client"

import { useState, useMemo, useEffect, Fragment } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_TIME_OFF_BALANCES, DUMMY_MEMBERS, DUMMY_TEAMS, TimeOffBalance } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download, Filter, Search, ChevronDown, ChevronRight, Layers } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useTimezone } from "@/components/providers/timezone-provider"
// DataTable removed in favor of manual table implementation

import { TimeOffBalancesFilterSidebar } from "@/components/report/TimeOffBalancesFilterSidebar"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"

type GroupByOption = "member" | "policy"

export default function TimeOffBalancesPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(),
        endDate: new Date()
    })
    const [filterSidebarOpen, setFilterSidebarOpen] = useState(false)
    const [sidebarFilters, setSidebarFilters] = useState({ policy: "all" })
    const [groupBy, setGroupBy] = useState<GroupByOption>("member")
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Simulate loading
    const [isLoading, setIsLoading] = useState(true)
    useEffect(() => {
        // Set default date range (Current Year)
        setDateRange({
            startDate: new Date(new Date().getFullYear(), 0, 1),
            endDate: new Date(new Date().getFullYear(), 11, 31)
        })
        const timer = setTimeout(() => setIsLoading(false), 800)
        return () => clearTimeout(timer)
    }, [])

    const [searchQuery, setSearchQuery] = useState("")


    const filteredData = useMemo(() => {
        let data = DUMMY_TIME_OFF_BALANCES || []

        // Filter by member/team (InsightsHeader)
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

        // Filter by Sidebar (Policy)
        if (sidebarFilters.policy !== "all") {
            data = data.filter(item => item.policyName === sidebarFilters.policy)
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            data = data.filter(item =>
                item.memberName.toLowerCase().includes(query) ||
                item.policyName.toLowerCase().includes(query)
            )
        }

        return data
    }, [selectedFilter, sidebarFilters, searchQuery])

    // Pagination Logic
    const totalItems = filteredData.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filteredData.slice(start, start + pageSize)
    }, [filteredData, currentPage, pageSize])

    useEffect(() => {
        setCurrentPage(1)
    }, [filteredData])

    // Grouping Logic
    const groupedData = useMemo(() => {
        const groups: Record<string, TimeOffBalance[]> = {}

        paginatedData.forEach(item => {
            const key = groupBy === 'member' ? item.memberName : item.policyName
            if (!groups[key]) groups[key] = []
            groups[key].push(item)
        })

        return groups
    }, [paginatedData, groupBy])

    // Expand all groups by default
    useEffect(() => {
        if (groupedData) {
            const initial: Record<string, boolean> = {}
            Object.keys(groupedData).forEach(key => initial[key] = true)
            setExpandedGroups(initial)
        }
    }, [groupedData])

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }))
    }


    const summaryCards = useMemo(() => {
        const totalAccrued = filteredData.reduce((sum, t) => sum + t.accrued, 0)
        const totalUsed = filteredData.reduce((sum, t) => sum + t.used, 0)
        const totalPending = filteredData.reduce((sum, t) => sum + t.pending, 0)
        const totalBalance = filteredData.reduce((sum, t) => sum + t.balance, 0)

        return [
            { label: "Total Accrued", value: `${totalAccrued} days` },
            { label: "Total Used", value: `${totalUsed} days` },
            { label: "Pending Requests", value: `${totalPending} days` },
            { label: "Total Balance", value: `${totalBalance} days` },
        ]
    }, [filteredData])


    const handleExport = () => {
        const headers = ["Member,Policy,Accrued,Used,Scheduled,Available"]
        const rows = filteredData.map(item => [
            item.memberName,
            item.policyName,
            item.accrued,
            item.used,
            item.pending,
            item.balance
        ].join(","))

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "time_off_balances.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="px-6 pb-6 space-y-6">
            <h1 className="text-xl font-semibold">Time off balances report</h1>

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
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search member or policy..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-white dark:bg-gray-950 dark:border-gray-800 dark:text-gray-200 max-w-sm"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-9 gap-2">
                                <Layers className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                    Group by: {groupBy === "member" ? "Member" : "Policy"}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                            <DropdownMenuLabel>Group data by</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
                                <DropdownMenuRadioItem value="member">Member</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="policy">Policy</DropdownMenuRadioItem>
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
                    <Button variant="outline" className="h-9" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </InsightsHeader>

            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm bg-white dark:bg-gray-950">
                {summaryCards.map((card, idx) => (
                    <div key={idx} className="p-4">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="space-y-4">
                <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-semibold border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="p-3 w-48 font-semibold text-gray-900 dark:text-gray-100">
                                    {groupBy === 'policy' ? 'Member' : 'Policy'}
                                </th>
                                <th className="p-3 w-28 font-semibold text-gray-900 dark:text-gray-100">Accrued</th>
                                <th className="p-3 w-24 font-semibold text-gray-900 dark:text-gray-100">Used</th>
                                <th className="p-3 w-24 font-semibold text-gray-900 dark:text-gray-100">Pending</th>
                                <th className="p-3 w-24 font-semibold text-gray-900 dark:text-gray-100">Balance</th>
                                <th className="p-3 w-32 font-semibold text-gray-900 dark:text-gray-100">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : (!groupedData || Object.keys(groupedData).length === 0) ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No data found.
                                    </td>
                                </tr>
                            ) : (
                                Object.keys(groupedData).map(groupName => (
                                    <Fragment key={groupName}>
                                        <tr className="bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => toggleGroup(groupName)}>
                                            <td colSpan={6} className="p-3">
                                                <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-gray-100">
                                                    {expandedGroups[groupName] ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                                    {groupName}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedGroups[groupName] && groupedData[groupName]!.map((item, index) => (
                                            <tr key={item.id} className={`transition-colors border-b last:border-0 ${index % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-50 dark:bg-gray-900/50'} hover:bg-gray-100 dark:hover:bg-gray-800`}>
                                                <td className="py-3 pl-12 pr-4 text-gray-900 dark:text-gray-100 font-medium">
                                                    {groupBy === 'policy' ? item.memberName : item.policyName}
                                                </td>
                                                <td className="p-3 text-gray-500 dark:text-gray-400">
                                                    {item.accrued} {item.unit}
                                                </td>
                                                <td className="p-3 text-gray-500 dark:text-gray-400">
                                                    {item.used > 0 ? `${item.used} ${item.unit}` : "-"}
                                                </td>
                                                <td className="p-3 text-gray-500 dark:text-gray-400">
                                                    {item.pending > 0 ? `${item.pending} ${item.unit}` : "-"}
                                                </td>
                                                <td className="p-3 text-gray-900 dark:text-gray-100 font-medium">
                                                    {item.balance.toFixed(2)}
                                                </td>
                                                <td className="p-3 text-gray-500">
                                                    {/* Reason is empty in dummy data */}
                                                </td>
                                            </tr>
                                        ))}
                                    </Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <PaginationFooter
                    page={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    from={(currentPage - 1) * pageSize + 1}
                    to={Math.min(currentPage * pageSize, totalItems)}
                    total={totalItems}
                    pageSize={pageSize}
                    onPageSizeChange={(size) => {
                        setPageSize(size)
                        setCurrentPage(1)
                    }}
                    isLoading={isLoading}
                />
            </div>

            <TimeOffBalancesFilterSidebar
                open={filterSidebarOpen}
                onOpenChange={setFilterSidebarOpen}
                onApply={setSidebarFilters}
            />
        </div>
    )
}
