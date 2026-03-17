"use client"

import { useState } from "react"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Label } from "@/components/ui/label"
import { DUMMY_MEMBERS } from "@/lib/data/dummy-data"
import { FilterSidebar } from "@/components/report/FilterSidebar"

interface TeamInvoicesFilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onApply: (filters: { memberId: string; status: string }) => void
}

export function TeamInvoicesFilterSidebar({
    open,
    onOpenChange,
    onApply,
}: TeamInvoicesFilterSidebarProps) {
    const [memberId, setMemberId] = useState("all")
    const [status, setStatus] = useState("all")

    const handleApply = () => {
        onApply({ memberId, status })
    }

    const handleClear = () => {
        setMemberId("all")
        setStatus("all")
    }

    return (
        <FilterSidebar
            open={open}
            onOpenChange={onOpenChange}
            onApply={handleApply}
            onClear={handleClear}
            title="Filter Team Invoices"
        >
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Member</Label>
                <SearchableSelect
                    value={memberId}
                    onValueChange={setMemberId}
                    options={[
                        { value: "all", label: "All Members" },
                        ...DUMMY_MEMBERS.map(m => ({ value: m.id, label: m.name }))
                    ]}
                    placeholder="All Members"
                    searchPlaceholder="Search member..."
                />
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Status</Label>
                <SearchableSelect
                    value={status}
                    onValueChange={setStatus}
                    options={[
                        { value: "all", label: "All Status" },
                        { value: "Open", label: "Open" },
                        { value: "Closed", label: "Closed" }
                    ]}
                    placeholder="All Status"
                    searchPlaceholder="Search status..."
                />
            </div>
        </FilterSidebar>
    )
}
