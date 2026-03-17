"use client"

import { useState } from "react"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Label } from "@/components/ui/label"
import { FilterSidebar } from "@/components/report/FilterSidebar"
import { Member } from "@/lib/data/dummy-data"

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    onApply: (filters: { memberId: string }) => void
    members: Member[]
}

export function TeamInvoicesAgingFilterSidebar({ open, onOpenChange, onApply, members }: Props) {
    const [memberId, setMemberId] = useState("all")

    const handleApply = () => {
        onApply({ memberId })
    }

    const handleClear = () => {
        setMemberId("all")
    }

    const memberOptions = [
        { value: "all", label: "All Members" },
        ...members.map(m => ({ value: m.id, label: m.name }))
    ]

    return (
        <FilterSidebar
            open={open}
            onOpenChange={onOpenChange}
            onApply={handleApply}
            onClear={handleClear}
            title="Filter Aging Report"
        >
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase">Team Member</Label>
                    <SearchableSelect
                        value={memberId}
                        onValueChange={setMemberId}
                        options={memberOptions}
                        placeholder="Select member"
                        searchPlaceholder="Search member..."
                    />
                </div>
            </div>
        </FilterSidebar>
    )
}
