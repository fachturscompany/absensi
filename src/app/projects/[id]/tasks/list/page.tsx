"use client"

import { useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Search,
    Pencil,
    Trash2,
    ChevronRight,
    ChevronDown
} from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    buildTaskTree,
    flattenTree,
    TaskNode,
    StackedAssignees,
} from "@/components/projects/tasks/header"
import { TasksPageHeader, ActiveTab } from "@/components/projects/tasks/header"
import { PaginationFooter } from "@/components/tables/pagination-footer"
import { getTasksListPageData } from "@/action/projects/tasks/list"
import { createTask, updateTask, deleteTask, getTasks, assignTaskMember } from "@/action/task"
import { toast } from "sonner"
import { ITask, IOrganization_member, ITaskStatus } from "@/interface"
import { cn } from "@/lib/utils"

export default function ListPage({ params }: { params: Promise<{ id: string }> }) {
    const [projectId, setProjectId] = useState<string>("")
    const searchParams = useSearchParams()

    // ── Data state ─────────────────────────────────────────────────────────────
    const [tasks, setTasks] = useState<ITask[]>([])
    const [members, setMembers] = useState<IOrganization_member[]>([])
    const [taskStatuses, setTaskStatuses] = useState<ITaskStatus[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // ── Filters ────────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<ActiveTab>("active")
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
    const [selectedAssignee, setSelectedAssignee] = useState("all")

    // ── Pagination & tree ──────────────────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set())
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

    // ── Dialog state ───────────────────────────────────────────────────────────
    const [taskToDelete, setTaskToDelete] = useState<ITask | null>(null)
    const [editingTask, setEditingTask] = useState<ITask | null>(null)
    const [editTitle, setEditTitle] = useState("")
    const [editStatus, setEditStatus] = useState<number | "">("")
    const [editAssignee, setEditAssignee] = useState<number | "">("")

    // ── Resolve params ─────────────────────────────────────────────────────────
    useEffect(() => {
        params.then(({ id }) => setProjectId(id))
    }, [params])

    // ── 1 round-trip: fetch semua data sekaligus ───────────────────────────────
    useEffect(() => {
        if (!projectId) return
        setIsLoading(true)
        getTasksListPageData()
            .then(({ tasks, members, taskStatuses }) => {
                setTasks(tasks)
                setMembers(members)
                setTaskStatuses(taskStatuses)
            })
            .finally(() => setIsLoading(false))
    }, [projectId])

    // ── Reset page on filter change ────────────────────────────────────────────
    useEffect(() => {
        setRowSelection({})
        setCurrentPage(1)
    }, [activeTab, selectedAssignee, searchQuery])

    // ── Filtered tasks ─────────────────────────────────────────────────────────
    const filteredTasks = useMemo(() => {
        return tasks.filter((task: ITask) => {
            if (task.project_id !== Number(projectId)) return false

            const isDone = task.task_status?.code === "done"
            if (activeTab === "active" && isDone) return false
            if (activeTab === "completed" && !isDone) return false

            if (selectedAssignee !== "all") {
                const assigneeIds = task.assignees?.map(a =>
                    String(a.organization_member_id)
                ) ?? []
                if (!assigneeIds.includes(selectedAssignee)) return false
            }

            if (searchQuery) {
                const q = searchQuery.toLowerCase()
                const assigneeNames = task.assignees?.map(a => {
                    const u = a.member?.user
                    return (u?.display_name || `${u?.first_name || ""} ${u?.last_name || ""}`.trim()).toLowerCase()
                }) ?? []
                const matchesName = task.name.toLowerCase().includes(q)
                const matchesAssignee = assigneeNames.some(n => n.includes(q))
                if (!matchesName && !matchesAssignee) return false
            }

            return true
        })
    }, [tasks, projectId, activeTab, selectedAssignee, searchQuery])

    // ── Build tree & paginate ──────────────────────────────────────────────────
    const taskTree = useMemo(() => buildTaskTree(filteredTasks), [filteredTasks])

    const paginatedTree = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return taskTree.slice(start, start + pageSize)
    }, [taskTree, currentPage, pageSize])

    const displayRows = useMemo(
        () => flattenTree(paginatedTree, expandedTasks),
        [paginatedTree, expandedTasks],
    )

    const totalPages = Math.ceil(taskTree.length / pageSize) || 1

    // ── Selection helpers ──────────────────────────────────────────────────────
    const selectedIds = Object.keys(rowSelection).filter(k => rowSelection[k])
    const allSelected =
        paginatedTree.length > 0 &&
        paginatedTree.every((t: TaskNode) => rowSelection[t.id.toString()])

    const toggleSelectAll = () => {
        if (allSelected) {
            setRowSelection(prev => {
                const next = { ...prev }
                paginatedTree.forEach((t: TaskNode) => delete next[t.id.toString()])
                return next
            })
        } else {
            setRowSelection(prev => {
                const next = { ...prev }
                paginatedTree.forEach((t: TaskNode) => { next[t.id.toString()] = true })
                return next
            })
        }
    }

    const toggleSelect = (id: string) =>
        setRowSelection(prev => {
            const next = { ...prev }
            if (next[id]) delete next[id]; else next[id] = true
            return next
        })

    // ── Tab counts ─────────────────────────────────────────────────────────────
    const projectTasks = tasks.filter((t: ITask) => t.project_id === Number(projectId))
    const counts = {
        all: projectTasks.length,
        active: projectTasks.filter((t: ITask) => t.task_status?.code !== "done").length,
        completed: projectTasks.filter((t: ITask) => t.task_status?.code === "done").length,
    }

    // ── Helper: refresh tasks setelah mutasi ───────────────────────────────────
    const refreshTasks = async () => {
        const fresh = await getTasks()
        if (fresh.success) setTasks(fresh.data)
    }

    // ── CRUD handlers ──────────────────────────────────────────────────────────
    const handleCreate = async (
        title: string,
        assigneeId: number | "",
        statusId: number | "",
    ) => {
        const fd = new FormData()
        fd.append("name", title)
        fd.append("project_id", projectId)
        if (statusId) fd.append("status_id", statusId.toString())
        const res = await createTask(fd)
        if (res.success && res.data) {
            if (assigneeId) await assignTaskMember(res.data.id, Number(assigneeId))
            await refreshTasks()
            toast.success("Task created")
        } else {
            toast.error("Failed to create task")
        }
    }

    const handleUpdate = async () => {
        if (!editingTask || !editTitle.trim()) return
        const fd = new FormData()
        fd.append("id", editingTask.id.toString())
        fd.append("name", editTitle)
        if (editStatus) fd.append("status_id", editStatus.toString())
        const res = await updateTask(fd)
        if (res.success) {
            if (editAssignee) await assignTaskMember(editingTask.id, Number(editAssignee))
            await refreshTasks()
            setEditingTask(null)
            toast.success("Task updated")
        } else {
            toast.error("Failed to update task")
        }
    }

    const handleDelete = async () => {
        if (!taskToDelete) return
        const fd = new FormData()
        fd.append("id", taskToDelete.id.toString())
        const res = await deleteTask(fd)
        if (res.success) {
            setTasks(prev => prev.filter(t => t.id !== taskToDelete.id))
            toast.success("Task deleted")
        }
        setTaskToDelete(null)
    }

    const handleBatchAction = async () => {
        const newCode = activeTab === "active" ? "done" : "todo"
        const statusToApply = taskStatuses.find(s => s.code === newCode)
        if (!statusToApply) return

        // Optimistic update
        setTasks(prev =>
            prev.map(t =>
                selectedIds.includes(t.id.toString())
                    ? { ...t, status_id: statusToApply.id, task_status: statusToApply }
                    : t,
            ),
        )
        setRowSelection({})

        await Promise.all(
            selectedIds.map(id => {
                const fd = new FormData()
                fd.append("id", id)
                fd.append("status_id", statusToApply.id.toString())
                return updateTask(fd)
            }),
        )
        toast.success("Tasks updated")
    }

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-4 p-4 pt-0">

            <TasksPageHeader
                currentView="list"
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabCounts={counts}
                members={members}
                taskStatuses={taskStatuses}
                onCreateTask={handleCreate}
            />

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks or assignee..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All assignees" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All assignees</SelectItem>
                        {members.map(m => (
                            <SelectItem key={m.id} value={m.id.toString()}>
                                {m.user?.display_name ||
                                    `${m.user?.first_name || ""} ${m.user?.last_name || ""}`.trim() ||
                                    "Unknown"}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" disabled={selectedIds.length === 0}>
                            Batch actions
                            {selectedIds.length > 0 && (
                                <span className="ml-2 rounded-full bg-primary text-primary-foreground text-xs px-1.5">
                                    {selectedIds.length}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={handleBatchAction}>
                            {activeTab === "active" ? "Mark as completed" : "Reopen tasks"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table */}
            <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={toggleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>Task</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Assignee</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right w-24">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                                        Loading tasks...
                                    </TableCell>
                                </TableRow>
                            ) : displayRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                                        {searchQuery || selectedAssignee !== "all"
                                            ? "No tasks match your filters."
                                            : activeTab === "active"
                                                ? "No active tasks. Create one to get started."
                                                : "No tasks found."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                displayRows.map(({ node: task, depth, hasChildren }) => {
                                    const isExpanded = expandedTasks.has(task.id)
                                    const clientData = task.project?.client
                                    const clientName = Array.isArray(clientData)
                                        ? clientData[0]?.name
                                        : (clientData as any)?.name

                                    return (
                                        <TableRow
                                            key={task.id}
                                            className={cn(depth > 0 && "bg-muted/30")}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={!!rowSelection[task.id.toString()]}
                                                    onCheckedChange={() => toggleSelect(task.id.toString())}
                                                />
                                            </TableCell>

                                            <TableCell className="min-w-[280px]">
                                                <div
                                                    className="flex items-center gap-1"
                                                    style={{ paddingLeft: `${depth * 24}px` }}
                                                >
                                                    {hasChildren ? (
                                                        <button
                                                            onClick={() =>
                                                                setExpandedTasks(prev => {
                                                                    const next = new Set(prev)
                                                                    if (next.has(task.id)) next.delete(task.id)
                                                                    else next.add(task.id)
                                                                    return next
                                                                })
                                                            }
                                                            className="p-0.5 rounded hover:bg-muted shrink-0"
                                                        >
                                                            {isExpanded
                                                                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                                : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                                        </button>
                                                    ) : (
                                                        <span className="w-5 shrink-0" />
                                                    )}
                                                    <span className={cn(
                                                        "text-sm font-medium line-clamp-2",
                                                        task.task_status?.code === "done" &&
                                                        "line-through text-muted-foreground",
                                                    )}>
                                                        {task.name}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {task.task_status ? (
                                                    <span
                                                        className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide"
                                                        style={{
                                                            backgroundColor: `${task.task_status.color}20`,
                                                            color: task.task_status.color,
                                                        }}
                                                    >
                                                        {task.task_status.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">—</span>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                {task.assignees?.length ? (
                                                    <StackedAssignees assignees={task.assignees} max={3} />
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Unassigned</span>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-sm text-muted-foreground">
                                                {clientName || "—"}
                                            </TableCell>

                                            <TableCell className="text-sm text-muted-foreground">
                                                {task.created_at
                                                    ? new Date(task.created_at).toLocaleDateString("id-ID", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                    })
                                                    : "—"}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => {
                                                        setEditingTask(task)
                                                        setEditTitle(task.name)
                                                        setEditStatus(task.status_id || "")
                                                        setEditAssignee(
                                                            Number(task.assignees?.[0]?.organization_member_id) || "",
                                                        )
                                                    }}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => setTaskToDelete(task)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            <PaginationFooter
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
                from={taskTree.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                to={Math.min(currentPage * pageSize, taskTree.length)}
                total={taskTree.length}
                pageSize={pageSize}
                onPageSizeChange={(size: number) => {
                    setPageSize(size)
                    setCurrentPage(1)
                }}
            />

            {/* ── Edit Task Dialog ────────────────────────────────────────────── */}
            <Dialog open={!!editingTask} onOpenChange={open => !open && setEditingTask(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        <Input
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleUpdate()}
                            autoFocus
                        />
                        <Select
                            value={editStatus.toString()}
                            onValueChange={v => setEditStatus(Number(v))}
                        >
                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                                {taskStatuses.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={editAssignee.toString()}
                            onValueChange={v => setEditAssignee(Number(v))}
                        >
                            <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                            <SelectContent>
                                {members.map(m => (
                                    <SelectItem key={m.id} value={m.id.toString()}>
                                        {m.user?.display_name ||
                                            `${m.user?.first_name || ""} ${m.user?.last_name || ""}`.trim()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
                        <Button onClick={handleUpdate} disabled={!editTitle.trim()}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Dialog ───────────────────────────────────────────────── */}
            <Dialog open={!!taskToDelete} onOpenChange={open => !open && setTaskToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Task</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete{" "}
                        <span className="font-medium text-foreground">"{taskToDelete?.name}"</span>?
                        This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTaskToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
