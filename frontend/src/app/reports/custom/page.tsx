"use client"

import React, { useState, useMemo, useEffect } from "react"
import { DUMMY_CUSTOM_REPORTS, type CustomReport } from "@/lib/data/dummy-data"
import { PaginationFooter } from "@/components/customs/pagination-footer"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, Pencil, Trash, Download, MoreVertical, Star } from "lucide-react"
import { EditScheduleDialog } from "@/components/report/EditScheduleDialog"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { exportToCSV, generateFilename, type ExportColumn } from "@/lib/export-utils"
import { toast } from "sonner"

type GroupByOption = 'none' | 'type' | 'status' | 'frequency'
type ReportTypeFilter = 'all' | 'Time & Activity' | 'Daily Totals' | 'Payments' | 'Custom'
type FrequencyFilter = 'all' | 'Daily' | 'Weekly' | 'Monthly' | 'One-time'

export default function CustomizedReportsPage() {
    // Filter States
    const [statusFilter, setStatusFilter] = useState("all")
    const [typeFilter, setTypeFilter] = useState<ReportTypeFilter>("all")
    const [frequencyFilter, setFrequencyFilter] = useState<FrequencyFilter>("all")
    const [search, setSearch] = useState("")
    const [groupBy, setGroupBy] = useState<GroupByOption>('none')

    // Data States
    const [data, setData] = useState(DUMMY_CUSTOM_REPORTS)
    const [selectedReports, setSelectedReports] = useState<string[]>([])

    // Dialog States
    const [editScheduleOpen, setEditScheduleOpen] = useState(false)
    const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null)
    const [reportToDelete, setReportToDelete] = useState<CustomReport | null>(null)

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [statusFilter, typeFilter, frequencyFilter, search, groupBy])

    // Filter Logic
    const filteredData = useMemo(() => {
        let filtered = data

        // 1. Filter by Status
        if (statusFilter !== "all") {
            filtered = filtered.filter(item => item.status.toLowerCase() === statusFilter)
        }

        // 2. Filter by Type
        if (typeFilter !== "all") {
            filtered = filtered.filter(item => item.type === typeFilter)
        }

        // 3. Filter by Frequency
        if (frequencyFilter !== "all") {
            filtered = filtered.filter(item => {
                const freq = item.scheduleMeta.split(' ')[0] // Extract "Daily", "Weekly", etc.
                return freq === frequencyFilter
            })
        }

        // 4. Filter by Search
        if (search.trim()) {
            const q = search.toLowerCase()
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(q) ||
                item.type.toLowerCase().includes(q) ||
                item.scheduleMeta.toLowerCase().includes(q)
            )
        }

        return filtered
    }, [statusFilter, typeFilter, frequencyFilter, search, data])

    // Grouping Logic
    const groupedData = useMemo(() => {
        if (groupBy === 'none') {
            return [{ key: 'all', label: 'All Reports', items: filteredData }]
        }

        const groups: Record<string, CustomReport[]> = {}

        filteredData.forEach(item => {
            let groupKey = ''

            switch (groupBy) {
                case 'type':
                    groupKey = item.type
                    break
                case 'status':
                    groupKey = item.status
                    break
                case 'frequency':
                    groupKey = item.scheduleMeta?.split(' ')[0] || 'Unknown'
                    break
                default:
                    groupKey = 'Other'
            }

            if (!groups[groupKey]) {
                groups[groupKey] = []
            }
            groups[groupKey]?.push(item)
        })

        return Object.entries(groups)
            .map(([key, items]) => ({ key, label: key, items }))
            .sort((a, b) => a.label.localeCompare(b.label))
    }, [filteredData, groupBy])

    // Pagination Logic
    const totalPages = Math.ceil(filteredData.length / pageSize) || 1
    const paginatedGroups = useMemo(() => {
        if (groupBy === 'none') {
            const start = (currentPage - 1) * pageSize
            const end = start + pageSize
            return [{
                key: 'all',
                label: 'All Reports',
                items: filteredData.slice(start, end)
            }]
        }

        // For grouped view, show all groups but paginate within
        return groupedData
    }, [groupedData, currentPage, pageSize, groupBy, filteredData])

    // Export Handler
    const handleExport = () => {
        const columns: ExportColumn[] = [
            { key: 'name', label: 'Name' },
            { key: 'type', label: 'Report Type' },
            { key: 'lastModified', label: 'Last Modified' },
            { key: 'scheduleMeta', label: 'Schedule' },
            { key: 'nextSchedule', label: 'Next Run' },
            { key: 'status', label: 'Status' }
        ]

        const dataToExport = selectedReports.length > 0
            ? data.filter(r => selectedReports.includes(r.id))
            : filteredData

        exportToCSV({
            filename: generateFilename('custom-reports'),
            columns,
            data: dataToExport
        })

        toast.success(`Exported ${dataToExport.length} report(s) to CSV`)
    }

    // Bulk Actions
    const handleSelectAll = () => {
        if (selectedReports.length === filteredData.length) {
            setSelectedReports([])
        } else {
            setSelectedReports(filteredData.map(r => r.id))
        }
    }

    const handleBulkDelete = () => {
        if (selectedReports.length === 0) {
            toast.error("No reports selected")
            return
        }

        setData(prev => prev.filter(item => !selectedReports.includes(item.id)))
        setSelectedReports([])
        toast.success(`Deleted ${selectedReports.length} report(s)`)
    }

    const handleBulkPauseResume = () => {
        if (selectedReports.length === 0) {
            toast.error("No reports selected")
            return
        }

        setData(prev => prev.map(item =>
            selectedReports.includes(item.id)
                ? { ...item, status: item.status === 'Active' ? 'Paused' : 'Active' }
                : item
        ))
        setSelectedReports([])
        toast.success(`Updated ${selectedReports.length} report(s)`)
    }



    return (
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-200">Customized Reports</h1>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExport} className="gap-2">
                        <Download className="w-4 h-4" />
                        Export to CSV
                    </Button>
                    <Button className="bg-black text-white hover:bg-black/90">
                        + New Report
                    </Button>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-4">
                <div className="flex flex-col gap-4">
                    {/* Row 1: Search & Filters */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[260px] max-w-[360px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Search reports..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="ps-10 pl-10 border-gray-300"
                                suppressHydrationWarning
                            />
                        </div>

                        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ReportTypeFilter)}>
                            <SelectTrigger className="w-[180px] border-gray-300">
                                <SelectValue placeholder="Report Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="Time & Activity">Time & Activity</SelectItem>
                                <SelectItem value="Daily Totals">Daily Totals</SelectItem>
                                <SelectItem value="Payments">Payments</SelectItem>

                                <SelectItem value="Custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={frequencyFilter} onValueChange={(v) => setFrequencyFilter(v as FrequencyFilter)}>
                            <SelectTrigger className="w-[180px] border-gray-300">
                                <SelectValue placeholder="Frequency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Frequencies</SelectItem>
                                <SelectItem value="Daily">Daily</SelectItem>
                                <SelectItem value="Weekly">Weekly</SelectItem>
                                <SelectItem value="Monthly">Monthly</SelectItem>
                                <SelectItem value="One-time">One-time</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px] border-gray-300">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="paused">Paused</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
                            <SelectTrigger className="w-[180px] border-gray-300">
                                <SelectValue placeholder="Group By" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Grouping</SelectItem>
                                <SelectItem value="type">By Type</SelectItem>
                                <SelectItem value="status">By Status</SelectItem>
                                <SelectItem value="frequency">By Frequency</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Row 2: Bulk Actions */}
                    {selectedReports.length > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">
                                {selectedReports.length} selected
                            </span>
                            <div className="h-4 w-px bg-gray-300" />
                            <Button variant="ghost" size="sm" onClick={() => {
                                if (selectedReports.length > 3) {
                                    toast.error("You can select a maximum of 3 reports to show on the Reports page")
                                    return
                                }
                                // Save to localStorage for demo persistence
                                localStorage.setItem("featured_report_ids", JSON.stringify(selectedReports))
                                toast.success("Reports updated on the main Reports page")
                                setSelectedReports([])
                            }}>
                                <Star className="w-4 h-4 mr-2" />
                                Show on Reports Page
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleBulkPauseResume}>
                                Toggle Status
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleBulkDelete} className="text-red-600 hover:text-red-700">
                                <Trash className="w-4 h-4 mr-1" />
                                Delete
                            </Button>
                            <Button variant="ghost" size="sm" onClick={handleExport}>
                                <Download className="w-4 h-4 mr-1" />
                                Export Selected
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedReports([])} className="ml-auto">
                                Clear
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 font-semibold text-gray-600 dark:text-gray-400">
                        <tr>
                            <th className="p-4 w-10">
                                <input
                                    type="checkbox"
                                    checked={selectedReports.length === filteredData.length && filteredData.length > 0}
                                    onChange={handleSelectAll}
                                    className="rounded border-gray-300"
                                />
                            </th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Report Type</th>
                            <th className="p-4">Date Last Modified</th>
                            <th className="p-4">Schedule Details</th>
                            <th className="p-4">Schedule Status</th>
                            <th className="p-4 w-20"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {paginatedGroups.map((group) => (
                            <React.Fragment key={group.key}>
                                {/* Group Header (only if grouped) */}
                                {groupBy !== 'none' && (
                                    <tr className="bg-gray-100">
                                        <td colSpan={7} className="p-3 font-semibold text-gray-700">
                                            {group.label} ({group.items.length})
                                        </td>
                                    </tr>
                                )}

                                {/* Group Items */}
                                {group.items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-6 text-center text-muted-foreground">
                                            No reports found
                                        </td>
                                    </tr>
                                ) : (
                                    group.items.map((report, idx) => (
                                        <tr
                                            key={report.id}
                                            style={{ backgroundColor: idx % 2 === 1 ? '#f1f5f9' : '#ffffff' }}
                                            className="transition-colors hover:bg-gray-200"
                                        >
                                            <td className="p-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedReports.includes(report.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedReports(prev => [...prev, report.id])
                                                        } else {
                                                            setSelectedReports(prev => prev.filter(id => id !== report.id))
                                                        }
                                                    }}
                                                    className="rounded border-gray-300"
                                                />
                                            </td>
                                            <td className="p-4 font-medium text-gray-900 dark:text-gray-100 hover:underline cursor-pointer">
                                                {report.name}
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-400">{report.type}</td>
                                            <td className="p-4 text-gray-600 dark:text-gray-400">{report.lastModified}</td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">{report.scheduleMeta}</span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{report.nextSchedule}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {report.status === "Active" ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                                                        {report.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedReport(report)
                                                            setEditScheduleOpen(true)
                                                        }}>
                                                            <Pencil className="w-4 h-4 mr-2" />
                                                            Edit Schedule
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => {
                                                            setData(prev => prev.map(item =>
                                                                item.id === report.id
                                                                    ? { ...item, status: item.status === 'Active' ? 'Paused' : 'Active' }
                                                                    : item
                                                            ))
                                                        }}>
                                                            {report.status === 'Active' ? "Pause Delivery" : "Resume Delivery"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => setReportToDelete(report)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash className="w-4 h-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4">
                <PaginationFooter
                    page={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    from={filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                    to={Math.min(currentPage * pageSize, filteredData.length)}
                    total={filteredData.length}
                    pageSize={pageSize}
                    onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
                    className="border-none shadow-none bg-transparent p-0"
                />
            </div>

            {/* Edit Schedule Dialog */}
            <EditScheduleDialog
                key={selectedReport?.id || "edit-dialog"}
                open={editScheduleOpen}
                onOpenChange={setEditScheduleOpen}
                initialData={selectedReport}
                onSave={(newData) => {
                    console.log("Saving schedule", newData)
                    toast.success("Schedule updated successfully")
                    setEditScheduleOpen(false)
                }}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={Boolean(reportToDelete)} onOpenChange={(open) => !open && setReportToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete report</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{reportToDelete?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (reportToDelete) {
                                    setData(prev => prev.filter(item => item.id !== reportToDelete.id))
                                    toast.success("Report deleted successfully")
                                }
                                setReportToDelete(null)
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
