"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { List, LayoutGrid, CalendarDays } from "lucide-react"
import { UserAvatar } from "@/components/common/user-avatar"
import { getTasks, getTaskStatuses } from "@/action/task"
import { getProjects } from "@/action/project"
import { getAllOrganization_member } from "@/action/members"
import { ITask, IProject, IOrganization_member, ITaskAssignee, ITaskStatus } from "@/interface"
import { cn } from "@/lib/utils"

export type TaskNode = ITask & { children: TaskNode[] }
export type CurrentView = "list" | "board" | "timeline"

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

export function flattenTree(nodes: TaskNode[], expandedIds: Set<number>, depth = 0): { node: TaskNode; depth: number; hasChildren: boolean }[] {
    const result: { node: TaskNode; depth: number; hasChildren: boolean }[] = []
    for (const node of nodes) {
        result.push({ node, depth, hasChildren: node.children.length > 0 })
        if (expandedIds.has(node.id) && node.children.length > 0) {
            result.push(...flattenTree(node.children, expandedIds, depth + 1))
        }
    }
    return result
}

// ─── Shared Data Hook ─────────────────────────────────────────────────────────
export function useTasksData() {
    const [tasks, setTasks] = useState<ITask[]>([])
    const [projects, setProjects] = useState<IProject[]>([])
    const [members, setMembers] = useState<IOrganization_member[]>([])
    const [taskStatuses, setTaskStatuses] = useState<ITaskStatus[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const [tasksRes, projectsRes, membersRes, statusesRes] = await Promise.all([
                    getTasks(),
                    getProjects(),
                    getAllOrganization_member(),
                    getTaskStatuses()
                ])
                if (tasksRes.success) setTasks(tasksRes.data)
                if (projectsRes.success) setProjects(projectsRes.data)
                if (membersRes.success) setMembers(membersRes.data)
                if (statusesRes.success) setTaskStatuses(statusesRes.data)
            } catch (error) {
                console.error("Error fetching data:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    return {
        tasks, setTasks,
        projects, members, taskStatuses,
        isLoading,
    }
}

// ─── Assignee Helpers ────────────────────────────────────────────────────────

export function getAssigneeInfo(assignee: ITaskAssignee): { id: string; name: string; photoUrl?: string; userId?: string } {
    const user = assignee?.member?.user
    if (user) {
        const name = user.display_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown"
        return {
            id: String(assignee.organization_member_id || assignee.id || "unknown"),
            name: name,
            photoUrl: user.profile_photo_url || undefined,
            userId: user.id
        }
    }
    return { id: "unassigned", name: "Unassigned" }
}

export function StackedAssignees({ assignees, max = 3, size = 6, showLink = true }: {
    assignees: ITaskAssignee[],
    max?: number,
    size?: number,
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
                            onClick={(e) => e.stopPropagation()}
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
                        size === 5 ? "w-5 h-5 text-[8px]" : "w-6 h-6 text-[10px]"
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
    const name = user?.display_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || "Unknown"
    return (
        <Link
            href={`/members/${asgn.organization_member_id}`}
            onClick={(e) => e.stopPropagation()}
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

    // Determine if we are in a project-specific task view
    const projectMatch = pathname.match(/\/projects\/([^/]+)\/tasks/)
    const projectId = projectMatch ? projectMatch[1] : null
    const basePath = projectId ? `/projects/${projectId}/tasks` : "/projects/tasks"

    return (
        <div className="flex items-center p-1 bg-white rounded-lg border border-gray-200 shadow-sm">
            <Button
                variant="ghost"
                className={cn(
                    "h-8 gap-2 px-4 rounded-md transition-all text-sm",
                    currentView === "list"
                        ? "bg-gray-900 text-white hover:bg-gray-800 hover:text-white"
                        : "text-muted-foreground hover:bg-muted"
                )}
                onClick={() => router.push(`${basePath}/list`)}
            >
                <List className={cn("h-4 w-4", currentView === "list" ? "text-white" : "text-gray-400")} />
                <span className="font-semibold text-xs uppercase tracking-tight">List</span>
            </Button>
            <Button
                variant="ghost"
                className={cn(
                    "h-8 gap-2 px-4 rounded-md transition-all text-sm",
                    currentView === "board"
                        ? "bg-gray-900 text-white hover:bg-gray-800 hover:text-white"
                        : "text-muted-foreground hover:bg-muted"
                )}
                onClick={() => router.push(`${basePath}/kanban`)}
            >
                <LayoutGrid className={cn("h-4 w-4", currentView === "board" ? "text-white" : "text-gray-400")} />
                <span className="font-semibold text-xs uppercase tracking-tight">Kanban</span>
            </Button>
            <Button
                variant="ghost"
                className={cn(
                    "h-8 gap-2 px-4 rounded-md transition-all text-sm",
                    currentView === "timeline"
                        ? "bg-gray-900 text-white hover:bg-gray-800 hover:text-white"
                        : "text-muted-foreground hover:bg-muted"
                )}
                onClick={() => router.push(`${basePath}/timeline`)}
            >
                <CalendarDays className={cn("h-4 w-4", currentView === "timeline" ? "text-white" : "text-gray-400")} />
                <span className="font-semibold text-xs uppercase tracking-tight">Timeline</span>
            </Button>
        </div>
    )
}

// ─── Tasks Page Header ────────────────────────────────────────────────────────
export function TasksHeader({ currentView }: { currentView: CurrentView }) {
    const pathname = usePathname()
    const isProjectContext = pathname.includes("/projects/") && pathname.includes("/tasks")

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {!isProjectContext ? (
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage and track all granular work items across projects.</p>
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

