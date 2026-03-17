"use client"

import { useState, useMemo, Fragment } from "react"
import { InsightsHeader } from "@/components/insights/InsightsHeader"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { DUMMY_MEMBERS, DUMMY_TEAMS, DUMMY_AUDIT_LOGS, type AuditLogEntry } from "@/lib/data/dummy-data"
import { Button } from "@/components/ui/button"
import { Download, Search, ChevronDown, ChevronRight, Filter } from "lucide-react"
import { format, parseISO } from "date-fns"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { useTimezone } from "@/components/providers/timezone-provider"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { AuditLogFilterSidebar } from "@/components/report/AuditLogFilterSidebar"
import { AuditLogAuthorCell } from "@/components/report/AuditLogAuthorCell"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export default function AuditLogPage() {
    const timezone = useTimezone()
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(2026, 0, 25),
        endDate: new Date(2026, 0, 30)
    })
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    // Local Filters
    const [searchQuery, setSearchQuery] = useState("")

    // Sidebar Filters
    const [filterSidebarOpen, setFilterSidebarOpen] = useState(false)
    const [sidebarFilters, setSidebarFilters] = useState({
        action: "all"
    })

    const handleSidebarApply = (filters: { member: string, team: string, action: string }) => {
        // Sync Member/Team filter from sidebar if changed
        if (filters.member && filters.member !== 'all') {
            setSelectedFilter({ type: 'members', id: filters.member, all: false })
        } else if (filters.team && filters.team !== 'all') {
            setSelectedFilter({ type: 'teams', id: filters.team, all: false })
        } else if (filters.member === 'all' && filters.team === 'all') {
            // If both reset to all, reset header too
            setSelectedFilter({ type: 'members', id: 'all', all: true })
        }

        setSidebarFilters({
            action: filters.action || "all"
        })
        setFilterSidebarOpen(false)
    }

    // Expanded Groups State
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

    const filteredData = useMemo(() => {
        let data = DUMMY_AUDIT_LOGS

        if (dateRange.startDate && dateRange.endDate) {
            const startStr = format(dateRange.startDate, 'yyyy-MM-dd')
            const endStr = format(dateRange.endDate, 'yyyy-MM-dd')
            data = data.filter(item => item.date >= startStr && item.date <= endStr)
        }

        if (!selectedFilter.all && selectedFilter.id !== 'all') {
            if (selectedFilter.type === 'members') {
                data = data.filter(item => item.author.name === DUMMY_MEMBERS.find(m => m.id === selectedFilter.id)?.name)
            }
        }

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase()
            data = data.filter(item =>
                item.author.name.toLowerCase().includes(lowerQuery) ||
                item.details.toLowerCase().includes(lowerQuery) ||
                item.object.toLowerCase().includes(lowerQuery) ||
                item.id.toLowerCase().includes(lowerQuery)
            )
        }

        if (sidebarFilters.action !== 'all') {
            data = data.filter(item => item.action === sidebarFilters.action)
        }

        return data
    }, [dateRange, selectedFilter, searchQuery, sidebarFilters])

    const groupedData = useMemo(() => {
        const groups: Record<string, AuditLogEntry[]> = {}
        filteredData.forEach(item => {
            if (!groups[item.date]) {
                groups[item.date] = []
            }
            groups[item.date]!.push(item)
        })
        return groups
    }, [filteredData])

    const sortedDates = useMemo(() => {
        return Object.keys(groupedData).sort((a, b) => b.localeCompare(a))
    }, [groupedData])
    useMemo(() => {
        const initialExpanded: Record<string, boolean> = {}
        sortedDates.forEach(date => {
            initialExpanded[date] = true
        })
        setExpandedGroups(prev => Object.keys(prev).length === 0 ? initialExpanded : prev)
    }, [sortedDates])

    const toggleGroup = (date: string) => {
        setExpandedGroups(prev => ({ ...prev, [date]: !prev[date] }))
    }

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + ["Date,Author,Action,Object,Details,ID"].join(",") + "\n"
            + filteredData.map(row =>
                `${row.date},"${row.author.name}",${row.action},"${row.object}","${row.details}",${row.id}`
            ).join("\n")

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", "audit_log_report.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const getActionBadgeColor = (action: string) => {
        const lowerAction = action.toLowerCase()

        // Red: Delete/Deny/Archive/Remove/Unsubmit/Merge Failed
        if (['deleted', 'denied', 'archived', 'removed', 'unsubmit', 'merge failed'].includes(lowerAction)) {
            return "bg-red-100 text-red-700 border-red-200"
        }

        // Orange: Modification/Update
        if (['updated', 'modified'].includes(lowerAction)) {
            return "bg-orange-100 text-orange-700 border-orange-200"
        }

        // Green: Creation/Approval/Positive Actions
        if (['accepted invite', 'approved', 'restored', 'enabled', 'merged', 'submitted'].includes(lowerAction)) {
            return "bg-green-100 text-green-700 border-green-200"
        }

        // Blue: Informational/New Item Actions
        if (['added', 'created', 'duplicated', 'opened', 'send email', 'transfered'].includes(lowerAction)) {
            return "bg-blue-100 text-blue-700 border-blue-200"
        }

        return "bg-gray-100 text-gray-700 border-gray-200"
    }

    const paginatedDates = useMemo(() => {
        const startIndex = (page - 1) * pageSize
        return sortedDates.slice(startIndex, startIndex + pageSize)
    }, [sortedDates, page, pageSize])

    return (
        <div className="px-6 py-4">
            <div className="flex justify-between items-center mb-5">
                <h1 className="text-xl font-semibold">Audit log</h1>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search members or event details"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 ps-9 h-9 bg-white"
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

            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden mt-4">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800">
                        <tr>
                            <th className="p-4 w-40">Date & Logs</th>
                            <th className="p-4 w-48">Author</th>
                            <th className="p-4 w-32">Time</th>
                            <th className="p-4 w-32">Action</th>
                            <th className="p-4 w-40">Object</th>
                            <th className="p-4 w-48">Member</th>
                            <th className="p-4">Detail</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {paginatedDates.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-500">
                                    No logs found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            paginatedDates.map(date => (
                                <Fragment key={date}>
                                    <tr key={date} className="bg-gray-50/50 hover:bg-gray-50 cursor-pointer" onClick={() => toggleGroup(date)}>
                                        <td colSpan={7} className="p-3">
                                            <div className="flex items-center gap-2 font-medium text-gray-900">
                                                {expandedGroups[date] ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                                                {format(parseISO(date), 'EEE, MMM d, yyyy')}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedGroups[date] && groupedData[date] && groupedData[date]!.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="p-4 align-top">
                                                <span className="text-xs font-mono text-gray-500 group-hover:text-blue-600 transition-colors">{item.id}</span>
                                            </td>
                                            <td className="p-4 align-top">
                                                <AuditLogAuthorCell author={item.author} />
                                            </td>
                                            <td className="p-4 align-top text-gray-600 whitespace-nowrap">
                                                {item.time}
                                            </td>
                                            <td className="p-4 align-top">
                                                <span className={cn(
                                                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                    getActionBadgeColor(item.action)
                                                )}>
                                                    {item.action}
                                                </span>
                                            </td>
                                            <td className="p-4 align-top text-gray-900">
                                                {item.object}
                                            </td>
                                            <td className="p-4 align-top">
                                                {item.members && item.members.length > 0 ? (
                                                    <div className="flex -space-x-2 hover:space-x-1 transition-all">
                                                        {item.members.map((member) => (
                                                            <Tooltip key={`${item.id}-${member.name}`}>
                                                                <TooltipTrigger asChild>
                                                                    <div className="cursor-pointer">
                                                                        <AuditLogAuthorCell
                                                                            author={member}
                                                                            showName={false}
                                                                            showRing={true}
                                                                            avatarClassName="ring-2 ring-white"
                                                                            className="bg-white rounded-full" // Minimal container style
                                                                        />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="bg-gray-900 text-white border-0">
                                                                    <p>{member.name}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="p-4 align-top text-gray-600">
                                                {item.details}
                                            </td>
                                        </tr>
                                    ))}
                                </Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* Pagination */}
            <div className="mt-4">
                <PaginationFooter
                    page={page}
                    totalPages={Math.ceil(sortedDates.length / pageSize)}
                    onPageChange={setPage}
                    from={(page - 1) * pageSize + 1}
                    to={Math.min(page * pageSize, sortedDates.length)}
                    total={sortedDates.length}
                    pageSize={pageSize}
                    onPageSizeChange={(size) => {
                        setPageSize(size)
                        setPage(1)
                    }}
                />
            </div>

            <AuditLogFilterSidebar
                open={filterSidebarOpen}
                onOpenChange={setFilterSidebarOpen}
                onApply={handleSidebarApply}
            />
        </div>
    )
}
