"use client"

import React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/customs/search-bar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SCHEDULE_TYPES } from "@/constants/attendance-status"
import ScheduleFormDialog from "./dialogs/schedule-form-dialog"
import { IWorkSchedule } from "@/interface"

interface ScheduleTableToolbarProps {
    searchQuery: string
    onSearchChange: (value: string) => void
    typeFilter: string
    onTypeChange: (value: string) => void
    statusFilter: string
    onStatusChange: (value: string) => void
    organizationId: string
    organizationName: string
    onAddSuccess: (data: IWorkSchedule, isEdit: boolean) => void
}

export default function ScheduleTableToolbar({
    searchQuery,
    onSearchChange,
    typeFilter,
    onTypeChange,
    statusFilter,
    onStatusChange,
    organizationId,
    organizationName,
    onAddSuccess,
}: ScheduleTableToolbarProps) {
    const [isAddOpen, setIsAddOpen] = React.useState(false)

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:max-w-3xl">
                <div className="relative w-full md:max-w-sm">
                    <SearchBar
                        initialQuery={searchQuery}
                        onSearch={onSearchChange}
                        placeholder="Search schedules..."
                        className="bg-white"
                    />
                </div>

                <Select value={typeFilter} onValueChange={onTypeChange}>
                    <SelectTrigger className="w-full md:w-[140px] bg-white">
                        <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        {SCHEDULE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                                {type.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={onStatusChange}>
                    <SelectTrigger className="w-full md:w-[140px] bg-white">
                        <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <ScheduleFormDialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                organizationId={organizationId}
                organizationName={organizationName}
                editingDetail={null}
                onSuccess={onAddSuccess}
                trigger={
                    <Button
                        onClick={() => setIsAddOpen(true)}
                        className="gap-2 whitespace-nowrap bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90"
                    >
                        <Plus className="h-4 w-4" />
                        New
                    </Button>
                }
            />
        </div>
    )
}
