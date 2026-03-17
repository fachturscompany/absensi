"use client"

import React, { useState, useMemo, useEffect } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_VISITS } from "@/lib/data/dummy-data"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { Button } from "@/components/ui/button"
import { Download, SlidersHorizontal, Search, Filter, MapPin, LayoutList, Map as MapIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useTimezone } from "@/components/providers/timezone-provider"
import { exportToCSV, generateFilename } from "@/lib/export-utils"
import { format } from "date-fns"
import { VisitsFilterSidebar } from "@/components/report/VisitsFilterSidebar"
import dynamic from "next/dynamic"

const VisitsMap = dynamic(() => import("@/components/report/VisitsMap"), { ssr: false })

export default function VisitsPage() {
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
        teamId: "all",
        jobSiteId: "all"
    })

    const [viewMode, setViewMode] = useState<'list' | 'map'>('list')

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [visibleCols, setVisibleCols] = useState({
        member: true,
        date: true,
        location: true,
        checkIn: true,
        checkOut: true,
        duration: true,
        distance: true,
        notes: true,
    })

    useEffect(() => {
        setDateRange({
            startDate: new Date(2026, 0, 1),
            endDate: new Date(2026, 0, 31)
        })
        const timer = setTimeout(() => setIsLoading(false), 800)
        return () => clearTimeout(timer)
    }, [])

    const toggleCol = (key: keyof typeof visibleCols, value: boolean) => {
        setVisibleCols((prev) => ({ ...prev, [key]: value }))
    }

    // Generate unique job sites for filter
    const uniqueJobSites = useMemo(() => {
        const sites = new Set<string>()
        DUMMY_VISITS.forEach(v => sites.add(v.locationName))
        return Array.from(sites).map(site => ({ id: site, name: site }))
    }, [])

    const filteredData = useMemo(() => {
        return DUMMY_VISITS.filter(item => {
            if (!selectedFilter.all && selectedFilter.id !== 'all') {
                if (selectedFilter.type === 'members') {
                    if (item.memberId !== selectedFilter.id) return false
                } else if (selectedFilter.type === 'teams') {
                    const team = DUMMY_TEAMS.find(t => t.id === selectedFilter.id)
                    if (!team || !team.members.includes(item.memberId)) return false
                }
            }

            // Sidebar Filters
            if (sidebarFilters.memberId !== 'all' && item.memberId !== sidebarFilters.memberId) return false

            if (sidebarFilters.teamId !== 'all') {
                const team = DUMMY_TEAMS.find(t => t.id === sidebarFilters.teamId)
                if (!team || !team.members.includes(item.memberId)) return false
            }

            if (sidebarFilters.jobSiteId !== 'all' && item.locationName !== sidebarFilters.jobSiteId) return false

            if (dateRange.startDate && dateRange.endDate) {
                const visitDate = new Date(item.date)
                if (visitDate < dateRange.startDate || visitDate > dateRange.endDate) return false
            }

            if (searchQuery) {
                const lower = searchQuery.toLowerCase()
                if (!item.memberName.toLowerCase().includes(lower) &&
                    !item.locationName.toLowerCase().includes(lower) &&
                    !item.address.toLowerCase().includes(lower)) return false
            }

            return true
        })
    }, [selectedFilter, sidebarFilters, dateRange, searchQuery])

    const totalPages = Math.ceil(filteredData.length / pageSize)
    const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize)

    const handleExport = () => {
        exportToCSV({
            filename: generateFilename('visits-report'),
            columns: [
                { key: 'memberName', label: 'Member' },
                { key: 'date', label: 'Date' },
                { key: 'locationName', label: 'Location' },
                { key: 'address', label: 'Address' },
                { key: 'checkIn', label: 'Check In' },
                { key: 'checkOut', label: 'Check Out' },
                { key: 'duration', label: 'Duration' },
                { key: 'distance', label: 'Distance' },
                { key: 'notes', label: 'Notes' }
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
                    <h1 className="text-xl font-semibold mb-5">Job sites Report</h1>

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
                                    placeholder="Search location or member..."
                                    className="ps-9 pl-9 h-9 bg-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <Button
                                variant="outline"
                                className="h-9 text-gray-700 border-gray-300 bg-white hover:bg-gray-50 font-medium"
                                onClick={() => setFilterSidebarOpen(true)}
                            >
                                <Filter className="w-4 h-4 mr-2" /> Filter
                            </Button>

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
                                    <DropdownMenuCheckboxItem checked={visibleCols.location} onCheckedChange={(v) => toggleCol('location', !!v)}>Location</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={visibleCols.checkIn} onCheckedChange={(v) => toggleCol('checkIn', !!v)}>Check In</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={visibleCols.checkOut} onCheckedChange={(v) => toggleCol('checkOut', !!v)}>Check Out</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={visibleCols.duration} onCheckedChange={(v) => toggleCol('duration', !!v)}>Duration</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={visibleCols.distance} onCheckedChange={(v) => toggleCol('distance', !!v)}>Distance</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={visibleCols.notes} onCheckedChange={(v) => toggleCol('notes', !!v)}>Notes</DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="flex bg-gray-100 p-1 rounded-md border border-gray-200 mr-2">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={cn(
                                        "p-1.5 rounded-sm transition-all",
                                        viewMode === 'list' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    <LayoutList className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('map')}
                                    className={cn(
                                        "p-1.5 rounded-sm transition-all",
                                        viewMode === 'map' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    <MapIcon className="w-4 h-4" />
                                </button>
                            </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border rounded-lg shadow-sm bg-white mb-6">
                    {[
                        { label: "Total Visits", value: filteredData.length, color: "text-gray-900" },
                        { label: "Total Distance", value: filteredData.reduce((sum, item) => sum + item.distance, 0).toFixed(1) + " km", color: "text-gray-600" },
                    ].map((card, idx) => (
                        <div key={idx} className="p-4">
                            <p className="text-sm font-medium text-gray-500">{card.label}</p>
                            <p className={cn("text-2xl font-bold mt-1", card.color)}>
                                {card.value}
                            </p>
                        </div>
                    ))}
                </div>

                {viewMode === 'list' ? (
                    /* Table */
                    <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                                    <tr>
                                        {visibleCols.member && <th className="p-4 font-semibold">Member</th>}
                                        {visibleCols.date && <th className="p-4 font-semibold">Date</th>}
                                        {visibleCols.location && <th className="p-4 font-semibold">Location</th>}
                                        {visibleCols.checkIn && <th className="p-4 font-semibold">Check In</th>}
                                        {visibleCols.checkOut && <th className="p-4 font-semibold">Check Out</th>}
                                        {visibleCols.duration && <th className="p-4 font-semibold">Duration</th>}
                                        {visibleCols.distance && <th className="p-4 font-semibold">Distance</th>}
                                        {visibleCols.notes && <th className="p-4 font-semibold">Notes</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={8} className="p-8 text-center text-gray-500">
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-8 text-center text-gray-500">
                                                No visits found.
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
                                                {visibleCols.date && <td className="p-4 text-gray-600">{format(new Date(row.date), 'MMM dd, yyyy')}</td>}
                                                {visibleCols.location && (
                                                    <td className="p-4">
                                                        <a
                                                            href={row.coordinates
                                                                ? `https://www.google.com/maps/search/?api=1&query=${row.coordinates.lat},${row.coordinates.lng}`
                                                                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.address)}`
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-start gap-2 group/location p-1.5 -ml-1.5 rounded-md transition-colors cursor-pointer"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0 group-hover/location:text-blue-600 transition-colors" />
                                                            <div>
                                                                <div className="font-medium text-gray-900 group-hover/location:text-blue-700 transition-colors">{row.locationName}</div>
                                                                <div className="text-xs text-gray-500 group-hover/location:text-blue-600 transition-colors">{row.address}</div>
                                                            </div>
                                                        </a>
                                                    </td>
                                                )}
                                                {visibleCols.checkIn && <td className="p-4 text-gray-600">{row.checkIn}</td>}
                                                {visibleCols.checkOut && <td className="p-4 text-gray-600">{row.checkOut}</td>}
                                                {visibleCols.duration && <td className="p-4 text-gray-600 font-mono">{row.duration}</td>}
                                                {visibleCols.distance && <td className="p-4 text-gray-600">{row.distance} km</td>}
                                                {visibleCols.notes && <td className="p-4 text-gray-500 text-xs italic">{row.notes}</td>}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* Leaflet Map View */
                    <VisitsMap visits={filteredData} />
                )}

                {/* Pagination (only show in list mode or always? Usually implies list) */}
                {viewMode === 'list' && (
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
                            isLoading={isLoading}
                        />
                    </div>
                )}
            </main>

            <VisitsFilterSidebar
                open={filterSidebarOpen}
                onOpenChange={setFilterSidebarOpen}
                members={DUMMY_MEMBERS}
                teams={DUMMY_TEAMS}
                jobSites={uniqueJobSites}
                onApply={setSidebarFilters}
            />
        </div>
    )
}
