"use client"

import React, { useState, useMemo, useEffect } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_CLIENT_INVOICES, DUMMY_CLIENTS, DUMMY_MEMBERS, DUMMY_TEAMS } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useTimezone } from "@/components/providers/timezone-provider"
import { ClientInvoicesAgingFilterSidebar } from "@/components/report/ClientInvoicesAgingFilterSidebar"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { differenceInDays } from "date-fns"

export default function ClientInvoicesAgingPage() {
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
        clientId: "all"
    })

    useEffect(() => {
        // Set default date range (Last 90 days)
        setDateRange({
            startDate: new Date(new Date().setDate(new Date().getDate() - 90)),
            endDate: new Date()
        })
        const timer = setTimeout(() => setIsLoading(false), 800)
        return () => clearTimeout(timer)
    }, [])

    const filteredAndAggregatedData = useMemo(() => {
        let data = DUMMY_CLIENT_INVOICES || []

        if (sidebarFilters.clientId !== "all") {
            data = data.filter(item => item.clientId === sidebarFilters.clientId)
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            data = data.filter(item =>
                item.clientName.toLowerCase().includes(query)
            )
        }

        data = data.filter(item => item.amountDue > 0)

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

        const clientMap = new Map<string, {
            clientName: string,
            bucket0to30: number,
            bucket31to60: number,
            bucket61to90: number,
            totalOutstanding: number,
            currency: string
        }>()

        const today = new Date()

        data.forEach(invoice => {
            const daysOverdue = differenceInDays(today, new Date(invoice.issueDate))

            if (!clientMap.has(invoice.clientId)) {
                clientMap.set(invoice.clientId, {
                    clientName: invoice.clientName,
                    bucket0to30: 0,
                    bucket31to60: 0,
                    bucket61to90: 0,
                    totalOutstanding: 0,
                    currency: invoice.currency
                })
            }

            const record = clientMap.get(invoice.clientId)!
            record.totalOutstanding += invoice.amountDue

            if (daysOverdue <= 30) {
                record.bucket0to30 += invoice.amountDue
            } else if (daysOverdue <= 60) {
                record.bucket31to60 += invoice.amountDue
            } else if (daysOverdue <= 90) {
                record.bucket61to90 += invoice.amountDue
            }
        })

        return Array.from(clientMap.values())
    }, [dateRange, searchQuery, sidebarFilters])

    const handleExport = () => {
        const headers = ["Client Name,0-30 Days,31-60 Days,61-90 Days,Total Outstanding"]
        const rows = filteredAndAggregatedData.map(item => [
            item.clientName,
            item.bucket0to30,
            item.bucket31to60,
            item.bucket61to90,
            item.totalOutstanding
        ].join(","))

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "client_invoices_aging.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const summaryCards = useMemo(() => {
        const totalOutstanding = filteredAndAggregatedData.reduce((sum, item) => sum + item.totalOutstanding, 0)
        const total0to30 = filteredAndAggregatedData.reduce((sum, item) => sum + item.bucket0to30, 0)
        const total31to60 = filteredAndAggregatedData.reduce((sum, item) => sum + item.bucket31to60, 0)
        const total61to90 = filteredAndAggregatedData.reduce((sum, item) => sum + item.bucket61to90, 0)

        const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

        return [
            { label: "Total Outstanding", value: currencyFormatter.format(totalOutstanding) },
            { label: "0-30 Days", value: currencyFormatter.format(total0to30) },
            { label: "31-60 Days", value: currencyFormatter.format(total31to60) },
            { label: "61-90 Days", value: currencyFormatter.format(total61to90) },
        ]
    }, [filteredAndAggregatedData])

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const totalItems = filteredAndAggregatedData.length
    const totalPages = Math.ceil(totalItems / pageSize)

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filteredAndAggregatedData.slice(start, start + pageSize)
    }, [filteredAndAggregatedData, currentPage, pageSize])

    useEffect(() => {
        setCurrentPage(1)
    }, [filteredAndAggregatedData])

    // ... handleExport and other functions

    return (
        <div className="px-6 pb-6 space-y-6">
            {/* ... Header and Summary Cards ... */}
            <h1 className="text-xl font-semibold">Client invoices aging report</h1>

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
                            placeholder="Search client..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-white max-w-sm"
                        />
                    </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x border rounded-lg shadow-sm bg-white">
                {summaryCards.map((card, idx) => (
                    <div key={idx} className="p-4">
                        <p className="text-sm font-medium text-gray-500">{card.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-semibold border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className="p-3 pl-4 w-60 font-semibold text-gray-900">Client Name</th>
                                    <th className="p-3 text-right font-semibold text-gray-900">0-30 Days</th>
                                    <th className="p-3 text-right font-semibold text-gray-900">31-60 Days</th>
                                    <th className="p-3 text-right font-semibold text-gray-900">61-90 Days</th>
                                    <th className="p-3 text-right font-semibold text-gray-900">Total Outstanding</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            No data found.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((client, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="p-3 pl-4 font-medium text-gray-900">
                                                {client.clientName}
                                            </td>
                                            <td className="p-3 text-right text-gray-900">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: client.currency }).format(client.bucket0to30)}
                                            </td>
                                            <td className="p-3 text-right text-gray-900">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: client.currency }).format(client.bucket31to60)}
                                            </td>
                                            <td className="p-3 text-right text-gray-900">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: client.currency }).format(client.bucket61to90)}
                                            </td>
                                            <td className="p-3 text-right font-bold text-gray-900">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: client.currency }).format(client.totalOutstanding)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
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
                        isLoading={isLoading}
                    />
                </div>
            </div>

            <ClientInvoicesAgingFilterSidebar
                open={filterSidebarOpen}
                onOpenChange={setFilterSidebarOpen}
                onApply={setSidebarFilters}
                clients={DUMMY_CLIENTS}
            />
        </div>
    )
}
