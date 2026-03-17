"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { FilterSidebar } from "./FilterSidebar"
import { SearchableSelect } from "@/components/ui/searchable-select"

interface DailyLimitsFilterSidebarProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onApply?: (filters: any) => void
    className?: string
}

export function DailyLimitsFilterSidebar({ open, onOpenChange, onApply, className }: DailyLimitsFilterSidebarProps) {
    const [role, setRole] = useState("all")
    const [status, setStatus] = useState("all")
    const [day, setDay] = useState("today")

    const handleApply = () => {
        onApply?.({
            role,
            status,
            day
        })
    }

    const handleClear = () => {
        setRole("all")
        setStatus("all")
        setDay("today")
    }

    return (
        <FilterSidebar
            open={open}
            onOpenChange={onOpenChange}
            onApply={handleApply}
            onClear={handleClear}
            className={className}
        >
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Role</Label>
                <SearchableSelect
                    value={role}
                    onValueChange={setRole}
                    options={[
                        { value: "all", label: "All Roles" },
                        { value: "Owner", label: "Owner" },
                        { value: "Manager", label: "Manager" },
                        { value: "Member", label: "Member" }
                    ]}
                    placeholder="All Roles"
                    searchPlaceholder="Search role..."
                />
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Status</Label>
                <SearchableSelect
                    value={status}
                    onValueChange={setStatus}
                    options={[
                        { value: "all", label: "All Status" },
                        { value: "within", label: "Within Limit" },
                        { value: "approaching", label: "Approaching Limit" },
                        { value: "exceeded", label: "Exceeded Limit" }
                    ]}
                    placeholder="All Status"
                    searchPlaceholder="Search status..."
                />
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-500 uppercase">Day</Label>
                <SearchableSelect
                    value={day}
                    onValueChange={setDay}
                    options={[
                        { value: "today", label: "Today (Feb 4)" },
                        { value: "yesterday", label: "Yesterday (Feb 3)" }
                    ]}
                    placeholder="Select Day"
                    searchPlaceholder="Search day..."
                />
            </div>
        </FilterSidebar>
    )
}
