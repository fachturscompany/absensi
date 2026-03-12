"use client"

// app/projects/[id]/tasks/layout.tsx

import { useState, useEffect, useContext, createContext, use } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog, DialogContent, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { UserAvatar } from "@/components/profile&image/user-avatar"
import { Plus, List, LayoutGrid, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { ITask, IOrganization_member, ITaskAssignee, ITaskStatus } from "@/interface"
import { getTasksListPageData } from "@/action/projects/tasks/list"
import { createTask, getTasks, assignTaskMember } from "@/action/task"
import { toast } from "sonner"
import { ActiveTab, CurrentView, TabCounts, TasksLayoutData } from "@/types/tasks"

// ─── Context ──────────────────────────────────────────────────────────────────

interface TasksContextValue extends TasksLayoutData {
    setTasks: (tasks: ITask[]) => void
    activeTab: ActiveTab
    isLoading: boolean
}

const TasksContext = createContext<TasksContextValue | null>(null)

export function useTasksContext() {
    const ctx = useContext(TasksContext)
    if (!ctx) throw new Error("useTasksContext must be used inside TasksLayout")
    return ctx
}

// ─── Assignee Helpers ─────────────────────────────────────────────────────────

export function getAssigneeInfo(
    assignee: ITaskAssignee,
): { id: string; name: string; photoUrl?: string; userId?: string } {
    const user = assignee?.member?.user
    if (user) {
        const name =
            user.display_name ||
            `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
            "Unknown"
        return {
            id: String(assignee.organization_member_id || assignee.id || "unknown"),
            name,
            photoUrl: user.profile_photo_url || undefined,
            userId: user.id,
        }
    }
    return { id: "unassigned", name: "Unassigned" }
}

export function StackedAssignees({
    assignees,
    max = 3,
    size = 6,
    showLink = true,
}: {
    assignees: ITaskAssignee[]
    max?: number
    size?: number
    showLink?: boolean
}) {
    if (!assignees || assignees.length === 0) return null

    return (
        <div className="flex -space-x-2 shrink-0">
            {assignees.slice(0, max).map((asgn, i) => {
                const info = getAssigneeInfo(asgn)
                const avatar = (
                    <UserAvatar
                        name={info.name}
                        photoUrl={info.photoUrl}
                        userId={info.userId}
                        size={size}
                        className="ring-2 ring-white dark:ring-background rounded-full shadow-sm"
                    />
                )
                if (showLink) {
                    return (
                        <Link
                            key={i}
                            href={`/members/${asgn.organization_member_id}`}
                            onClick={e => e.stopPropagation()}
                            className="hover:scale-110 transition-transform relative"
                            style={{ zIndex: max - i }}
                        >
                            {avatar}
                        </Link>
                    )
                }
                return (
                    <div key={i} className="relative" style={{ zIndex: max - i }}>
                        {avatar}
                    </div>
                )
            })}
            {assignees.length > max && (
                <div className={cn(
                    "rounded-full bg-gray-100 dark:bg-muted border border-white dark:border-background flex items-center justify-center text-muted-foreground font-bold ring-2 ring-white dark:ring-background z-0",
                    size === 5 ? "w-5 h-5 text-[8px]" : "w-6 h-6 text-[10px]",
                )}>
                    +{assignees.length - max}
                </div>
            )}
        </div>
    )
}

export function AssigneeAvatar({ asgn }: { asgn: ITaskAssignee }) {
    const user = asgn.member?.user
    const name =
        user?.display_name ||
        `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
        "Unknown"
    return (
        <Link
            href={`/members/${asgn.organization_member_id}`}
            onClick={e => e.stopPropagation()}
            className="hover:scale-110 transition-transform"
        >
            <UserAvatar
                name={name}
                photoUrl={user?.profile_photo_url}
                userId={user?.id}
                size={6}
                className="ring-2 ring-background"
            />
        </Link>
    )
}

// ─── View Switcher ────────────────────────────────────────────────────────────

function TasksViewSwitcher({ currentView, projectId }: { currentView: CurrentView; projectId: string }) {
    const router = useRouter()
    const basePath = `/projects/${projectId}/tasks`

    const views = [
        { key: "list",     label: "List",     icon: List,         path: "list"     },
        { key: "board",    label: "Kanban",   icon: LayoutGrid,   path: "kanban"   },
        { key: "timeline", label: "Timeline", icon: CalendarDays, path: "timeline" },
    ] as const

    return (
        <div className="flex items-center p-1 bg-white rounded-lg border border-gray-200 shadow-sm">
            {views.map(({ key, label, icon: Icon, path }) => (
                <Button
                    key={key}
                    variant="ghost"
                    className={cn(
                        "h-8 gap-2 px-4 rounded-md transition-all text-sm",
                        currentView === key
                            ? "bg-gray-900 text-white hover:bg-gray-800 hover:text-white"
                            : "text-muted-foreground hover:bg-muted",
                    )}
                    onClick={() => router.push(`${basePath}/${path}`)}
                >
                    <Icon className={cn("h-4 w-4", currentView === key ? "text-white" : "text-gray-400")} />
                    <span className="font-semibold text-xs uppercase tracking-tight">{label}</span>
                </Button>
            ))}
        </div>
    )
}

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
    projectId: string
    currentView: CurrentView
    activeTab: ActiveTab
    onTabChange: (tab: ActiveTab) => void
    tabCounts: TabCounts
    members: IOrganization_member[]
    taskStatuses: ITaskStatus[]
    onCreateTask: (title: string, assigneeId: number | "", statusId: number | "") => Promise<void>
}

function TasksHeader({
    projectId, currentView, activeTab, onTabChange,
    tabCounts, members, taskStatuses, onCreateTask,
}: HeaderProps) {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [assigneeId, setAssigneeId] = useState<number | "">("")
    const [statusId, setStatusId] = useState<number | "">("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const resetForm = () => { setTitle(""); setAssigneeId(""); setStatusId("") }
    const handleClose = () => { setOpen(false); resetForm() }

    const handleCreate = async () => {
        if (!title.trim()) return
        setIsSubmitting(true)
        try {
            await onCreateTask(title.trim(), assigneeId, statusId)
            setOpen(false)
            resetForm()
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            {/* Top bar */}
            <div className="flex items-center justify-end gap-2">
                <Button onClick={() => setOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Task
                </Button>
                <TasksViewSwitcher currentView={currentView} projectId={projectId} />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 text-sm border-b">
                {(["active", "completed", "all"] as ActiveTab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => onTabChange(tab)}
                        className={cn(
                            "pb-2 border-b-2 -mb-px transition-colors uppercase font-medium text-xs tracking-wide",
                            activeTab === tab
                                ? "border-foreground text-foreground"
                                : "border-transparent text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {tab} ({tabCounts[tab]})
                    </button>
                ))}
            </div>

            {/* New Task Dialog */}
            <Dialog open={open} onOpenChange={open => !open && handleClose()}>
                <DialogContent>
                    <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-4">
                        <Input
                            placeholder="Task name"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleCreate()}
                            autoFocus
                        />
                        <Select value={assigneeId.toString()} onValueChange={v => setAssigneeId(v ? Number(v) : "")}>
                            <SelectTrigger><SelectValue placeholder="Assign to (optional)" /></SelectTrigger>
                            <SelectContent>
                                {members.map(m => (
                                    <SelectItem key={m.id} value={m.id.toString()}>
                                        {m.user?.display_name ||
                                            `${m.user?.first_name || ""} ${m.user?.last_name || ""}`.trim() ||
                                            "Unknown"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={statusId.toString()} onValueChange={v => setStatusId(v ? Number(v) : "")}>
                            <SelectTrigger><SelectValue placeholder="Status (optional)" /></SelectTrigger>
                            <SelectContent>
                                {taskStatuses.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!title.trim() || isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

// ─── Layout (default export) ──────────────────────────────────────────────────

export default function TasksLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ id: string }>
}) {
    const { id: projectId } = use(params)
    const pathname = usePathname()

    const currentView: CurrentView = pathname.endsWith("/kanban")
        ? "board"
        : pathname.endsWith("/timeline")
            ? "timeline"
            : "list"

    const [tasks, setTasks] = useState<ITask[]>([])
    const [members, setMembers] = useState<IOrganization_member[]>([])
    const [taskStatuses, setTaskStatuses] = useState<ITaskStatus[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<ActiveTab>("active")

    useEffect(() => {
        setIsLoading(true)
        getTasksListPageData()
            .then(({ tasks, members, taskStatuses }) => {
                setTasks(tasks)
                setMembers(members)
                setTaskStatuses(taskStatuses)
            })
            .finally(() => setIsLoading(false))
    }, [projectId])

    const projectTasks = tasks.filter(t => t.project_id === Number(projectId))
    const tabCounts: TabCounts = {
        all: projectTasks.length,
        active: projectTasks.filter(t => t.task_status?.code !== "done").length,
        completed: projectTasks.filter(t => t.task_status?.code === "done").length,
    }

    const handleCreateTask = async (
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
            const fresh = await getTasks()
            if (fresh.success) setTasks(fresh.data)
            toast.success("Task created")
        } else {
            toast.error("Failed to create task")
        }
    }

    return (
        <TasksContext.Provider value={{ tasks, setTasks, members, taskStatuses, activeTab, isLoading }}>
            <div className="flex flex-col gap-4 p-4 pt-0">
                <TasksHeader
                    projectId={projectId}
                    currentView={currentView}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabCounts={tabCounts}
                    members={members}
                    taskStatuses={taskStatuses}
                    onCreateTask={handleCreateTask}
                />
                {children}
            </div>
        </TasksContext.Provider>
    )
}
