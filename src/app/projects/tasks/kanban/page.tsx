"use client"

import * as React from "react"
import { useCallback, useState } from "react"
import { GripVertical, PlusCircle } from "lucide-react"
import * as Kanban from "@/components/ui/kanban"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    useTasksData,
    TasksHeader,
    StackedAssignees,
} from "@/components/tasks/tasks-shared"
import { updateTask } from "@/action/task"
import { ITask } from "@/interface"

// ── Priority badge colours ────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-blue-100 text-blue-700",
}

// ── Single Task Card ──────────────────────────────────────────────────────────
function TaskCard({ task }: { task: ITask }) {
    return (
        <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
            <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium text-gray-900 leading-snug">{task.name}</p>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: task.task_status?.color ?? "#e5e7eb" }}
                        />
                        <span
                            className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                PRIORITY_COLORS[task.priority ?? "medium"] ?? "bg-gray-100 text-gray-600"
                            )}
                        >
                            {task.priority ?? "medium"}
                        </span>
                    </div>
                    <StackedAssignees assignees={task.assignees ?? []} max={3} size={6} showLink={false} />
                </div>
            </CardContent>
        </Card>
    )
}

// ── Main Kanban Page ──────────────────────────────────────────────────────────
export default function KanbanPage() {
    const { tasks, setTasks, taskStatuses, isLoading } = useTasksData()

    // Build columns: { [statusId]: ITask[] }
    const [columns, setColumns] = useState<Record<string, ITask[]>>({})

    // Re-build columns whenever tasks or statuses change
    React.useEffect(() => {
        if (taskStatuses.length === 0) return
        const map: Record<string, ITask[]> = {}
        taskStatuses.forEach((s) => {
            map[String(s.id)] = []
        })
        tasks.forEach((task) => {
            const key = String(task.status_id)
            if (map[key]) map[key].push(task)
            else map[key] = [task]
        })
        // Sort each column by position_in_column
        Object.keys(map).forEach((k) => {
            map[k]?.sort((a, b) => (a.position_in_column ?? 0) - (b.position_in_column ?? 0))
        })
        setColumns(map)
    }, [tasks, taskStatuses])

    // (Hilangkan statusById agar tidak error unused)

    // Called by Kanban.Root whenever a card is moved
    const handleColumnsChange = useCallback(
        async (newColumns: Record<string, ITask[]>) => {
            setColumns(newColumns)

            // Find which task changed its column
            Object.entries(newColumns).forEach(async ([statusIdStr, colTasks], _colIndex) => {
                const newStatusId = Number(statusIdStr)
                colTasks.forEach(async (task, pos) => {
                    const moved = task.status_id !== newStatusId
                    const reordered = (task.position_in_column ?? 0) !== pos + 1

                    if (moved || reordered) {
                        const fd = new FormData()
                        fd.append("id", String(task.id))
                        if (moved) fd.append("status_id", String(newStatusId))
                        if (reordered) fd.append("position_in_column", String(pos + 1))
                        await updateTask(fd)

                        // Also update local task list
                        setTasks((prev) =>
                            prev.map((t) =>
                                t.id === task.id
                                    ? { ...t, status_id: newStatusId, position_in_column: pos + 1 }
                                    : t
                            )
                        )
                    }
                })
            })
        },
        [setTasks]
    )

    return (
        <div className="flex flex-col gap-4 p-4 pt-0">
            <TasksHeader currentView="board" />

            {isLoading ? (
                <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                    Loading board...
                </div>
            ) : (
                <div className="mt-4 overflow-x-auto pb-6">
                    <Kanban.Root
                        value={columns}
                        onValueChange={handleColumnsChange}
                        getItemValue={(item: ITask) => String(item.id)}
                    >
                        <Kanban.Board className="flex gap-5 w-max min-w-full">
                            {taskStatuses.map((status) => {
                                const colTasks = columns[String(status.id)] ?? []
                                return (
                                    <Kanban.Column
                                        key={status.id}
                                        value={String(status.id)}
                                        className="w-72 min-w-72 flex flex-col gap-3 bg-transparent p-0"
                                    >
                                        {/* Column Header */}
                                        <div
                                            className="rounded-lg border border-gray-200 bg-white shadow-sm px-4 py-3 flex items-center justify-between border-t-4"
                                            style={{ borderTopColor: status.color ?? "#e5e7eb" }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-sm text-gray-800">
                                                    {status.name}
                                                </h3>
                                                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                                    {colTasks.length}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Kanban.ColumnHandle asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400">
                                                        <GripVertical className="h-4 w-4" />
                                                    </Button>
                                                </Kanban.ColumnHandle>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400">
                                                    <PlusCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Task Cards Drop Zone */}
                                        <div className="flex flex-col gap-2 min-h-[400px] p-2 rounded-xl bg-gray-50/60 border border-dashed border-gray-200">
                                            {colTasks.length === 0 ? (
                                                <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                                                    No tasks
                                                </div>
                                            ) : (
                                                colTasks.map((task) => (
                                                    <Kanban.Item
                                                        key={task.id}
                                                        value={String(task.id)}
                                                        asHandle
                                                        asChild
                                                    >
                                                        <TaskCard task={task} />
                                                    </Kanban.Item>
                                                ))
                                            )}
                                        </div>
                                    </Kanban.Column>
                                )
                            })}
                        </Kanban.Board>

                        <Kanban.Overlay>
                            <div className="bg-primary/10 size-full rounded-lg border-2 border-dashed border-primary/40" />
                        </Kanban.Overlay>
                    </Kanban.Root>
                </div>
            )}
        </div>
    )
}
