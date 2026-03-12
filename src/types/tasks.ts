import { ITask, IProject, IOrganization_member, ITaskStatus } from "@/interface"
import { RowSelectionState } from "@tanstack/react-table"

// ─── View & Tab ───────────────────────────────────────────────────────────────

export type CurrentView = "list" | "board" | "timeline"
export type ActiveTab = "active" | "completed" | "all"

// ─── Task Tree ────────────────────────────────────────────────────────────────
// Single source of truth — import TaskNode dari sini, bukan dari header.tsx

export type TaskNode = ITask & { children: TaskNode[] }

// ─── Layout ───────────────────────────────────────────────────────────────────

export interface TabCounts {
    active: number
    completed: number
    all: number
}

export interface TasksLayoutData {
    tasks: ITask[]
    members: IOrganization_member[]
    taskStatuses: ITaskStatus[]
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface TaskFilters {
    activeTab: ActiveTab
    searchQuery: string
    selectedProject: string
    selectedAssignee: string
}

// ─── Dialog State ─────────────────────────────────────────────────────────────

export interface TaskDialogState {
    // New task
    isNewTaskDialogOpen: boolean
    newTaskTitle: string
    newTaskProject: number | ""
    newTaskAssignee: number | ""
    newTaskStatus: number | ""
    // Delete
    taskToDelete: ITask | null
    // Edit
    editingTask: ITask | null
    editedTitle: string
    editedStatus: number | ""
    editedAssignee: number | ""
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface ListToolbarProps {
    searchQuery: string
    setSearchQuery: (q: string) => void
    selectedProject: string
    setSelectedProject: (p: string) => void
    selectedAssignee: string
    setSelectedAssignee: (a: string) => void
    projects: IProject[]
    members: IOrganization_member[]
    selectedCount: number
    taskTreeLength: number
    activeTab: ActiveTab
    rowSelection: RowSelectionState
    taskStatuses: ITaskStatus[]
    setTasks: (fn: (prev: ITask[]) => ITask[]) => void
    setRowSelection: (fn: (prev: RowSelectionState) => RowSelectionState) => void
}

export interface ListTabsProps {
    activeTab: ActiveTab
    setActiveTab: (tab: ActiveTab) => void
    baseFilteredTasks: ITask[]
}

export interface TaskTableProps {
    displayRows: { node: TaskNode; depth: number }[]
    isLoading: boolean
    allSelected: boolean
    toggleSelectAll: () => void
    rowSelection: RowSelectionState
    toggleSelect: (id: string) => void
    expandedTasks: Set<number>
    toggleExpand: (id: number) => void
    setEditingTask: (task: ITask) => void
    setEditedTitle: (t: string) => void
    setEditedStatus: (s: number | "") => void
    setEditedAssignee: (a: number | "") => void
    setTaskToDelete: (task: ITask) => void
}

export interface ListDialogsProps extends TaskDialogState {
    setIsNewTaskDialogOpen: (open: boolean) => void
    setNewTaskTitle: (v: string) => void
    setNewTaskProject: (v: number | "") => void
    setNewTaskAssignee: (v: number | "") => void
    setNewTaskStatus: (v: number | "") => void
    projects: IProject[]
    members: IOrganization_member[]
    taskStatuses: ITaskStatus[]
    setTasks: (fn: (prev: ITask[]) => ITask[]) => void
    setTaskToDelete: (t: ITask | null) => void
    setEditingTask: (t: ITask | null) => void
    setEditedTitle: (v: string) => void
    setEditedStatus: (v: number | "") => void
    setEditedAssignee: (v: number | "") => void
}

export interface ListPaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    isLoading: boolean
    taskTreeLength: number
    pageSize: number
    onPageSizeChange: (size: number) => void
}