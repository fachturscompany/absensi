"use client"

import { useState } from "react"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Label } from "@/components/ui/label"
import { FilterSidebar } from "@/components/report/FilterSidebar"

interface TimeOffBalancesFilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onApply: (filters: { policy: string }) => void
}

const POLICIES = [
    "Annual Leave",
    "Sick Leave",
    "Personal Leave",
    "Unpaid Leave"
]

export function TimeOffBalancesFilterSidebar({
    open,
    onOpenChange,
    onApply,
}: TimeOffBalancesFilterSidebarProps) {
    const [policy, setPolicy] = useState("all")

    const handleApply = () => {
        onApply({ policy })
    }

    const handleClear = () => {
        setPolicy("all")
    }

    return (
        <FilterSidebar
            open={open}
            onOpenChange={onOpenChange}
            onApply={handleApply}
            onClear={handleClear}
            title="Filter Balances"
        >
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Leave Policy</Label>
                <SearchableSelect
                    value={policy}
                    onValueChange={setPolicy}
                    options={[
                        { value: "all", label: "All Policies" },
                        ...POLICIES.map(p => ({ value: p, label: p }))
                    ]}
                    placeholder="All Policies"
                    searchPlaceholder="Search policy..."
                />
            </div>
        </FilterSidebar>
    )
}
