"use client"

import React, { useState, useMemo, useEffect, Fragment } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_TEAM_INVOICES, TeamInvoice, DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download, Search, Filter, Layers, ChevronDown, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useTimezone } from "@/components/providers/timezone-provider"
import { TeamInvoicesFilterSidebar } from "@/components/report/TeamInvoicesFilterSidebar"
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
import { cn } from "@/lib/utils"

export default function TeamInvoicesPage() {
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
        status: "all"
    })

    useEffect(() => {
        // Set default date range to Jan 2026
        setDateRange({
            startDate: new Date(2026, 0, 1),
            endDate: new Date(2026, 0, 31)
        })
        const timer = setTimeout(() => setIsLoading(false), 800)
        return () => clearTimeout(timer)
    }, [])

    const [groupBy, setGroupBy] = useState<"member" | "status">("member")
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const filteredData = useMemo(() => {
        let data = DUMMY_TEAM_INVOICES || []

        if (dateRange.startDate && dateRange.endDate) {
            const start = new Date(dateRange.startDate)
            start.setHours(0, 0, 0, 0)
            const end = new Date(dateRange.endDate)
            end.setHours(23, 59, 59, 999)

            data = data.filter(item => {
                const itemDate = new Date(item.issueDate)
                return itemDate >= start && itemDate <= end
            })
        }

        // Sidebar Filters
        if (sidebarFilters.memberId !== "all") {
            data = data.filter(item => item.memberId === sidebarFilters.memberId)
        }

        if (sidebarFilters.status !== "all") {
            data = data.filter(item => item.status === sidebarFilters.status)
        }

        // Global Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            data = data.filter(item =>
                item.invoiceNumber.toLowerCase().includes(query) ||
                item.memberName.toLowerCase().includes(query)
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
        const groups: Record<string, TeamInvoice[]> = {}

        paginatedData.forEach(item => {
            const key = groupBy === 'member' ? item.memberName : item.status
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
        const headers = ["Issue Date,Invoice Number,Member,Status,Total,Paid Amount,Amount Due"]
        const rows = filteredData.map(item => [
            item.issueDate,
            item.invoiceNumber,
            item.memberName,
            item.status,
            item.total,
            item.paidAmount,
            item.amountDue
        ].join(","))

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "team_invoices.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const summaryCards = useMemo(() => {
        const totalInvoiced = filteredData.reduce((sum, t) => sum + t.total, 0)
        const totalPaid = filteredData.reduce((sum, t) => sum + t.paidAmount, 0)
        const totalDue = filteredData.reduce((sum, t) => sum + t.amountDue, 0)

        const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

        return [
            { label: "Total Invoiced", value: currencyFormatter.format(totalInvoiced) },
            { label: "Total Paid", value: currencyFormatter.format(totalPaid) },
            { label: "Total Due", value: currencyFormatter.format(totalDue) },
        ]
    }, [filteredData])

    return (
        <div className="px-6 pb-6 space-y-6">
            <h1 className="text-xl font-semibold">Team invoices report</h1>

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
                            placeholder="Search invoices..."
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
                                    Group by: {groupBy === "member" ? "Member" : "Status"}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                            <DropdownMenuLabel>Group data by</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={groupBy} onValueChange={(v) => setGroupBy(v as "member" | "status")}>
                                <DropdownMenuRadioItem value="member">Member</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="status">Status</DropdownMenuRadioItem>
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

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border rounded-lg shadow-sm bg-white">
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
                                    {groupBy === 'status' ? 'Member' : 'Status'}
                                </th>
                                <th className="p-3 w-32 font-semibold text-gray-900">Issue Date</th>
                                <th className="p-3 w-40 font-semibold text-gray-900">Invoice Number</th>
                                <th className="p-3 w-36 text-right font-semibold text-gray-900">Total</th>
                                <th className="p-3 w-36 text-right font-semibold text-gray-900">Paid Amount</th>
                                <th className="p-3 w-36 text-right font-semibold text-gray-900">Amount Due</th>
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
                                                    {groupBy === 'status' ? item.memberName : (
                                                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                                            item.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                                                                item.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                        )}>
                                                            {item.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-gray-500">
                                                    {new Date(item.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td className="p-3 text-gray-500">
                                                    {item.invoiceNumber}
                                                </td>
                                                <td className="p-3 text-right font-medium text-gray-900">
                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency }).format(item.total)}
                                                </td>
                                                <td className="p-3 text-right text-gray-500">
                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency }).format(item.paidAmount)}
                                                </td>
                                                <td className="p-3 text-right text-gray-900 font-medium">
                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: item.currency }).format(item.amountDue)}
                                                </td>
                                            </tr>
                                        ))}
                                    </Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div>
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
                    />
                </div>
            </div>

            <TeamInvoicesFilterSidebar
                open={filterSidebarOpen}
                onOpenChange={setFilterSidebarOpen}
                onApply={setSidebarFilters}
            />
        </div>
    )
}
