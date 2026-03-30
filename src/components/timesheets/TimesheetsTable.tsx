"use client"
import React from "react"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Pencil } from "lucide-react"
import Link from "next/link"
import type { TimeEntryRow } from "@/action/timesheets"

export interface TimesheetsTableProps {
    paginatedData: TimeEntryRow[]
    isLoading: boolean
    loadError: string | null
    loadEntries: () => void
    visibleCols: {
        checkbox: boolean
        project: boolean
        activity: boolean
        idle: boolean
        manual: boolean
        duration: boolean
        source: boolean
        time: boolean
        actions: boolean
    }
    selectedRows: Set<string>
    collapsedGroups: Set<string>
    toggleAll: (checked: boolean) => void
    toggleRow: (id: string) => void
    toggleGroup: (date: string) => void
    toggleGroupSelection: (date: string, allData: TimeEntryRow[]) => void
    handleQuickEdit: (row: TimeEntryRow) => void
    handleEdit: (row: TimeEntryRow) => void
    handleSplitTime: (row: TimeEntryRow) => void
    handleDeleteEntryClick: (row: TimeEntryRow) => void
    getProjectInitial: (name: string) => string
}

export function TimesheetsTable({
    paginatedData,
    isLoading,
    loadError,
    loadEntries,
    visibleCols,
    selectedRows,
    collapsedGroups,
    toggleAll,
    toggleRow,
    toggleGroup,
    toggleGroupSelection,
    handleQuickEdit,
    handleEdit,
    handleSplitTime,
    handleDeleteEntryClick,
    getProjectInitial
}: TimesheetsTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="border-t border-b border-border bg-gray-50/50 dark:bg-white/5">
                    <tr>
                        {visibleCols.checkbox && (
                            <th className="p-4 w-10">
                                <Checkbox
                                    checked={paginatedData.length > 0 && selectedRows.size === paginatedData.length}
                                    onCheckedChange={toggleAll}
                                />
                            </th>
                        )}
                        {visibleCols.project && <th className="p-4 font-semibold">Project</th>}
                        {visibleCols.activity && <th className="p-4 font-semibold uppercase text-[10px] tracking-wider text-gray-500">Activity</th>}
                        {visibleCols.idle && <th className="p-4 font-semibold uppercase text-[10px] tracking-wider text-gray-500">Idle</th>}
                        {visibleCols.manual && <th className="p-4 font-semibold uppercase text-[10px] tracking-wider text-gray-500">Manual</th>}
                        {visibleCols.duration && <th className="p-4 font-semibold uppercase text-[10px] tracking-wider text-gray-500">Duration</th>}
                        {visibleCols.source && <th className="p-4 font-semibold uppercase text-[10px] tracking-wider text-gray-500">Source</th>}
                        {visibleCols.time && <th className="p-4 font-semibold uppercase text-[10px] tracking-wider text-gray-500">Time</th>}
                        {visibleCols.actions && <th className="p-4 font-semibold uppercase text-[10px] tracking-wider text-gray-500">Actions</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                {isLoading ? (
                    <tr>
                        <td colSpan={10} className="p-8 text-center text-gray-500">
                            <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 dark:border-white" />
                                Memuat data...
                            </div>
                        </td>
                    </tr>
                ) : loadError ? (
                    <tr>
                        <td colSpan={10} className="p-6">
                            <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
                                <p className="font-semibold text-red-700 dark:text-red-400 mb-1">⛔ Gagal memuat time entries</p>
                                <p className="text-sm text-red-600 dark:text-red-300 font-mono">{loadError}</p>
                                <button
                                    onClick={loadEntries}
                                    className="mt-3 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-700 dark:text-red-200 px-3 py-1 rounded"
                                >
                                    Coba Lagi
                                </button>
                            </div>
                        </td>
                    </tr>
                ) : paginatedData.length === 0 ? (
                    <tr>
                        <td colSpan={10} className="p-6">
                            <div className="text-center text-gray-500 py-4">No time entries found.</div>
                        </td>
                    </tr>
                ) : (
                    paginatedData.map((row, index) => {
                        const showHeader = index === 0 || row.date !== paginatedData[index - 1]?.date
                        const isCollapsed = collapsedGroups.has(row.date)
                        const groupRows = paginatedData.filter(r => r.date === row.date)
                        const isGroupSelected = groupRows.length > 0 && groupRows.every(r => selectedRows.has(r.id))
                        const isGroupIndeterminate = groupRows.some(r => selectedRows.has(r.id)) && !isGroupSelected
                        const clientName = row.clientName || "No Client"

                        return (
                            <React.Fragment key={row.id}>
                                {showHeader && (
                                    <tr
                                        className="border-b border-border cursor-pointer hover:bg-muted/50 transition-colors group/header"
                                        onClick={() => toggleGroup(row.date)}
                                    >
                                        <td colSpan={10} className="p-4 font-bold text-gray-900 dark:text-gray-100 bg-gray-50/30 dark:bg-white/[0.02]">
                                            <div className="flex items-center gap-2">
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        checked={isGroupSelected || (isGroupIndeterminate ? "indeterminate" : false)}
                                                        onCheckedChange={() => toggleGroupSelection(row.date, paginatedData)}
                                                    />
                                                </div>
                                                {isCollapsed ? (
                                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover/header:text-gray-600 dark:group-hover/header:text-gray-300 transition-colors" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover/header:text-gray-600 dark:group-hover/header:text-gray-300 transition-colors" />
                                                )}
                                                <span className="tracking-tight">{format(new Date(row.date), "EEEE, dd MMMM yyyy")}</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {!isCollapsed && (
                                    <tr className="hover:bg-muted/50 transition-colors border-b border-border/50">
                                        {visibleCols.checkbox && (
                                            <td className="p-4">
                                                <Checkbox
                                                    checked={selectedRows.has(row.id)}
                                                    onCheckedChange={() => toggleRow(row.id)}
                                                />
                                            </td>
                                        )}
                                        {visibleCols.project && (
                                            <td className="p-4">
                                                <div className="flex items-start gap-4">
                                                    <Link href={`/projects/${row.projectId}`}>
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold text-sm shrink-0 hover:bg-gray-200 dark:hover:bg-white/10 cursor-pointer transition-colors border border-gray-100 dark:border-white/10 shadow-sm">
                                                            {getProjectInitial(row.projectName)}
                                                        </div>
                                                    </Link>
                                                    <div className="flex flex-col min-w-0">
                                                        <Link
                                                            href={`/projects/${row.projectId}`}
                                                            className="font-bold text-gray-900 dark:text-gray-100 hover:text-black dark:hover:text-white hover:underline cursor-pointer text-[15px] leading-tight truncate"
                                                        >
                                                            {row.projectName}
                                                        </Link>
                                                        <span className="text-[10px] uppercase text-gray-400 dark:text-gray-500 font-bold tracking-widest mt-0.5">
                                                            {clientName}
                                                        </span>
                                                        <Link
                                                            href={`/projects/tasks/list?project=${encodeURIComponent(row.projectName)}&q=${encodeURIComponent(row.taskName || "")}`}
                                                            className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:underline cursor-pointer mt-1 truncate"
                                                        >
                                                            {row.taskName || "No to-do"}
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        {visibleCols.activity && (
                                            <td className="p-4">
                                                <span className="text-gray-900 dark:text-gray-200 font-medium">{row.activityPct}%</span>
                                            </td>
                                        )}
                                        {visibleCols.idle && (
                                            <td className="p-4">
                                                <span className="text-gray-900 dark:text-gray-200 font-medium">{row.isIdle ? "100%" : "0%"}</span>
                                            </td>
                                        )}
                                        {visibleCols.manual && (
                                            <td className="p-4">
                                                <span className="text-gray-900 dark:text-gray-200 font-medium">
                                                    {row.source === "manual" ? "100%" : "0%"}
                                                </span>
                                            </td>
                                        )}
                                        {visibleCols.duration && (
                                            <td className="p-4">
                                                <span
                                                    className="text-[15px] font-bold text-gray-900 dark:text-gray-100 hover:underline cursor-pointer tabular-nums"
                                                    onClick={() => handleQuickEdit(row)}
                                                >
                                                    {row.duration}
                                                </span>
                                            </td>
                                        )}
                                        {visibleCols.source && (
                                            <td className="p-4">
                                                <span className="text-xs uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                                                    {row.source}
                                                </span>
                                            </td>
                                        )}
                                        {visibleCols.time && (
                                            <td className="p-4">
                                                <span
                                                    className="text-gray-900 dark:text-gray-200 font-medium tabular-nums hover:underline cursor-pointer"
                                                    onClick={() => handleQuickEdit(row)}
                                                >
                                                    {row.startTime} - {row.endTime}
                                                </span>
                                            </td>
                                        )}
                                        {visibleCols.actions && (
                                            <td className="p-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-9 w-9 p-0 bg-transparent dark:border-white/10 dark:hover:bg-white/5 shadow-none"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(row)}>
                                                            Edit time entry
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleSplitTime(row)}>
                                                            Split time entry
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteEntryClick(row)}
                                                            className="text-red-500 font-medium"
                                                        >
                                                            Delete this entry
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        )}
                                    </tr>
                                )}
                            </React.Fragment>
                        )
                    })
                )}
            </tbody>
        </table>
    </div>
)
}
