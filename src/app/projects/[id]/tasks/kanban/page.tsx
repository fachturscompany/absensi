"use client"

import { cn } from "@/lib/utils"
import { useMemo } from "react"
import {
    useTasksData,
    TasksHeader,
    StackedAssignees,
} from "@/components/projects/tasks/header"
import { ITask } from "@/interface"

import { use } from "react"

export default function KanbanPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = use(params)
    const { tasks, taskStatuses, isLoading } = useTasksData()

    const tasksByStatus = useMemo(() => {
        const map = new Map<number, ITask[]>()
        tasks.forEach(task => {
            if (projectId && task.project_id !== Number(projectId)) return
            if (!map.has(task.status_id)) map.set(task.status_id, [])
            map.get(task.status_id)!.push(task)
        })
        return map
    }, [tasks])

    const sortedTasksByStatus = useMemo(() => {
        return taskStatuses.map(status => ({
            ...status,
            tasks: (tasksByStatus.get(status.id) || [])
                .sort((a, b) => (a.position_in_column || 0) - (b.position_in_column || 0))
        }))
    }, [tasksByStatus, taskStatuses])

    return (
        <div className="flex flex-col gap-4 p-4 pt-0">
            <TasksHeader currentView="board" />

            <div className="mt-4">
                <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
                    {sortedTasksByStatus.map((status) => (
                        <div key={status.id} className="flex-shrink-0 w-80 flex flex-col gap-4">
                            <div
                                className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-center justify-between border-t-4"
                                style={{ borderTopColor: status.color || '#e5e7eb' }}
                            >
                                <h3 className="font-semibold text-sm text-gray-900">{status.name}</h3>
                                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                    {status.tasks.length}
                                </span>
                            </div>
                            <div className="flex flex-col gap-3 min-h-[500px] p-2 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Loading...</div>
                                ) : status.tasks.length === 0 ? (
                                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">No tasks</div>
                                ) : (
                                    status.tasks.map((task: ITask) => (
                                        <div key={task.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md group">
                                            <h4 className="font-medium text-sm text-gray-900 leading-snug">{task.name}</h4>
                                            <div className="flex justify-between items-center mt-3">
                                                <div className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100")}>
                                                    <span className="w-1.5 h-1.5 rounded-full mr-1 inline-block" style={{ backgroundColor: task.task_status?.color }} />
                                                    {task.priority || "Medium"}
                                                </div>
                                                <StackedAssignees assignees={task.assignees || []} max={3} size={6} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
