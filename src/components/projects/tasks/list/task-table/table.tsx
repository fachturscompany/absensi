"use client"

import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { PaginationFooter } from "@/components/tables/pagination-footer"
import { TaskRow } from "./row"
import { TaskTableProps, ListPaginationProps } from "@/types/tasks"

export function TaskTable({
    displayRows,
    isLoading,
    allSelected,
    toggleSelectAll,
    rowSelection,
    toggleSelect,
    expandedTasks,
    toggleExpand,
    setEditingTask,
    setEditedTitle,
    setEditedStatus,
    setEditedAssignee,
    setTaskToDelete,
}: TaskTableProps) {
    return (
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
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-10">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : displayRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-10">
                                    No tasks found
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayRows.map(({ node, depth }) => (
                                <TaskRow
                                    key={`${node.id}-${depth}`}
                                    node={node}
                                    depth={depth}
                                    expandedTasks={expandedTasks}
                                    rowSelection={rowSelection}
                                    toggleExpand={toggleExpand}
                                    toggleSelect={toggleSelect}
                                    setEditingTask={setEditingTask}
                                    setEditedTitle={setEditedTitle}
                                    setEditedStatus={setEditedStatus}
                                    setEditedAssignee={setEditedAssignee}
                                    setTaskToDelete={setTaskToDelete}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export function ListPagination({
    currentPage,
    totalPages,
    onPageChange,
    isLoading,
    taskTreeLength,
    pageSize,
    onPageSizeChange,
}: ListPaginationProps) {
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
            onPageSizeChange={(size: number) => onPageSizeChange(size)}
        />
    )
}
