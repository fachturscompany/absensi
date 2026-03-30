"use client"
export const dynamic = 'force-dynamic'

import React, { useState, useMemo, useEffect, useCallback } from "react"
import { format } from "date-fns"
import type { SelectedFilter, DateRange } from "@/components/insights/types"
import { Button } from "@/components/ui/button"
import { Download, Search, Filter, Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationFooter } from "@/components/customs/pagination-footer"

import { toast } from "sonner"
import { useTimezone } from "@/components/providers/timezone-provider"
import { exportToCSV, generateFilename } from "@/lib/export-utils"
import { TimesheetsFilterSidebar } from "@/components/timesheets/TimesheetsFilterSidebar"
import { InsightsHeader } from "@/components/insights/InsightsHeader"

import { EditTimeEntryDialog } from "@/components/timesheets/EditTimeEntryDialog"
import { SplitTimeEntryDialog } from "@/components/timesheets/SplitTimeEntryDialog"
import { DeleteTimeEntryDialog } from "@/components/timesheets/DeleteTimeEntryDialog"
import { AddTimeEntryDialog } from "@/components/timesheets/AddTimeEntryDialog"
import { QuickEditTimeDialog } from "@/components/timesheets/QuickEditTimeDialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TimesheetsToolbar } from "@/components/timesheets/TimesheetsToolbar"
import { TimesheetsTable } from "@/components/timesheets/TimesheetsTable"
import type { TimeEntry } from "@/lib/data/dummy-data"
import {
    getTimeEntries,
    getTimesheetMembers,
    getTimesheetProjects,
    getTimesheetTasks,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    type TimeEntryRow,
    type TimesheetMember,
    type TimesheetProject,
    type TimesheetTask,
} from "@/action/timesheets"
import { useOrgStore } from "@/store/org-store"
import { parse, differenceInSeconds } from "date-fns"

// ─── helpers ----------------------------------------------------------------

const getProjectInitial = (name: string) => name.charAt(0).toUpperCase()

/** Convert TimeEntryRow → TimeEntry for dialogs that require TimeEntry type */
function rowToTimeEntry(r: TimeEntryRow): TimeEntry {
    return {
        id: r.id,
        memberId: r.memberId,
        memberName: r.memberName,
        date: r.date,
        startTime: r.startTime,
        endTime: r.endTime,
        duration: r.duration,
        totalHours: r.totalHours,
        projectId: r.projectId,
        projectName: r.projectName,
        taskId: r.taskId,
        taskName: r.taskName,
        source: r.source,
        activityPct: r.activityPct,
        notes: r.notes,
        isIdle: r.isIdle,
        billable: r.billable,
    }
}

// ─── component ---------------------------------------------------------------

export default function ViewEditTimesheetsPage() {
    const timezone = useTimezone()
    const organizationId = useOrgStore((s) => s.organizationId)

    // ── filter state ─────────────────────────────────────────────────────────
    const [selectedFilter, setSelectedFilter] = useState<SelectedFilter>({ type: "members", all: true, id: "all" })
    const [dateRange, setDateRange] = useState<DateRange>({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        endDate: new Date(),
    })
    const [searchQuery, setSearchQuery] = useState("")
    const [filterSidebarOpen, setFilterSidebarOpen] = useState(false)
    const [sidebarFilters, setSidebarFilters] = useState({
        memberId: "all",
        projectId: "all",
        source: "all",
        status: "all",
    })

    // Per-user view state for tabs
    const [viewType, setViewType] = useState("members")

    // ── data state ───────────────────────────────────────────────────────────
    const [data, setData] = useState<TimeEntryRow[]>([])
    const [members, setMembers] = useState<TimesheetMember[]>([])
    const [projects, setProjects] = useState<TimesheetProject[]>([])
    const [tasks, setTasks] = useState<TimesheetTask[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)

    // ── dialog state ─────────────────────────────────────────────────────────
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [quickEditDialogOpen, setQuickEditDialogOpen] = useState(false)
    const [splitTimeEntryDialogOpen, setSplitTimeEntryDialogOpen] = useState(false)
    const [deleteEntryDialogOpen, setDeleteEntryDialogOpen] = useState(false)
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [activeEntry, setActiveEntry] = useState<TimeEntryRow | null>(null)
    const [activeQuickEditEntry, setActiveQuickEditEntry] = useState<TimeEntryRow | null>(null)

    // ── selection / collapse ─────────────────────────────────────────────────
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

    // ── load dropdown data once ───────────────────────────────────────────────
    useEffect(() => {
        async function loadDropdowns() {
            if (!organizationId) return
            const [membersRes, projectsRes, tasksRes] = await Promise.all([
                getTimesheetMembers(organizationId),
                getTimesheetProjects(organizationId),
                getTimesheetTasks(organizationId),
            ])
            if (membersRes.success) setMembers(membersRes.data)
            if (projectsRes.success) setProjects(projectsRes.data)
            if (tasksRes.success) setTasks(tasksRes.data)
        }
        loadDropdowns()
    }, [organizationId])

    // ── load entries (re-runs when date range changes) ────────────────────────
    const loadEntries = useCallback(async () => {
        setIsLoading(true)
        setLoadError(null)
        const startDate = dateRange.startDate ? format(dateRange.startDate, "yyyy-MM-dd") : undefined
        const endDate = dateRange.endDate ? format(dateRange.endDate, "yyyy-MM-dd") : undefined
        const params = { startDate, endDate, organizationId: organizationId ?? undefined }

        const res = await getTimeEntries(params)

        if (res.success) {
            setData(res.data)
        } else {
            const errMsg = (res as any).message || "Unknown error"
            setLoadError(errMsg)
            toast.error(`Gagal memuat data: ${errMsg}`)
        }
        setIsLoading(false)
    }, [dateRange, organizationId])

    useEffect(() => {
        loadEntries()
    }, [loadEntries])

    // ── client-side filtering ─────────────────────────────────────────────────
    const filteredData = useMemo((): TimeEntryRow[] => {
        return data.filter(item => {
            if (!selectedFilter.all && selectedFilter.id !== "all") {
                if (selectedFilter.type === "members" && item.memberId !== selectedFilter.id) return false
            }
            if (sidebarFilters.memberId !== "all" && item.memberId !== sidebarFilters.memberId) return false
            if (sidebarFilters.projectId !== "all" && item.projectId !== sidebarFilters.projectId) return false
            if (sidebarFilters.source !== "all" && item.source !== sidebarFilters.source) return false

            if (searchQuery) {
                const lower = searchQuery.toLowerCase()
                if (
                    !item.memberName.toLowerCase().includes(lower) &&
                    !item.projectName.toLowerCase().includes(lower) &&
                    (!item.notes || !item.notes.toLowerCase().includes(lower))
                ) return false
            }
            return true
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [selectedFilter, sidebarFilters, searchQuery, data])

    const totalPages = Math.ceil(filteredData.length / pageSize)
    const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize)

    // ── group collapse ────────────────────────────────────────────────────────
    const toggleGroup = (date: string) => {
        const s = new Set(collapsedGroups)
        s.has(date) ? s.delete(date) : s.add(date)
        setCollapsedGroups(s)
    }

    // ── selection ─────────────────────────────────────────────────────────────
    const toggleRow = (id: string) => {
        const s = new Set(selectedRows)
        s.has(id) ? s.delete(id) : s.add(id)
        setSelectedRows(s)
    }

    const toggleGroupSelection = (date: string, currentRows: TimeEntryRow[]) => {
        const dateRows = currentRows.filter(r => r.date === date)
        const allSelected = dateRows.every(r => selectedRows.has(r.id))
        const s = new Set(selectedRows)
        allSelected ? dateRows.forEach(r => s.delete(r.id)) : dateRows.forEach(r => s.add(r.id))
        setSelectedRows(s)
    }

    const toggleAll = () => {
        setSelectedRows(
            selectedRows.size === paginatedData.length ? new Set() : new Set(paginatedData.map(d => d.id))
        )
    }

    // ── bulk export ───────────────────────────────────────────────────────────
    const handleBulkExport = () => {
        const selectedData = filteredData.filter(item => selectedRows.has(item.id))
        exportToCSV({
            filename: generateFilename("selected-timesheets"),
            columns: [
                { key: "memberName", label: "Member" },
                { key: "date", label: "Date" },
                { key: "startTime", label: "Start Time" },
                { key: "endTime", label: "End Time" },
                { key: "duration", label: "Duration" },
                { key: "projectName", label: "Project" },
                { key: "taskName", label: "Task" },
                { key: "source", label: "Source" },
                { key: "activityPct", label: "Activity %" },
                { key: "notes", label: "Notes" },
            ],
            data: selectedData as unknown as Record<string, unknown>[],
        })
        toast.success(`Exported ${selectedData.length} entries`)
        setSelectedRows(new Set())
    }

    // ── edit ──────────────────────────────────────────────────────────────────
    const handleEdit = (entry: TimeEntryRow) => {
        setActiveEntry(entry)
        setEditDialogOpen(true)
    }

    const handleSaveEntry = async (entry: Partial<TimeEntry>) => {
        if (!activeEntry) return
        // entry comes from the dialog (TimeEntry type), activeEntry is TimeEntryRow
        const id = parseInt(activeEntry.id)

        // Compute updated duration_seconds if times changed
        let durationSeconds: number | undefined
        const startTime = entry.startTime || activeEntry.startTime
        const endTime = entry.endTime || activeEntry.endTime
        if (startTime && endTime) {
            const base = new Date()
            const s = parse(startTime, "HH:mm:ss", base)
            const e = parse(endTime, "HH:mm:ss", base)
            durationSeconds = Math.max(0, differenceInSeconds(e, s))
        }

        const res = await updateTimeEntry(id, {
            project_id: entry.projectId ? parseInt(entry.projectId) : undefined,
            task_id: entry.taskId ? parseInt(entry.taskId) : null,
            entry_date: entry.date,
            starts_at: entry.date && startTime ? `${entry.date}T${startTime}` : undefined,
            stops_at: entry.date && endTime ? `${entry.date}T${endTime}` : undefined,
            duration_seconds: durationSeconds,
            source: entry.source,
            notes: entry.notes,
            is_billable: entry.billable,
        })

        if (res.success) {
            toast.success("Time entry updated")
            await loadEntries()
        } else {
            toast.error(res.message || "Failed to update")
        }
    }

    const handleQuickEdit = (entry: TimeEntryRow) => {
        setActiveQuickEditEntry(entry)
        setQuickEditDialogOpen(true)
    }

    const handleQuickEditSave = async (entry: Partial<TimeEntry>) => {
        if (!activeQuickEditEntry) return
        await handleSaveEntry({ ...rowToTimeEntry(activeQuickEditEntry), ...entry })
        setActiveQuickEditEntry(null)
    }

    // ── split ─────────────────────────────────────────────────────────────────
    const handleSplitTime = (entry: TimeEntryRow) => {
        setActiveEntry(entry)
        setSplitTimeEntryDialogOpen(true)
    }

    const onSplitTimeSave = async (
        originalId: string,
        entry1: Partial<TimeEntry>,
        entry2: Partial<TimeEntry>
    ) => {
        // Delete original and add two new ones
        await deleteTimeEntry(parseInt(originalId))

        const toPayload = (e: Partial<TimeEntry>) => {
            const s = parse(e.startTime || "00:00:00", "HH:mm:ss", new Date())
            const end = parse(e.endTime || "00:00:00", "HH:mm:ss", new Date())
            return {
                organization_member_id: parseInt(e.memberId || "0"),
                project_id: e.projectId ? parseInt(e.projectId) : null,
                task_id: e.taskId ? parseInt(e.taskId) : null,
                entry_date: e.date || activeEntry!.date,
                starts_at: `${e.date || activeEntry!.date}T${e.startTime || "00:00:00"}`,
                stops_at: `${e.date || activeEntry!.date}T${e.endTime || "00:00:00"}`,
                duration_seconds: Math.max(0, differenceInSeconds(end, s)),
                source: e.source,
                notes: e.notes,
                is_billable: e.billable,
            }
        }

        await Promise.all([addTimeEntry(toPayload(entry1)), addTimeEntry(toPayload(entry2))])
        toast.success("Time entry split successfully")
        await loadEntries()
    }

    // ── delete ────────────────────────────────────────────────────────────────
    const handleDeleteEntryClick = (entry: TimeEntryRow) => {
        setActiveEntry(entry)
        setDeleteEntryDialogOpen(true)
    }

    const onConfirmDelete = async () => {
        if (!activeEntry) return
        const res = await deleteTimeEntry(parseInt(activeEntry.id))
        if (res.success) {
            toast.success("Time entry deleted")
            await loadEntries()
        } else {
            toast.error(res.message || "Failed to delete")
        }
    }

    // ── add ───────────────────────────────────────────────────────────────────
    const handleAddEntry = async (entry: Partial<TimeEntry>) => {
        if (!entry.startTime || !entry.endTime || !entry.date) {
            toast.error("Missing required fields")
            return
        }

        const base = new Date()
        const s = parse(entry.startTime, "HH:mm", base)
        const e = parse(entry.endTime, "HH:mm", base)
        const durationSeconds = Math.max(0, differenceInSeconds(e, s))

        const res = await addTimeEntry({
            organization_member_id: parseInt(entry.memberId || "0"),
            project_id: entry.projectId ? parseInt(entry.projectId) : null,
            task_id: entry.taskId ? parseInt(entry.taskId) : null,
            entry_date: entry.date,
            starts_at: `${entry.date}T${entry.startTime}:00`,
            stops_at: `${entry.date}T${entry.endTime}:00`,
            duration_seconds: durationSeconds,
            source: entry.source,
            notes: entry.notes,
            is_billable: entry.billable ?? true,
        })

        if (res.success) {
            toast.success("Time entry added")
            await loadEntries()
        } else {
            toast.error(res.message || "Failed to add time entry")
        }
    }

    // ── visible cols ──────────────────────────────────────────────────────────
    const visibleCols = {
        checkbox: true,
        project: true,
        activity: true,
        idle: true,
        manual: true,
        duration: true,
        source: true,
        time: true,
        actions: true,
    }

    // ─── render ───────────────────────────────────────────────────────────────
    return (
        <div className="px-6 pb-6 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
                <h1 className="text-xl font-semibold text-left">View &amp; Edit Timesheets</h1>
                
                <Tabs value={viewType} onValueChange={setViewType} className="w-auto mx-auto sm:mx-0">
                    <TabsList className="rounded-full h-10 p-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                        <TabsTrigger value="members" className="rounded-full px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white">Members</TabsTrigger>
                        <TabsTrigger value="week" className="rounded-full px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white">Week</TabsTrigger>
                        <TabsTrigger value="day" className="rounded-full px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white">Day</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <InsightsHeader
                selectedFilter={selectedFilter}
                onSelectedFilterChange={setSelectedFilter}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                members={members.map(m => ({ id: m.id, name: m.name }))}
                teams={[]}
                hideTeamsTab={true}
                timezone={timezone}
            >
                <TimesheetsToolbar
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    onFilterClick={() => setFilterSidebarOpen(true)}
                    onAddTimeClick={() => setAddDialogOpen(true)}
                />
            </InsightsHeader>

            {/* Table */}
            <TimesheetsTable
                paginatedData={paginatedData}
                isLoading={isLoading}
                loadError={loadError}
                loadEntries={loadEntries}
                visibleCols={visibleCols}
                selectedRows={selectedRows}
                collapsedGroups={collapsedGroups}
                toggleAll={toggleAll}
                toggleRow={toggleRow}
                toggleGroup={toggleGroup}
                toggleGroupSelection={toggleGroupSelection}
                handleQuickEdit={handleQuickEdit}
                handleEdit={handleEdit}
                handleSplitTime={handleSplitTime}
                handleDeleteEntryClick={handleDeleteEntryClick}
                getProjectInitial={getProjectInitial}
            />

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

            {/* Sidebar filter */}
            <TimesheetsFilterSidebar
                open={filterSidebarOpen}
                onOpenChange={setFilterSidebarOpen}
                members={members.map(m => ({ id: m.id, name: m.name, email: m.email, activityScore: 0 }))}
                projects={projects.map(p => ({
                    id: p.id,
                    name: p.name,
                    clientId: null,
                    clientName: null,
                    billable: true,
                    disableActivity: false,
                    allowTracking: true,
                    disableIdle: false,
                    archived: false,
                    color: "#6B7280",
                    budgetLabel: "",
                    memberLimitLabel: "",
                    todosLabel: "",
                    createdAt: "",
                }))}
                onApply={setSidebarFilters}
            />

            {/* Dialogs */}
            <EditTimeEntryDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                initialData={activeEntry ? rowToTimeEntry(activeEntry) : null}
                onSave={handleSaveEntry}
            />

            <SplitTimeEntryDialog
                open={splitTimeEntryDialogOpen}
                onOpenChange={setSplitTimeEntryDialogOpen}
                initialData={activeEntry ? rowToTimeEntry(activeEntry) : null}
                projects={projects.map(p => ({
                    id: p.id,
                    name: p.name,
                    clientId: null,
                    clientName: null,
                    billable: true,
                    disableActivity: false,
                    allowTracking: true,
                    disableIdle: false,
                    archived: false,
                    color: "#6B7280",
                    budgetLabel: "",
                    memberLimitLabel: "",
                    todosLabel: "",
                    createdAt: "",
                }))}
                tasks={tasks.map(t => ({
                    id: t.id,
                    title: t.title,
                    assignee: "",
                    type: "Task",
                    created: "",
                    project: "",
                    status: "task" as const,
                    completed: false,
                }))}
                onSave={onSplitTimeSave}
            />

            <AddTimeEntryDialog
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
                onSave={handleAddEntry}
                members={members}
                projects={projects}
                tasks={tasks}
            />

            <QuickEditTimeDialog
                open={quickEditDialogOpen}
                onOpenChange={setQuickEditDialogOpen}
                initialData={activeQuickEditEntry ? rowToTimeEntry(activeQuickEditEntry) : null}
                onSave={handleQuickEditSave}
            />

            <DeleteTimeEntryDialog
                open={deleteEntryDialogOpen}
                onOpenChange={setDeleteEntryDialogOpen}
                onConfirm={onConfirmDelete}
            />

            {/* Bulk action bar */}
            {selectedRows.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-black border dark:border-white/10 shadow-lg rounded-full px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-4 z-50 animate-in slide-in-from-bottom-5 max-w-[calc(100vw-2rem)] overflow-x-auto">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 border-r dark:border-white/10 pr-3 sm:pr-4 whitespace-nowrap">
                        {selectedRows.size} selected
                    </span>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="default" onClick={handleBulkExport} className="h-8 cursor-pointer px-2 sm:px-3">
                            <Download className="w-4 h-4 mr-0 sm:mr-2" />
                            <span className="hidden sm:inline">Export</span>
                        </Button>
                    </div>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 ml-2 rounded-full hover:bg-gray-100"
                        onClick={() => setSelectedRows(new Set())}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    )
}
