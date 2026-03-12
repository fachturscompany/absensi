"use client"

import React, { useState, useMemo, useCallback, use } from "react"
import {
    ChevronRight,
    ChevronDown,
    Users,
    AlignLeft,
    ChevronsDownUp,
    ChevronsUpDown
} from "lucide-react"
import {
    useTasksData,
    TasksHeader,
    buildTaskTree,
    flattenTree,
    TaskNode
} from "@/components/projects/tasks/header"
import { ITask, ITaskAssignee } from "@/interface"
import { DateRangePicker } from "@/components/insights/DateRangePicker"
import type { DateRange } from "@/components/insights/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/profile&image/user-avatar"
import Link from "next/link"

// ─── Types ──────────────────────────────────────────────────────────────────

type GroupBy = "task" | "assignee"

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
    todo: "bg-zinc-400",
    in_progress: "bg-blue-500",
    review: "bg-amber-500",
    done: "bg-green-500",
}

// ─── Pure helper functions ───────────────────────────────────────────────────

function startOfDay(d: Date): Date {
    const dt = new Date(d)
    dt.setHours(0, 0, 0, 0)
    return dt
}

function addDays(d: Date, days: number): Date {
    const dt = new Date(d)
    dt.setDate(dt.getDate() + days)
    return dt
}

function getDaysBetween(start: Date, end: Date): number {
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1)
}

function toDateOnly(d: Date): Date {
    return startOfDay(d)
}

/** Get rollup date range for a node (min start, max end across all descendants) */
function getRollupDates(node: TaskNode): { start: Date | null; end: Date | null } {
    const starts: Date[] = []
    const ends: Date[] = []

    const collect = (n: TaskNode) => {
        if (n.created_at) starts.push(startOfDay(new Date(n.created_at)))
        if ((n as any).due_date) ends.push(startOfDay(new Date((n as any).due_date)))
        n.children.forEach(collect)
    }
    collect(node)

    return {
        start: starts.length > 0 ? starts.reduce((a, b) => a < b ? a : b) : null,
        end: ends.length > 0 ? ends.reduce((a, b) => a > b ? a : b) : null,
    }
}

/** Get assignee display info from a task assignee object */
function getAssigneeInfo(assignee: ITaskAssignee): { id: string; name: string; photoUrl?: string; userId?: string } {
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function AssigneeAvatarItem({ name, photoUrl, userId, size = 6, memberId }: {
    name: string;
    photoUrl?: string;
    userId?: string;
    size?: number;
    memberId?: string;
}) {
    const content = (
        <UserAvatar
            name={name}
            photoUrl={photoUrl}
            userId={userId}
            size={size}
            className="rounded-full shadow-sm shrink-0"
        />
    )

    if (memberId) {
        return (
            <Link
                href={`/members/${memberId}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:scale-110 transition-transform"
            >
                {content}
            </Link>
        )
    }

    return content
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = use(params)
    const { tasks, isLoading } = useTasksData()
    const [groupBy, setGroupBy] = useState<GroupBy>("task")
    const [expandedTaskIds, setExpandedTaskIds] = useState<Set<number>>(new Set())
    const [dateRange, setDateRange] = useState<DateRange>(() => ({
        startDate: addDays(startOfDay(new Date()), -7),
        endDate: addDays(startOfDay(new Date()), 13),
    }))

    // ─── Date helpers ────────────────────────────────────────────────────────

    const days = useMemo(() => {
        const total = getDaysBetween(dateRange.startDate, dateRange.endDate)
        return Array.from({ length: total }, (_, i) => addDays(startOfDay(dateRange.startDate), i))
    }, [dateRange.startDate, dateRange.endDate])

    const todayIndex = useMemo(() => {
        const today = startOfDay(new Date()).getTime()
        return days.findIndex(d => d.getTime() === today)
    }, [days])

    // ─── Tree computation ────────────────────────────────────────────────────
    const filteredTasks = useMemo(() => {
        return projectId ? tasks.filter(t => t.project_id === Number(projectId)) : tasks
    }, [tasks, projectId])

    const taskTree = useMemo(() => buildTaskTree(filteredTasks), [filteredTasks])

    const toggleExpand = useCallback((id: number) => {
        setExpandedTaskIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    const expandAll = useCallback(() => {
        setExpandedTaskIds(new Set(filteredTasks.filter(t => !t.parent_task_id).map(t => t.id)))
    }, [filteredTasks])

    const collapseAll = useCallback(() => {
        setExpandedTaskIds(new Set())
    }, [])

    // ─── Row computation (Task View) ─────────────────────────────────────────

    const taskViewRows = useMemo(() => {
        return flattenTree(taskTree, expandedTaskIds)
    }, [taskTree, expandedTaskIds])

    // ─── Row computation (Assignee View) ─────────────────────────────────────

    const assigneeViewRows = useMemo(() => {
        const list: { assigneeId: string; name: string; photoUrl?: string; userId?: string; task: ITask; parentName?: string; memberId?: string }[] = []

        const processTask = (task: ITask, parentName?: string) => {
            const taskAsNode = task as TaskNode
            const assignees = task.assignees || []
            if (assignees.length > 0) {
                assignees.forEach((a) => {
                    const info = getAssigneeInfo(a)
                    list.push({
                        assigneeId: info.id,
                        name: info.name,
                        photoUrl: info.photoUrl,
                        userId: info.userId,
                        task,
                        parentName,
                        memberId: a.organization_member_id?.toString()
                    })
                })
            } else {
                list.push({ assigneeId: "unassigned", name: "Unassigned", task, parentName })
            }
            if (taskAsNode.children) taskAsNode.children.forEach(c => processTask(c, task.name))
        }

        taskTree.forEach(root => processTask(root))

        list.sort((a, b) => {
            if (a.assigneeId === "unassigned" && b.assigneeId !== "unassigned") return 1
            if (b.assigneeId === "unassigned" && a.assigneeId !== "unassigned") return -1
            return a.name.localeCompare(b.name) || a.assigneeId.localeCompare(b.assigneeId)
        })

        return list.map((item, index) => ({
            ...item,
            isFirst: index === 0 || list[index - 1]?.assigneeId !== item.assigneeId,
            isLast: index === list.length - 1 || list[index + 1]?.assigneeId !== item.assigneeId,
        }))
    }, [taskTree])

    const assigneeRowSpans = useMemo(() => {
        const spans: Record<number, number> = {}
        let i = 0
        while (i < assigneeViewRows.length) {
            if (assigneeViewRows[i]!.isFirst) {
                let span = 1
                for (let j = i + 1; j < assigneeViewRows.length; j++) {
                    if (assigneeViewRows[j]!.assigneeId === assigneeViewRows[i]!.assigneeId) span++
                    else break
                }
                spans[i] = span
            }
            i++
        }
        return spans
    }, [assigneeViewRows])

    // ─── Bar helpers ─────────────────────────────────────────────────────────

    const getBarCols = useCallback((barStart: Date | null, barEnd: Date | null, colOffset: number) => {
        const timelineStart = days[0]!
        const timelineEnd = days[days.length - 1]!

        if (!barStart || !barEnd) return null
        const bs = toDateOnly(barStart)
        const be = toDateOnly(barEnd)

        if (be < timelineStart || bs > timelineEnd) return null

        let startCol = colOffset
        const totalCols = days.length

        if (bs > timelineStart) {
            startCol = colOffset + Math.round((bs.getTime() - timelineStart.getTime()) / 86400000)
        }

        const duration = Math.round((be.getTime() - bs.getTime()) / 86400000) + 1
        let endCol = startCol + duration

        startCol = Math.max(colOffset, Math.min(startCol, totalCols + colOffset))
        endCol = Math.max(startCol + 1, Math.min(endCol, totalCols + colOffset))

        return { startCol, endCol }
    }, [days])

    // ─── Render helpers ───────────────────────────────────────────────────────

    const renderDayCells = (rowIndex: number, borderBottom: boolean, colOffset: number) =>
        days.map((d, ci) => {
            const isToday = d.getTime() === startOfDay(new Date()).getTime()
            return (
                <div
                    key={d.toISOString()}
                    className={[
                        "border-r",
                        borderBottom ? "border-b" : "",
                        isToday ? "bg-blue-50/20 dark:bg-blue-950/20" : "",
                        "hover:bg-muted/20 transition-colors relative",
                    ].join(" ")}
                    style={{ gridRow: rowIndex + 2, gridColumn: ci + colOffset }}
                />
            )
        })

    const renderTodayLine = (colOffset: number, totalRows: number) => {
        if (todayIndex < 0) return null
        const gridCol = todayIndex + colOffset
        return (
            <div
                key="today-line"
                className="pointer-events-none z-10"
                style={{
                    gridRow: `2 / ${totalRows + 2}`,
                    gridColumn: gridCol,
                    borderLeft: "2px solid #3b82f6",
                    opacity: 0.5,
                }}
            />
        )
    }

    // ─── TASK VIEW ────────────────────────────────────────────────────────────

    const renderTaskView = () => {
        const TASK_COL_OFFSET = 2
        const rows = taskViewRows
        const numCols = days.length

        return (
            <div className="grid" style={{ gridTemplateColumns: `280px repeat(${numCols}, minmax(72px, 1fr))` }}>
                <div className="sticky left-0 top-0 z-40 bg-white dark:bg-background border-b border-r px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center">
                    Tasks
                </div>
                {days.map((d) => {
                    const isToday = d.getTime() === startOfDay(new Date()).getTime()
                    return (
                        <div
                            key={d.toISOString()}
                            className={`sticky top-0 z-20 border-b border-r px-2 py-2 text-center ${isToday ? "bg-blue-50/50 dark:bg-blue-950/30" : "bg-white dark:bg-background"}`}
                        >
                            <div className={`text-[10px] font-medium uppercase ${isToday ? "text-blue-600" : "text-muted-foreground"}`}>
                                {d.toLocaleDateString(undefined, { weekday: "short" })}
                            </div>
                            <div className={`text-xl font-bold tabular-nums leading-tight ${isToday ? "text-blue-600" : ""}`}>
                                {d.getDate()}
                            </div>
                            <div className={`text-[10px] ${isToday ? "text-blue-500" : "text-muted-foreground/60"}`}>
                                {d.toLocaleDateString(undefined, { month: "short" })}
                            </div>
                        </div>
                    )
                })}

                {rows.length > 0 && renderTodayLine(TASK_COL_OFFSET, rows.length)}

                {isLoading && (
                    <div style={{ gridColumn: "1 / -1", gridRow: 2 }} className="border-b p-6 text-sm text-muted-foreground flex items-center gap-2">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading tasks...
                    </div>
                )}
                {!isLoading && rows.length === 0 && (
                    <div style={{ gridColumn: "1 / -1", gridRow: 2 }} className="border-b p-10 text-center text-sm text-muted-foreground">
                        No tasks found.
                    </div>
                )}

                {!isLoading && rows.map(({ node, depth, hasChildren }, rowIndex) => {
                    const isExpanded = expandedTaskIds.has(node.id)
                    const isParent = hasChildren

                    let barStart: Date | null = node.created_at ? startOfDay(new Date(node.created_at)) : null
                    let barEnd: Date | null = node.due_date ? startOfDay(new Date(node.due_date)) : null

                    if (isParent) {
                        const rollup = getRollupDates(node)
                        barStart = rollup.start
                        barEnd = rollup.end
                    }

                    const barCols = getBarCols(barStart, barEnd, TASK_COL_OFFSET)
                    const assignees = node.assignees || []

                    return (
                        <React.Fragment key={node.id}>
                            <div
                                className="sticky left-0 z-30 bg-white dark:bg-background border-b border-r px-3 py-2 flex items-center gap-1 min-w-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                                style={{ gridRow: rowIndex + 2, gridColumn: 1, paddingLeft: `${12 + depth * 20}px` }}
                            >
                                {hasChildren ? (
                                    <button
                                        onClick={() => toggleExpand(node.id)}
                                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                    </button>
                                ) : (
                                    <span className="w-3.5 h-3.5 shrink-0 block" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm truncate ${isParent ? "font-semibold" : "font-medium"}`}>{node.name}</div>
                                    {node.project?.name && (
                                        <div className="text-[10px] text-muted-foreground truncate">{node.project.name}</div>
                                    )}
                                </div>
                                {assignees.length > 0 && (
                                    <div className="flex -space-x-1 shrink-0 ml-1">
                                        {assignees.slice(0, 2).map((a, i) => {
                                            const info = getAssigneeInfo(a)
                                            return <AssigneeAvatarItem key={i} name={info.name} photoUrl={info.photoUrl} userId={info.userId} size={5} memberId={a.organization_member_id?.toString()} />
                                        })}
                                        {assignees.length > 2 && (
                                            <div className="w-5 h-5 rounded-full bg-muted border text-[9px] flex items-center justify-center text-muted-foreground">
                                                +{assignees.length - 2}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {renderDayCells(rowIndex, true, TASK_COL_OFFSET)}

                            {barCols && (
                                <div
                                    className="flex items-center px-0.5 z-10 pointer-events-none py-1.5"
                                    style={{ gridRow: rowIndex + 2, gridColumn: `${barCols.startCol} / ${barCols.endCol}` }}
                                >
                                    <div className={`w-full rounded-md px-2 flex items-center shadow-sm text-[10px] font-medium text-white ${STATUS_COLORS[node.task_status?.code || "todo"]} ${depth > 0 ? "h-5 opacity-80" : "h-7"}`}>
                                        <span className="truncate">{node.name}</span>
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        )
    }

    // ─── ASSIGNEE VIEW ──────────────────────────────────────────────────────

    const renderAssigneeView = () => {
        const ASSIGNEE_COL = 1
        const TASK_COL = 2
        const DAY_OFFSET = 3
        const numCols = days.length
        const rows = assigneeViewRows

        return (
            <div className="grid" style={{ gridTemplateColumns: `180px 260px repeat(${numCols}, minmax(72px, 1fr))` }}>
                <div className="sticky left-0 top-0 z-40 bg-white dark:bg-background border-b border-r px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center">
                    Assignee
                </div>
                <div className="sticky left-[180px] top-0 z-40 bg-white dark:bg-background border-b border-r px-3 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    Task
                </div>
                {days.map((d) => {
                    const isToday = d.getTime() === startOfDay(new Date()).getTime()
                    return (
                        <div
                            key={d.toISOString()}
                            className={`sticky top-0 z-20 border-b border-r px-2 py-2 text-center ${isToday ? "bg-blue-50/50 dark:bg-blue-950/30" : "bg-white dark:bg-background"}`}
                        >
                            <div className={`text-[10px] font-medium uppercase ${isToday ? "text-blue-600" : "text-muted-foreground"}`}>
                                {d.toLocaleDateString(undefined, { weekday: "short" })}
                            </div>
                            <div className={`text-xl font-bold tabular-nums leading-tight ${isToday ? "text-blue-600" : ""}`}>
                                {d.getDate()}
                            </div>
                            <div className={`text-[10px] ${isToday ? "text-blue-500" : "text-muted-foreground/60"}`}>
                                {d.toLocaleDateString(undefined, { month: "short" })}
                            </div>
                        </div>
                    )
                })}

                {rows.length > 0 && renderTodayLine(DAY_OFFSET, rows.length)}

                {isLoading && (
                    <div style={{ gridColumn: "1 / -1", gridRow: 2 }} className="border-b p-6 text-sm text-muted-foreground flex items-center gap-2">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading tasks...
                    </div>
                )}
                {!isLoading && rows.length === 0 && (
                    <div style={{ gridColumn: "1 / -1", gridRow: 2 }} className="border-b p-10 text-center text-sm text-muted-foreground">
                        No tasks found.
                    </div>
                )}

                {!isLoading && rows.map((row, rowIndex) => {
                    const { task, isFirst, isLast, parentName, memberId } = row
                    const borderBottom = isLast ? "border-b" : ""

                    const barStart = task.created_at ? startOfDay(new Date(task.created_at)) : null
                    const barEnd = task.due_date ? startOfDay(new Date(task.due_date)) : null
                    const barCols = getBarCols(barStart, barEnd, DAY_OFFSET)

                    const rowSpan = assigneeRowSpans[rowIndex]

                    return (
                        <React.Fragment key={`${task.id}-${row.assigneeId}-${rowIndex}`}>
                            {isFirst && (
                                <div
                                    className="sticky left-0 z-30 bg-white dark:bg-background border-r border-b px-3 py-3 flex flex-col justify-start pt-4 gap-2 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"
                                    style={{ gridRow: `${rowIndex + 2} / span ${rowSpan}`, gridColumn: ASSIGNEE_COL }}
                                >
                                    <div className="flex items-center gap-2">
                                        <AssigneeAvatarItem name={row.name} photoUrl={row.photoUrl} userId={row.userId} size={6} memberId={memberId} />
                                        <span className="text-sm font-semibold truncate">{row.name}</span>
                                    </div>
                                </div>
                            )}

                            <div
                                className={`sticky left-[180px] z-30 bg-white dark:bg-background border-r px-3 py-2 flex flex-col justify-center shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] ${borderBottom}`}
                                style={{ gridRow: rowIndex + 2, gridColumn: TASK_COL }}
                            >
                                {parentName && (
                                    <div className="text-[10px] text-muted-foreground truncate mb-0.5">
                                        {parentName} <span className="text-muted-foreground/50">›</span>
                                    </div>
                                )}
                                <span className="text-xs font-medium truncate">{task.name}</span>
                                {task.project?.name && (
                                    <span className="text-[10px] text-muted-foreground truncate">{task.project.name}</span>
                                )}
                            </div>

                            {days.map((d, ci) => {
                                const isToday = d.getTime() === startOfDay(new Date()).getTime()
                                return (
                                    <div
                                        key={d.toISOString()}
                                        className={`border-r ${borderBottom} ${isToday ? "bg-blue-50/20" : ""} hover:bg-muted/20 transition-colors`}
                                        style={{ gridRow: rowIndex + 2, gridColumn: ci + DAY_OFFSET }}
                                    />
                                )
                            })}

                            {barCols && (
                                <div
                                    className="flex items-center px-0.5 z-10 pointer-events-none py-2"
                                    style={{ gridRow: rowIndex + 2, gridColumn: `${barCols.startCol} / ${barCols.endCol}` }}
                                >
                                    <div className={`w-full h-6 rounded-md px-2 flex items-center shadow-sm text-[10px] font-medium text-white ${STATUS_COLORS[task.task_status?.code || "todo"]}`}>
                                        <span className="truncate">{task.name}</span>
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        )
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="flex flex-col gap-4 p-4 pt-0 w-full h-full">
            <TasksHeader currentView="timeline" />

            <Card className="h-full border-0 shadow-none">
                <CardContent className="p-0">
                    <div className="w-full">
                        <div className="flex flex-wrap items-center gap-2 pb-4">
                            <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />

                            <div className="h-6 w-px bg-border mx-1" />

                            <div className="flex items-center gap-1 border rounded-md p-0.5 bg-muted/30">
                                <button
                                    onClick={() => setGroupBy("task")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${groupBy === "task"
                                        ? "bg-background shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <AlignLeft className="h-3.5 w-3.5" />
                                    Task
                                </button>
                                <button
                                    onClick={() => setGroupBy("assignee")}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${groupBy === "assignee"
                                        ? "bg-background shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <Users className="h-3.5 w-3.5" />
                                    Assignee
                                </button>
                            </div>

                            {groupBy === "task" && (
                                <>
                                    <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={expandAll}>
                                        <ChevronsUpDown className="h-3.5 w-3.5" />
                                        Expand All
                                    </Button>
                                    <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={collapseAll}>
                                        <ChevronsDownUp className="h-3.5 w-3.5" />
                                        Collapse All
                                    </Button>
                                </>
                            )}
                        </div>

                        <div className="w-full max-h-[calc(100vh-260px)] overflow-auto border rounded-lg">
                            <div className="min-w-max">
                                {groupBy === "task" ? renderTaskView() : renderAssigneeView()}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}