"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { TableCell, TableRow } from "@/components/ui/table"
import { ChevronRight, ChevronDown, Pencil, Trash2 } from "lucide-react"
import { AssigneeAvatar } from "@/components/projects/tasks/header"
import { TaskNode } from "@/types/tasks"
import { ITask } from "@/interface"
import { RowSelectionState } from "@tanstack/react-table"
import { cn } from "@/lib/utils"

interface TaskRowProps {
    node: TaskNode
    depth: number
    expandedTasks: Set<number>
    rowSelection: RowSelectionState
    toggleExpand: (id: number) => void
    toggleSelect: (id: string) => void
    setEditingTask: (task: ITask) => void
    setEditedTitle: (t: string) => void
    setEditedStatus: (s: number | "") => void
    setEditedAssignee: (a: number | "") => void
    setTaskToDelete: (task: ITask) => void
}

export function TaskRow({
    node: task,
    depth,
    expandedTasks,
    rowSelection,
    toggleExpand,
    toggleSelect,
    setEditingTask,
    setEditedTitle,
    setEditedStatus,
    setEditedAssignee,
    setTaskToDelete,
}: TaskRowProps) {
    const hasChildren = task.children.length > 0
    const isExpanded = expandedTasks.has(task.id)
    const handleEditClick = () => {
        setEditingTask(task)
        setEditedTitle(task.name)
        setEditedStatus(task.status_id || "")
        setEditedAssignee(Number(task.assignees?.[0]?.organization_member_id) || "")
    }

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
                            {isExpanded
                                ? <ChevronDown className="h-4 w-4" />
                                : <ChevronRight className="h-4 w-4" />
                            }
                        </button>
                    )}
                    <div className="min-w-0">
                        <span className={cn(
                            "text-sm block leading-tight break-words line-clamp-2 font-medium",
                            task.task_status?.code === "done" && "text-muted-foreground line-through"
                        )}>
                            {task.name}
                        </span>
                    </div>
                </div>
            </TableCell>

            <TableCell>
                <div
                    className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase"
                    style={{
                        backgroundColor: `${task.task_status?.color}15`,
                        color: task.task_status?.color,
                    }}
                >
                    {task.task_status?.name}
                </div>
            </TableCell>

            <TableCell>
                <div className="flex -space-x-2">
                    {task.assignees?.map((asgn) => (
                        <AssigneeAvatar key={asgn.id} asgn={asgn} />
                    ))}
                </div>
            </TableCell>



            <TableCell className="text-sm">
                {task.created_at && new Date(task.created_at).toLocaleDateString()}
            </TableCell>

            <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={handleEditClick}>
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
}
