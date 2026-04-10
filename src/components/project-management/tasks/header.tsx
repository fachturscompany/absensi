"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
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
import { Plus, List, LayoutGrid, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/profile&image/user-avatar"
import {
    ITask, IOrganization_member,
    ITaskAssignee, ITaskStatus,
} from "@/interface"
import { TaskNode, CurrentView, ActiveTab, TabCounts } from "@/types/tasks"

export function buildTaskTree(tasks: ITask[]): TaskNode[] {
    const map = new Map<number, TaskNode>()
    tasks.forEach(t => map.set(t.id, { ...t, children: [] }))
    const roots: TaskNode[] = []
    map.forEach(node => {
        if (node.parent_task_id && map.has(node.parent_task_id)) {
            map.get(node.parent_task_id)!.children.push(node)
        } else {
            roots.push(node)
        }
    })
    return roots
}

export function flattenTree(
    nodes: TaskNode[],
    expandedIds: Set<number>,
    depth = 0,
): { node: TaskNode; depth: number; hasChildren: boolean }[] {
    const result: { node: TaskNode; depth: number; hasChildren: boolean }[] = []
    for (const node of nodes) {
        result.push({ node, depth, hasChildren: node.children.length > 0 })
        if (expandedIds.has(node.id) && node.children.length > 0) {
            result.push(...flattenTree(node.children, expandedIds, depth + 1))
        }
    }
    return result
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
                <div
                    className={cn(
                        "rounded-full bg-gray-100 dark:bg-muted border border-white dark:border-background flex items-center justify-center text-muted-foreground font-bold ring-2 ring-white dark:ring-background z-0",
                        size === 5 ? "w-5 h-5 text-[8px]" : "w-6 h-6 text-[10px]",
                    )}
                >
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

export function TasksViewSwitcher({ currentView }: { currentView: CurrentView }) {
    const router = useRouter()
    const pathname = usePathname()

    const projectMatch = pathname.match(/\/projects\/([^/]+)\/tasks/)
    const projectId = projectMatch ? projectMatch[1] : null
    const basePath = projectId ? `/projects/${projectId}/tasks` : "/projects/tasks"

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
                    <Icon
                        className={cn(
                            "h-4 w-4",
                            currentView === key ? "text-white" : "text-gray-400",
                        )}
                    />
                    <span className="font-semibold text-xs uppercase tracking-tight">{label}</span>
                </Button>
            ))}
        </div>
    )
}

// ─── Tasks Header (page-level title + view switcher) ─────────────────────────

export function TasksHeader({ currentView }: { currentView: CurrentView }) {
    const pathname = usePathname()
    const isProjectContext =
        pathname.includes("/projects/") && pathname.includes("/tasks")

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {!isProjectContext ? (
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage and track all granular work items across projects.
                    </p>
                </div>
            ) : (
                <div className="flex-1" />
            )}
            <div className="flex items-center gap-2">
                <TasksViewSwitcher currentView={currentView} />
            </div>
        </div>
    )
}

// ─── Tasks Page Header (tabs + new task dialog) ───────────────────────────────

interface TasksPageHeaderProps {
    currentView: CurrentView
    activeTab: ActiveTab
    onTabChange: (tab: ActiveTab) => void
    tabCounts: TabCounts
    members: IOrganization_member[]
    taskStatuses: ITaskStatus[]
    onCreateTask: (
        title: string,
        assigneeId: number | "",
        statusId: number | "",
    ) => Promise<void>
}

export function TasksPageHeader({
    currentView,
    activeTab,
    onTabChange,
    tabCounts,
    members,
    taskStatuses,
    onCreateTask,
}: TasksPageHeaderProps) {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState("")
    const [assigneeId, setAssigneeId] = useState<number | "">("")
    const [statusId, setStatusId] = useState<number | "">("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const resetForm = () => {
        setTitle("")
        setAssigneeId("")
        setStatusId("")
    }

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

    const handleClose = () => {
        setOpen(false)
        resetForm()
    }

    return (
        <>
            {/* Top bar */}
            <div className="flex items-center justify-end gap-2">
                <Button onClick={() => setOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Task
                </Button>
                <TasksViewSwitcher currentView={currentView} />
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
                    <DialogHeader>
                        <DialogTitle>New Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        <Input
                            placeholder="Task name"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleCreate()}
                            autoFocus
                        />
                        <Select
                            value={assigneeId.toString()}
                            onValueChange={v => setAssigneeId(v ? Number(v) : "")}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Assign to (optional)" />
                            </SelectTrigger>
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
                        <Select
                            value={statusId.toString()}
                            onValueChange={v => setStatusId(v ? Number(v) : "")}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {taskStatuses.map(s => (
                                    <SelectItem key={s.id} value={s.id.toString()}>
                                        {s.name}
                                    </SelectItem>
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