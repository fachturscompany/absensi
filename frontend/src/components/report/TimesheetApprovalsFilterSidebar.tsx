"use client"

import { useState } from "react"
import { FilterSidebar, FilterSection, FilterSubsection } from "@/components/report/FilterSidebar"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { PickerItem } from "@/components/insights/types"

interface TimesheetApprovalsFilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    members: PickerItem[]
    onApply: (filters: { memberId: string; status: string }) => void
}

export function TimesheetApprovalsFilterSidebar({
    open,
    onOpenChange,
    members,
    onApply
}: TimesheetApprovalsFilterSidebarProps) {
    const [selectedMember, setSelectedMember] = useState<string>("all")
    const [selectedStatus, setSelectedStatus] = useState<string>("all")

    const handleApply = () => {
        onApply({
            memberId: selectedMember,
            status: selectedStatus
        })
        onOpenChange(false)
    }

    const handleReset = () => {
        setSelectedMember("all")
        setSelectedStatus("all")
    }

    const memberOptions = [
        { value: "all", label: "All Members" },
        ...members.map(m => ({ value: m.id, label: m.name }))
    ]

    const statusOptions = [
        { value: "all", label: "All Statuses" },
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" }
    ]

    return (
        <FilterSidebar
            open={open}
            onOpenChange={onOpenChange}
            onApply={handleApply}
            onReset={handleReset}
            onClear={handleReset}
        >
            <FilterSection title="Filters">
                <FilterSubsection title="Member" onClear={() => setSelectedMember("all")}>
                    <SearchableSelect
                        options={memberOptions}
                        value={selectedMember}
                        onValueChange={setSelectedMember}
                        placeholder="Select member"
                    />
                </FilterSubsection>

                <FilterSubsection title="Status" onClear={() => setSelectedStatus("all")}>
                    <SearchableSelect
                        options={statusOptions}
                        value={selectedStatus}
                        onValueChange={setSelectedStatus}
                        placeholder="Select status"
                    />
                </FilterSubsection>
            </FilterSection>
        </FilterSidebar>
    )
}
