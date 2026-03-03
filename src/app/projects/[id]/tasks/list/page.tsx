"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronRight, ChevronDown, Pencil, Trash2 } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    useTasksData,
    AssigneeAvatar,
    buildTaskTree,
    flattenTree,
    TaskNode,
    TasksViewSwitcher,
} from "@/components/tasks/tasks-shared"
import { useMemo, useState, useEffect, use } from "react"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus } from "lucide-react"
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
import { PaginationFooter } from "@/components/tables/pagination-footer"
import { createTask, updateTask, deleteTask, getTasks, assignTaskMember } from "@/action/task"
import { toast } from "sonner"
import { ITask, IProject, IOrganization_member, ITaskStatus } from "@/interface"
import { RowSelectionState } from "@tanstack/react-table"
import { cn } from "@/lib/utils"

export default function ListPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = use(params)
    const { tasks, setTasks, projects, members, taskStatuses, isLoading } = useTasksData()
    const searchParams = useSearchParams()
    const initialProject = searchParams.get("project")
    const urlClientName = searchParams.get("client")

    const [activeTab, setActiveTab] = useState<"active" | "completed" | "all">("active")
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set())

    const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false)
    const [taskToDelete, setTaskToDelete] = useState<ITask | null>(null)
    const [editingTask, setEditingTask] = useState<ITask | null>(null)

    // Form states
    const [editedTitle, setEditedTitle] = useState("")
    const [editedAssignee, setEditedAssignee] = useState<number | "">("")
    const [newTaskTitle, setNewTaskTitle] = useState("")
    const [newTaskAssignee, setNewTaskAssignee] = useState<number | "">("")
    const [newTaskProject, setNewTaskProject] = useState<number | "">(Number(projectId) || "")
    const [newTaskStatus, setNewTaskStatus] = useState<number | "">("")
    const [editedStatus, setEditedStatus] = useState<number | "">("")

    // Filter states
    const [selectedProject, setSelectedProject] = useState(initialProject || "all")
    const [selectedAssignee, setSelectedAssignee] = useState("all")

    const toggleExpand = (id: number) => {
        setExpandedTasks(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id); else next.add(id)
            return next
        })
    }

    const baseFilteredTasks = useMemo(() => {
        return tasks.filter((task: ITask) => {
            if (projectId && task.project_id !== Number(projectId)) return false
            if (urlClientName) {
                const clientData = (task.project as any)?.client
                const clientNames: string[] = Array.isArray(clientData)
                    ? clientData.map((c: any) => c.name)
                    : [clientData?.name].filter(Boolean)
                if (!clientNames.some(name => name.toLowerCase() === urlClientName.toLowerCase())) return false
            }
            if (selectedProject !== "all" && task.project?.name !== selectedProject) return false
            const assigneeName = task.assignees?.[0]?.member?.user?.display_name ||
                `${task.assignees?.[0]?.member?.user?.first_name || ''} ${task.assignees?.[0]?.member?.user?.last_name || ''}`.trim()
            if (selectedAssignee !== "all" && assigneeName !== selectedAssignee) return false
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                if (!task.name.toLowerCase().includes(query) && !assigneeName.toLowerCase().includes(query)) return false
            }
            return true
        })
    }, [tasks, selectedProject, selectedAssignee, searchQuery, urlClientName])

    const { taskTree } = useMemo(() => {
        const filtered = baseFilteredTasks.filter((task: ITask) => {
            if (activeTab === "all") return true
            const isCompleted = task.task_status?.code === 'done'
            if (activeTab === "active" && isCompleted) return false
            if (activeTab === "completed" && !isCompleted) return false
            return true
        })
        return {
            taskTree: buildTaskTree(filtered)
        }
    }, [baseFilteredTasks, activeTab])

    const paginatedTree = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        const end = start + pageSize
        return taskTree.slice(start, end)
    }, [taskTree, currentPage, pageSize])

    const displayRows = useMemo(() => flattenTree(paginatedTree, expandedTasks), [paginatedTree, expandedTasks])

    const selectedCount = Object.keys(rowSelection).filter(k => rowSelection[k]).length
    const totalPages = Math.ceil(taskTree.length / pageSize) || 1

    useEffect(() => {
        setRowSelection({})
        setCurrentPage(1)
    }, [activeTab, selectedProject, selectedAssignee, searchQuery])

    const allSelected = paginatedTree.length > 0 && paginatedTree.every((t: TaskNode) => rowSelection[t.id.toString()])

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

    const toggleSelect = (id: string) => {
        setRowSelection(prev => {
            const next = { ...prev }
            if (next[id]) delete next[id]; else next[id] = true
            return next
        })
    }

    return (
        <div className="flex flex-col gap-4 p-4 pt-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-1" />
                <div className="flex items-center gap-2">
                    <Button onClick={() => { setNewTaskTitle(""); setIsNewTaskDialogOpen(true) }} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New
                    </Button>
                    <TasksViewSwitcher currentView="list" />
                </div>
            </div>

            <ListTabs activeTab={activeTab} setActiveTab={setActiveTab} baseFilteredTasks={baseFilteredTasks} />

            <div className="space-y-6">
                <ListToolbar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedProject={selectedProject}
                    setSelectedProject={setSelectedProject}
                    selectedAssignee={selectedAssignee}
                    setSelectedAssignee={setSelectedAssignee}
                    projects={projects}
                    members={members}
                    selectedCount={selectedCount}
                    taskTreeLength={taskTree.length}
                    activeTab={activeTab}
                    rowSelection={rowSelection}
                    taskStatuses={taskStatuses}
                    setTasks={setTasks}
                    setRowSelection={setRowSelection}
                />



                {/* List View */}
                <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                                    </TableHead>
                                    <TableHead>Task</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Assignee</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={8} className="text-center py-10">Loading...</TableCell></TableRow>
                                ) : displayRows.length === 0 ? (
                                    <TableRow><TableCell colSpan={8} className="text-center py-10">No tasks found</TableCell></TableRow>
                                ) : (
                                    displayRows.map(({ node: task, depth }) => {
                                        const hasChildren = task.children.length > 0
                                        const isExpanded = expandedTasks.has(task.id)
                                        const clientData = task.project?.client
                                        const clientName = Array.isArray(clientData) ? clientData[0]?.name : (clientData as any)?.name

                                        return (
                                            <TableRow key={`${task.id}-${depth}`} className={cn(depth > 0 && "bg-muted/10")}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={!!rowSelection[task.id.toString()]}
                                                        onCheckedChange={() => toggleSelect(task.id.toString())}
                                                    />
                                                </TableCell>
                                                <TableCell className="min-w-[300px]">
                                                    <div className="flex items-start gap-1" style={{ paddingLeft: `${depth * 28}px` }}>
                                                        {hasChildren && (
                                                            <button onClick={() => toggleExpand(task.id)} className="p-1">
                                                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                            </button>
                                                        )}
                                                        <div className="min-w-0">
                                                            <span className={cn(
                                                                "text-sm block leading-tight break-words line-clamp-2 font-medium",
                                                                task.task_status?.code === 'done' && "text-muted-foreground line-through"
                                                            )}>
                                                                {task.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div
                                                        className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase"
                                                        style={{ backgroundColor: `${task.task_status?.color}15`, color: task.task_status?.color }}
                                                    >
                                                        {task.task_status?.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex -space-x-2">
                                                        {task.assignees?.map(asgn => <AssigneeAvatar key={asgn.id} asgn={asgn} />)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="min-w-[150px]">
                                                    <span className="text-sm line-clamp-2 break-words">{task.project?.name}</span>
                                                </TableCell>
                                                <TableCell className="min-w-[150px]">
                                                    <span className="text-sm line-clamp-2 break-words">{clientName}</span>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {task.created_at && new Date(task.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingTask(task)
                                                            setEditedTitle(task.name)
                                                            setEditedStatus(task.status_id || "")
                                                            setEditedAssignee(Number(task.assignees?.[0]?.organization_member_id) || "")
                                                        }}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="ml-1"
                                                        onClick={() => setTaskToDelete(task)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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

                <ListPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    isLoading={isLoading}
                    taskTreeLength={taskTree.length}
                    pageSize={pageSize}
                    onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
                />
            </div>

            <ListDialogs
                isNewTaskDialogOpen={isNewTaskDialogOpen}
                setIsNewTaskDialogOpen={setIsNewTaskDialogOpen}
                newTaskTitle={newTaskTitle}
                setNewTaskTitle={setNewTaskTitle}
                newTaskProject={newTaskProject}
                setNewTaskProject={setNewTaskProject}
                newTaskAssignee={newTaskAssignee}
                setNewTaskAssignee={setNewTaskAssignee}
                newTaskStatus={newTaskStatus}
                setNewTaskStatus={setNewTaskStatus}
                projects={projects}
                members={members}
                taskStatuses={taskStatuses}
                setTasks={setTasks}
                taskToDelete={taskToDelete}
                setTaskToDelete={setTaskToDelete}
                editingTask={editingTask}
                setEditingTask={setEditingTask}
                editedTitle={editedTitle}
                setEditedTitle={setEditedTitle}
                editedStatus={editedStatus}
                setEditedStatus={setEditedStatus}
                editedAssignee={editedAssignee}
                setEditedAssignee={setEditedAssignee}
            />
        </div>
    )
}

// ─── Local Components ─────────────────────────────────────────────────────────

function ListTabs({ activeTab, setActiveTab, baseFilteredTasks }: {
    activeTab: "active" | "completed" | "all"
    setActiveTab: (tab: "active" | "completed" | "all") => void
    baseFilteredTasks: ITask[]
}) {
    return (
        <div className="flex items-center gap-6 text-sm">
            <button
                className={`pb-2 border-b-2 ${activeTab === "all" ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                onClick={() => setActiveTab("all")}
            >
                ALL ({baseFilteredTasks.length})
            </button>
            <button
                className={`pb-2 border-b-2 ${activeTab === "active" ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                onClick={() => setActiveTab("active")}
            >
                ACTIVE ({baseFilteredTasks.filter(t => t.task_status?.code !== 'done').length})
            </button>
            <button
                className={`pb-2 border-b-2 ${activeTab === "completed" ? "border-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                onClick={() => setActiveTab("completed")}
            >
                COMPLETED ({baseFilteredTasks.filter(t => t.task_status?.code === 'done').length})
            </button>
        </div>
    )
}

function ListToolbar({
    searchQuery, setSearchQuery,
    selectedProject, setSelectedProject,
    selectedAssignee, setSelectedAssignee,
    projects, members, selectedCount,
    taskTreeLength, activeTab, rowSelection,
    taskStatuses, setTasks, setRowSelection,
}: {
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
    activeTab: "active" | "completed" | "all"
    rowSelection: RowSelectionState
    taskStatuses: ITaskStatus[]
    setTasks: (fn: (prev: ITask[]) => ITask[]) => void
    setRowSelection: (fn: (prev: RowSelectionState) => RowSelectionState) => void
}) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative w-full sm:w-auto min-w-[260px] max-w-[360px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search tasks"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger className="w-[180px] border-gray-300">
                            <SelectValue placeholder="All projects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All projects</SelectItem>
                            {projects.map((project) => (
                                <SelectItem key={project.id} value={project.name}>{project.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                        <SelectTrigger className="w-[180px] border-gray-300">
                            <SelectValue placeholder="All assignees" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All assignees</SelectItem>
                            {members.map((member) => {
                                const name = `${member.user?.first_name || ''} ${member.user?.last_name || ''}`.trim() || member.user?.display_name || "Unknown"
                                return <SelectItem key={member.id} value={name}>{name}</SelectItem>
                            })}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="px-3" disabled={selectedCount === 0}>
                            Batch actions
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem
                            onSelect={async () => {
                                const selectedRowIds = Object.keys(rowSelection).filter(k => rowSelection[k])
                                const newStatusCode = activeTab === "active" ? "done" : "todo"
                                const statusToApply = taskStatuses.find(s => s.code === newStatusCode)
                                if (!statusToApply) return
                                const results = await Promise.all(selectedRowIds.map(id => {
                                    const fd = new FormData()
                                    fd.append("id", id)
                                    fd.append("status_id", statusToApply.id.toString())
                                    return updateTask(fd)
                                }))
                                if (results.some(r => r.success)) {
                                    setTasks((prev: ITask[]) => prev.map(t =>
                                        selectedRowIds.includes(t.id.toString())
                                            ? { ...t, status_id: statusToApply.id, task_status: statusToApply }
                                            : t
                                    ))
                                    toast.success("Tasks updated")
                                }
                                setRowSelection(() => ({}))
                            }}
                        >
                            {activeTab === "active" ? "Mark as completed" : "Reopen tasks"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <span className="text-sm text-muted-foreground min-w-[90px]">
                    {selectedCount} / {taskTreeLength} selected
                </span>
            </div>
        </div>
    )
}

function ListDialogs({
    isNewTaskDialogOpen, setIsNewTaskDialogOpen,
    newTaskTitle, setNewTaskTitle,
    newTaskProject, setNewTaskProject,
    newTaskAssignee, setNewTaskAssignee,
    newTaskStatus, setNewTaskStatus,
    projects, members, taskStatuses, setTasks,
    taskToDelete, setTaskToDelete,
    editingTask, setEditingTask,
    editedTitle, setEditedTitle,
    editedStatus, setEditedStatus,
    editedAssignee, setEditedAssignee,
}: {
    isNewTaskDialogOpen: boolean
    setIsNewTaskDialogOpen: (open: boolean) => void
    newTaskTitle: string
    setNewTaskTitle: (v: string) => void
    newTaskProject: number | ""
    setNewTaskProject: (v: number | "") => void
    newTaskAssignee: number | ""
    setNewTaskAssignee: (v: number | "") => void
    newTaskStatus: number | ""
    setNewTaskStatus: (v: number | "") => void
    projects: IProject[]
    members: IOrganization_member[]
    taskStatuses: ITaskStatus[]
    setTasks: (fn: (prev: ITask[]) => ITask[]) => void
    taskToDelete: ITask | null
    setTaskToDelete: (t: ITask | null) => void
    editingTask: ITask | null
    setEditingTask: (t: ITask | null) => void
    editedTitle: string
    setEditedTitle: (v: string) => void
    editedStatus: number | ""
    setEditedStatus: (v: number | "") => void
    editedAssignee: number | ""
    setEditedAssignee: (v: number | "") => void
}) {
    return (
        <>
            {/* New Task Dialog */}
            <Dialog open={isNewTaskDialogOpen} onOpenChange={setIsNewTaskDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input placeholder="Task Name" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} />
                        <Select value={newTaskProject.toString()} onValueChange={(v) => setNewTaskProject(Number(v))}>
                            <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                            <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={newTaskAssignee.toString()} onValueChange={(v) => setNewTaskAssignee(Number(v))}>
                            <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                            <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.user?.display_name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={newTaskStatus.toString()} onValueChange={(v) => setNewTaskStatus(Number(v))}>
                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>{taskStatuses.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewTaskDialogOpen(false)}>Cancel</Button>
                        <Button onClick={async () => {
                            if (!newTaskTitle || !newTaskProject) return
                            const fd = new FormData()
                            fd.append("name", newTaskTitle)
                            fd.append("project_id", newTaskProject.toString())
                            if (newTaskStatus) fd.append("status_id", newTaskStatus.toString())
                            const res = await createTask(fd)
                            if (res.success && res.data) {
                                if (newTaskAssignee) await assignTaskMember(res.data.id, Number(newTaskAssignee))
                                const tasksRes = await getTasks()
                                if (tasksRes.success) setTasks(() => tasksRes.data)
                                setIsNewTaskDialogOpen(false)
                                toast.success("Task created")
                            }
                        }}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={Boolean(taskToDelete)} onOpenChange={(open) => !open && setTaskToDelete(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Delete Task</DialogTitle></DialogHeader>
                    <p>Are you sure you want to delete this task?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setTaskToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={async () => {
                            if (taskToDelete) {
                                const fd = new FormData()
                                fd.append("id", taskToDelete.id.toString())
                                const res = await deleteTask(fd)
                                if (res.success) {
                                    setTasks((prev: ITask[]) => prev.filter(t => t.id !== taskToDelete.id))
                                    toast.success("Task deleted")
                                }
                                setTaskToDelete(null)
                            }
                        }}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={Boolean(editingTask)} onOpenChange={(open) => !open && setEditingTask(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} />
                        <Select value={editedStatus.toString()} onValueChange={(v) => setEditedStatus(Number(v))}>
                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>{taskStatuses.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={editedAssignee.toString()} onValueChange={(v) => setEditedAssignee(Number(v))}>
                            <SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
                            <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.user?.display_name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
                        <Button onClick={async () => {
                            if (!editingTask) return
                            const fd = new FormData()
                            fd.append("id", editingTask.id.toString())
                            fd.append("name", editedTitle)
                            if (editedStatus) fd.append("status_id", editedStatus.toString())
                            const res = await updateTask(fd)
                            if (res.success) {
                                if (editedAssignee) await assignTaskMember(editingTask.id, Number(editedAssignee))
                                const tasksRes = await getTasks()
                                if (tasksRes.success) setTasks(() => tasksRes.data)
                                setEditingTask(null)
                                toast.success("Task updated")
                            }
                        }}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function ListPagination({ currentPage, totalPages, onPageChange, isLoading, taskTreeLength, pageSize, onPageSizeChange }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    isLoading: boolean
    taskTreeLength: number
    pageSize: number
    onPageSizeChange: (size: number) => void
}) {
    return (
        <PaginationFooter
            page={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            isLoading={isLoading}
            from={taskTreeLength > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            to={Math.min(currentPage * pageSize, taskTreeLength)}
            total={taskTreeLength}
            pageSize={pageSize}
            onPageSizeChange={(size: number) => { onPageSizeChange(size) }}
        />
    )
}
