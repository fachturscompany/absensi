"use client"

import { useState, useMemo, useEffect, Fragment } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_TIME_OFF_TRANSACTIONS, DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download, Search, Filter, Layers, ChevronDown, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useTimezone } from "@/components/providers/timezone-provider"
import { TimeOffTransactionsFilterSidebar } from "@/components/report/TimeOffTransactionsFilterSidebar"
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

export default function TimeOffTransactionsPage() {
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
        teamId: "all",
        memberId: "all",
        policy: "all",
        type: "all",
        changedBy: "all",
        includeAccruals: false
    })

    useEffect(() => {
        // Set default date range to Jan 2026 to match dummy data
        setDateRange({
            startDate: new Date(2026, 0, 1),
            endDate: new Date(2026, 0, 31)
        })
        const timer = setTimeout(() => setIsLoading(false), 800)
        return () => clearTimeout(timer)
    }, [])

    const [groupBy, setGroupBy] = useState<"member" | "policy">("member")
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const filteredData = useMemo(() => {
        let data = DUMMY_TIME_OFF_TRANSACTIONS || []

        // Filter by date range
        if (dateRange.startDate && dateRange.endDate) {
            // Create start/end of day boundaries
            const start = new Date(dateRange.startDate)
            start.setHours(0, 0, 0, 0)

            const end = new Date(dateRange.endDate)
            end.setHours(23, 59, 59, 999)

            data = data.filter(item => {
                const itemDate = new Date(item.date)
                return itemDate >= start && itemDate <= end
            })
        }

        // Sidebar Filters
        if (sidebarFilters.teamId !== "all") {
            const team = DUMMY_TEAMS.find(t => t.id === sidebarFilters.teamId)
            if (team) {
                data = data.filter(item => team.members.includes(item.memberId))
            }
        }

        if (sidebarFilters.memberId !== "all") {
            data = data.filter(item => item.memberId === sidebarFilters.memberId)
        }

        if (sidebarFilters.policy !== "all") {
            data = data.filter(item => item.policyName === sidebarFilters.policy)
        }

        if (sidebarFilters.type !== "all") {
            data = data.filter(item => item.transactionType === sidebarFilters.type)
        }

        if (!sidebarFilters.includeAccruals) {
            data = data.filter(item => item.transactionType !== 'accrual')
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            data = data.filter(item =>
                item.memberName.toLowerCase().includes(query) ||
                item.policyName.toLowerCase().includes(query) ||
                (item.notes && item.notes.toLowerCase().includes(query))
            )
        }

        return data
    }, [dateRange, searchQuery, sidebarFilters])

    const totalItems = filteredData.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filteredData.slice(start, start + pageSize)
    }, [filteredData, currentPage, pageSize])

    useEffect(() => {
        setCurrentPage(1)
    }, [filteredData])

    const groupedData = useMemo(() => {
        const groups: Record<string, typeof DUMMY_TIME_OFF_TRANSACTIONS> = {}

        paginatedData.forEach(item => {
            const key = groupBy === 'member' ? item.memberName : item.policyName
            if (!groups[key]) groups[key] = []
            groups[key].push(item)
        })

        return groups
    }, [paginatedData, groupBy])

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

    const handleExport = () => {
        const headers = ["Member,Type,Date,Transaction,Amount,Balance After,Notes"]
        const rows = filteredData.map(item => [
            item.memberName,
            item.policyName,
            item.date,
            item.transactionType,
            item.amount,
            item.balanceAfter,
            `"${item.notes || ''}"`
        ].join(","))

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "time_off_transactions.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const summaryCards = useMemo(() => {
        const totalTransactions = filteredData.length
        const totalAccrued = filteredData
            .filter(t => t.transactionType === 'accrual' || t.transactionType === 'adjustment' && t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0)
        const totalUsed = filteredData
            .filter(t => t.transactionType === 'usage' || t.transactionType === 'adjustment' && t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0)
        const netChange = filteredData.reduce((sum, t) => sum + t.amount, 0)

        return [
            { label: "Total Transactions", value: totalTransactions.toString() },
            { label: "Total Accrued", value: totalAccrued.toFixed(1) },
            { label: "Total Used", value: totalUsed.toFixed(1) },
            { label: "Net Change", value: (netChange > 0 ? "+" : "") + netChange.toFixed(1) },
        ]
    }, [filteredData])



    return (
        <div className="px-6 pb-6 space-y-6">
            <h1 className="text-xl font-semibold">Time off transactions report</h1>

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
                            placeholder="Search transactions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-white max-w-sm"
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
                            <DropdownMenuRadioGroup value={groupBy} onValueChange={(v) => setGroupBy(v as "member" | "policy")}>
                                <DropdownMenuRadioItem value="member">Member</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="policy">Policy</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                        variant="outline"
                        className="h-9 text-gray-700 border-gray-300 bg-white hover:bg-gray-50 font-medium"
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

            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x border rounded-lg shadow-sm bg-white">
                {summaryCards.map((card, idx) => (
                    <div key={idx} className="p-4">
                        <p className="text-sm font-medium text-gray-500">{card.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-semibold border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="p-3 pl-4 w-48 font-semibold text-gray-900">
                                    {groupBy === 'policy' ? 'Member' : 'Time Off Type'}
                                </th>
                                <th className="p-3 w-32 font-semibold text-gray-900">Date</th>
                                <th className="p-3 w-40 font-semibold text-gray-900">Transaction Type</th>
                                <th className="p-3 w-28 text-right font-semibold text-gray-900">Amount</th>
                                <th className="p-3 w-28 text-right font-semibold text-gray-900">Balance After</th>
                                <th className="p-3 font-semibold text-gray-900">Notes</th>
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
                                        <tr className="bg-gray-50/50 hover:bg-gray-50 cursor-pointer" onClick={() => toggleGroup(groupName)}>
                                            <td colSpan={6} className="p-3">
                                                <div className="flex items-center gap-2 font-medium text-gray-900">
                                                    {expandedGroups[groupName] ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                                    {groupName}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedGroups[groupName] && groupedData[groupName]!.map((item, index) => (
                                            <tr
                                                key={item.id}
                                                className={`transition-colors border-b last:border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}
                                            >
                                                <td className="py-3 pl-4 font-medium text-gray-900">
                                                    {groupBy === 'policy' ? item.memberName : item.policyName}
                                                </td>
                                                <td className="p-3 text-gray-500">
                                                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                                                        ${item.transactionType === 'accrual' ? 'bg-green-100 text-green-800' :
                                                            item.transactionType === 'usage' ? 'bg-red-100 text-red-800' :
                                                                item.transactionType === 'adjustment' ? 'bg-blue-100 text-blue-800' :
                                                                    item.transactionType === 'cancellation' ? 'bg-orange-100 text-orange-800' :
                                                                        'bg-gray-100 text-gray-800'}`}>
                                                        {item.transactionType}
                                                    </span>
                                                </td>
                                                <td className={`p-3 text-right font-medium ${item.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                                    {item.amount > 0 ? "+" : ""}{item.amount}
                                                </td>
                                                <td className="p-3 text-right text-gray-900 font-medium">
                                                    {item.balanceAfter}
                                                </td>
                                                <td className="p-3 text-gray-500 truncate max-w-[200px]" title={item.notes}>
                                                    {item.notes || "-"}
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


            <TimeOffTransactionsFilterSidebar
                open={filterSidebarOpen}
                onOpenChange={setFilterSidebarOpen}
                onApply={setSidebarFilters}
                teams={DUMMY_TEAMS}
                members={DUMMY_MEMBERS}
            />
        </div>
    )
}
