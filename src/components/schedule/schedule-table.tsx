"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Pencil, ChevronRight, Calendar, Trash } from "lucide-react"
import {
    Empty,
    EmptyHeader,
    EmptyTitle,
    EmptyDescription,
    EmptyMedia,
} from "@/components/ui/empty"
import { Checkbox } from "@/components/ui/checkbox"

import { Badge } from "@/components/ui/badge"
import { PaginationFooter } from "@/components/customs/pagination-footer"

import Link from "next/link"
import { IWorkSchedule } from "@/interface"
import { SCHEDULE_TYPES, getTimezoneLabel } from "@/constants/attendance-status"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// Extracted Components
import DeleteScheduleDialog from "./dialogs/delete-schedule-dialog"

interface ScheduleTableProps {
    items: IWorkSchedule[]
    isLoading?: boolean
    selectedIds: Set<string | number>
    onToggleSelect: (id: string | number) => void
    onToggleSelectAll: () => void
    allSelected: boolean
    onEdit: (schedule: IWorkSchedule) => void
    onDeleteSuccess: (id: string | number) => void
    organizationTimezone?: string
    // Pagination props
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    from: number
    to: number
    totalCount: number
    pageSize: number
    onPageSizeChange: (size: number) => void
}

export default function ScheduleTable({
    items,
    isLoading = false,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    allSelected,
    onEdit,
    onDeleteSuccess,
    organizationTimezone = "Asia/Jakarta",
    currentPage,
    totalPages,
    onPageChange,
    from,
    to,
    totalCount,
    pageSize,
    onPageSizeChange,
}: ScheduleTableProps) {
    return (
        <div className="space-y-4">
            <div>
                <div className="overflow-x-auto w-full mb-4">
                    <table className="w-full min-w-[880px]">
                        <thead className="sticky top-0 z-10 bg-muted/50">
                            <tr>
                                <th className="p-3 w-10">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={onToggleSelectAll}
                                        aria-label="Select all"
                                    />
                                </th>
                                <th className="p-3 text-left font-medium text-xs">Name</th>
                                <th className="p-3 text-left font-medium text-xs">Description</th>
                                <th className="p-3 text-left font-medium text-xs">Type</th>
                                <th className="p-3 text-left font-medium text-xs">Timezone</th>
                                <th className="p-3 text-left font-medium text-xs">Status</th>
                                <th className="p-3 text-left font-medium text-xs">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&>tr:nth-child(even)]:bg-muted/30">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`skel-${i}`} className="border-b">
                                        <td className="p-3 text-center"><Skeleton className="h-4 w-4 mx-auto" /></td>
                                        <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                                        <td className="p-3"><Skeleton className="h-4 w-48" /></td>
                                        <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                                        <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                                        <td className="p-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                                        <td className="p-3">
                                            <div className="flex gap-1">
                                                <Skeleton className="h-8 w-8 rounded" />
                                                <Skeleton className="h-8 w-8 rounded" />
                                                <Skeleton className="h-8 w-8 rounded" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-0">
                                        <Empty className="py-12">
                                            <EmptyHeader>
                                                <EmptyMedia variant="icon">
                                                    <Calendar className="h-14 w-14 text-muted-foreground mx-auto" />
                                                </EmptyMedia>
                                                <EmptyTitle>No schedules yet</EmptyTitle>
                                                <EmptyDescription>
                                                    There are no schedules matching your criteria.
                                                </EmptyDescription>
                                            </EmptyHeader>
                                        </Empty>
                                    </td>
                                </tr>
                            ) : (
                                items.map((ws) => (
                                    <tr
                                        key={ws.id}
                                        className={cn(
                                            "border-b transition-colors hover:bg-muted/50 cursor-pointer",
                                            selectedIds.has(ws.id) && "bg-zinc-50 dark:bg-zinc-900/50"
                                        )}
                                        onClick={() => onToggleSelect(ws.id)}
                                    >
                                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedIds.has(ws.id)}
                                                onCheckedChange={() => onToggleSelect(ws.id)}
                                                aria-label={`Select ${ws.name}`}
                                            />
                                        </td>
                                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                            <Link href={`/schedules/${ws.id}`} className="hover:underline font-medium text-sm text-primary">
                                                {ws.name}
                                            </Link>
                                        </td>
                                        <td className="p-3">
                                            <p className="font-medium text-xs text-muted-foreground">{ws.description || "-"}</p>
                                        </td>
                                        <td className="p-3">
                                            <p className="font-medium text-xs text-muted-foreground">
                                                {SCHEDULE_TYPES.find(t => t.value === ws.schedule_type)?.label || ws.schedule_type || "-"}
                                            </p>
                                        </td>
                                        <td className="p-3 text-muted-foreground text-xs font-mono">
                                            {getTimezoneLabel(organizationTimezone)}
                                        </td>
                                        <td className="p-3">
                                            <Badge
                                                className={cn(
                                                    "px-2 py-0.5 text-[10px] font-medium border-0",
                                                    ws.is_active
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                                                )}
                                            >
                                                {ws.is_active ? "Active" : "Inactive"}
                                            </Badge>
                                        </td>
                                        <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => onEdit(ws)}
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <DeleteScheduleDialog
                                                    schedule={ws}
                                                    onSuccess={onDeleteSuccess}
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            title="Delete"
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />
                                                <Link href={`/schedules/${ws.id}`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        title="Configure Work Hours"
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {!isLoading && totalCount > 0 && (
                    <PaginationFooter
                        className="mt-4"
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                        from={from}
                        to={to}
                        total={totalCount}
                        pageSize={pageSize}
                        onPageSizeChange={onPageSizeChange}
                    />
                )}
            </div>
        </div>
    )
}